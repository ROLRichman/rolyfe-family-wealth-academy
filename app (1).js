const STORAGE_KEY = "rolyfeAcademyFoundationV1";
const DEFAULT_STATE = { cash: 10000, positions: [], history: [], notes: "" };
let state = loadState();

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.cash === "number") return { ...DEFAULT_STATE, ...saved };
  } catch (error) {}
  return structuredClone(DEFAULT_STATE);
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }

function showView(name) {
  document.querySelectorAll(".view").forEach(el => el.classList.toggle("active", el.id === `view-${name}`));
  document.querySelectorAll(".tab").forEach(el => el.classList.toggle("active", el.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
document.querySelectorAll("[data-jump]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.jump)));

function render() {
  $("balanceDisplay").textContent = money(state.cash);
  $("cashMetric").textContent = money(state.cash);
  $("positionsMetric").textContent = state.positions.length;
  $("tradesMetric").textContent = state.history.length;
  $("dailyNotes").value = state.notes || "";

  const positions = $("positionsList");
  if (!state.positions.length) {
    positions.className = "empty-state";
    positions.textContent = "No open positions yet. Record a simulated buy to begin.";
  } else {
    positions.className = "";
    positions.innerHTML = state.positions.map(p => `
      <div class="position">
        <strong>${escapeHtml(p.symbol)} · ${p.shares} share${p.shares === 1 ? "" : "s"}</strong>
        <small>Entry ${money(p.price)} · Position value ${money(p.price * p.shares)}</small>
        <button class="primary-btn" data-close="${p.id}" type="button">Close at a hypothetical price</button>
      </div>`).join("");
    positions.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => closePosition(btn.dataset.close)));
  }

  const history = $("historyList");
  if (!state.history.length) {
    history.className = "empty-state";
    history.textContent = "No practice trades recorded yet.";
  } else {
    history.className = "";
    history.innerHTML = [...state.history].reverse().slice(0, 30).map(t => `
      <div class="history-item">
        <strong>${escapeHtml(t.action)} · ${escapeHtml(t.symbol)} · ${t.shares} share${t.shares === 1 ? "" : "s"}</strong>
        <small>${escapeHtml(t.date)} · ${money(t.price)} per share · ${escapeHtml(t.note || "No reflection added")}</small>
      </div>`).join("");
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

function updateRiskPreview() {
  const entry = Number($("price").value);
  const stop = Number($("stop").value);
  const shares = Math.max(0, Number($("shares").value));
  const balance = state.cash;
  const budgetPct = Math.max(0, Number($("riskPct").value) || 0);
  const budget = balance * budgetPct / 100;
  if (!(entry > 0) || !(stop > 0) || !(shares > 0)) {
    $("riskPreview").textContent = `Risk budget: ${money(budget)}. Add a valid price and stop to estimate planned risk.`;
    return;
  }
  const perShareRisk = Math.abs(entry - stop);
  const estimatedRisk = perShareRisk * shares;
  $("riskPreview").textContent = `Estimated planned risk: ${money(estimatedRisk)} (${money(perShareRisk)} per share). Risk budget at ${budgetPct}% of available cash: ${money(budget)}.`;
}
["price", "stop", "shares", "riskPct"].forEach(id => $(id).addEventListener("input", updateRiskPreview));

$("tradeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const symbol = $("symbol").value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const side = $("side").value;
  const shares = Math.floor(Number($("shares").value));
  const price = Number($("price").value);
  const stop = Number($("stop").value);
  const thesis = $("thesis").value.trim();
  if (!symbol || !Number.isInteger(shares) || shares < 1 || !(price > 0)) {
    alert("Enter a ticker, a whole number of shares, and a valid hypothetical price.");
    return;
  }
  if (stop > 0 && stop >= price) {
    if (!confirm("For a long position, an invalidation/stop price is usually below the entry. Record this anyway?")) return;
  }
  const notional = shares * price;
  if (side === "buy") {
    if (notional > state.cash) {
      alert("This simulated buy exceeds available virtual cash. Reduce shares or the hypothetical price.");
      return;
    }
    state.cash -= notional;
    state.positions.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), symbol, shares, price, stop: stop > 0 ? stop : null, thesis });
    state.history.push({ action: "OPEN", symbol, shares, price, date: new Date().toLocaleString(), note: thesis || "No thesis recorded" });
  } else {
    const positionIndex = state.positions.findIndex(p => p.symbol === symbol);
    if (positionIndex < 0) {
      alert("No open simulated position with that ticker. Open a position first.");
      return;
    }
    const position = state.positions[positionIndex];
    if (shares > position.shares) {
      alert(`You have only ${position.shares} simulated share(s) open for ${symbol}.`);
      return;
    }
    state.cash += shares * price;
    position.shares -= shares;
    if (position.shares === 0) state.positions.splice(positionIndex, 1);
    state.history.push({ action: "CLOSE", symbol, shares, price, date: new Date().toLocaleString(), note: thesis || `Closed against recorded entry ${money(position.price)}` });
  }
  $("tradeForm").reset();
  $("shares").value = "1";
  $("riskPct").value = "1";
  $("thesis").value = "";
  updateRiskPreview();
  saveState();
  alert("Simulated trade recorded. No real order was placed.");
});

function closePosition(id) {
  const position = state.positions.find(p => p.id === id);
  if (!position) return;
  const answer = prompt(`Enter a hypothetical closing price for ${position.symbol} (entry ${money(position.price)}):`);
  if (answer === null) return;
  const price = Number(answer);
  if (!(price > 0)) { alert("Enter a valid price greater than zero."); return; }
  state.cash += position.shares * price;
  const pnl = (price - position.price) * position.shares;
  state.history.push({ action: "CLOSE", symbol: position.symbol, shares: position.shares, price, date: new Date().toLocaleString(), note: `Closed position; simulated price difference ${money(pnl)}` });
  state.positions = state.positions.filter(p => p.id !== id);
  saveState();
}

$("saveNotes").addEventListener("click", () => {
  state.notes = $("dailyNotes").value;
  saveState();
  $("saveStatus").textContent = "Saved locally on this device at " + new Date().toLocaleTimeString() + ".";
});
$("resetData").addEventListener("click", () => {
  if (!confirm("Reset all local practice balances, positions, trade history, and journal notes on this browser? This cannot be undone.")) return;
  state = structuredClone(DEFAULT_STATE);
  saveState();
  $("saveStatus").textContent = "Local practice data reset.";
});

render();
updateRiskPreview();
