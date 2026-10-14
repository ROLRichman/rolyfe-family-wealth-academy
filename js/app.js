// RO'Lyfe Academy — Advanced UI
(() => {
  const $ = (id) => document.getElementById(id);

  // Navigation: each tab must open its matching section.
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.view;
      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active", view.id === `view-${name}`);
      });
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Advanced mode
  $("advancedMode")?.addEventListener("change", (event) => {
    $("advancedPanel").hidden = !event.target.checked;
  });

  // External chart pop-up
  $("openChart")?.addEventListener("click", () => {
    $("chartDialog").showModal();
  });

  $("closeChart")?.addEventListener("click", () => {
    $("chartDialog").close();
  });

  $("loadChart")?.addEventListener("click", () => {
    const symbol = $("chartSymbol").value.trim().toUpperCase();
    const timeframe = $("chartTimeframe").value;
    if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
      alert("Enter a valid ticker symbol.");
      return;
    }
    // TradingView chart opens separately; no brokerage connection.
    const url = new URL("https://www.tradingview.com/chart/");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", ({
      "1D": "1D", "5D": "60", "1M": "D", "6M": "D", "1Y": "W"
    })[timeframe] || "D");
    window.open(url.href, "_blank", "noopener,noreferrer");
  });

  // External options-chain lookup. Provider may require sign-in.
  $("openOptions")?.addEventListener("click", () => {
    const symbol = ($("symbol")?.value || $("chartSymbol")?.value || "SPY")
      .trim().toUpperCase();
    const url = "https://www.nasdaq.com/market-activity/stocks/" +
      encodeURIComponent(symbol.toLowerCase()) + "/option-chain";
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // Floating educational assistant — built-in responses, not a live AI service.
  $("aiLauncher")?.addEventListener("click", () => {
    $("aiPanel").hidden = false;
    $("aiQuestion").focus();
  });

  $("closeAI")?.addEventListener("click", () => {
    $("aiPanel").hidden = true;
  });

  $("aiForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = $("aiQuestion").value.trim();
    if (!question) return;

    const messages = $("aiMessages");
    const userMessage = document.createElement("p");
    const userLabel = document.createElement("strong");
    userLabel.textContent = "You: ";
    userMessage.append(userLabel, document.createTextNode(question));
    messages.appendChild(userMessage);

    const q = question.toLowerCase();
    let answer;

    if (q.includes("risk") || q.includes("stop") || q.includes("position size")) {
      answer = "Define the price that invalidates your idea, calculate the per-share risk, and size the simulated position so the planned loss stays within your chosen risk budget.";
    } else if (q.includes("option") || q.includes("call") || q.includes("put")) {
      answer = "An option is a contract with an expiration date and strike price. Learn the difference between calls and puts, premium, time decay, implied volatility, and maximum possible loss before attempting an options simulation.";
    } else if (q.includes("journal") || q.includes("review")) {
      answer = "Record your thesis, entry, invalidation level, planned risk, exit, and whether you followed your rules. Review decision quality separately from profit or loss.";
    } else if (q.includes("chart") || q.includes("trend") || q.includes("support") || q.includes("resistance")) {
      answer = "Start with the higher timeframe, mark clear support and resistance, check trend and volume, then define an entry trigger and invalidation condition. No single indicator guarantees an outcome.";
    } else {
      answer = "Start with three questions: What is the setup? What would prove the idea wrong? How much virtual capital could be lost if the plan fails? This built-in assistant uses educational rules, not a connected AI model.";
    }

    const assistantMessage = document.createElement("p");
    const assistantLabel = document.createElement("strong");
    assistantLabel.textContent = "RO'Lyfe AI: ";
    assistantMessage.append(assistantLabel, document.createTextNode(answer));
    messages.appendChild(assistantMessage);

    $("aiQuestion").value = "";
    messages.scrollTop = messages.scrollHeight;
  });
})();
