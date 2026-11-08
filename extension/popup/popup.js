// Popup UI: asks the active tab's content script for its current findings
// and renders them with a plain-language explanation. No background fetch,
// no storage of page content beyond what content.js already keeps in memory.

(function () {
  "use strict";

  const runtime = typeof browser !== "undefined" ? browser : chrome;
  const CATEGORY_LABELS = window.TrapRadarPatterns ? window.TrapRadarPatterns.CATEGORY_LABELS : null;

  const statusEl = document.getElementById("status");
  const listEl = document.getElementById("findings");
  const emptyEl = document.getElementById("empty");

  async function main() {
    const [tab] = await runtime.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      statusEl.textContent = "Nessuna scheda attiva.";
      return;
    }

    runtime.tabs.sendMessage(tab.id, { type: "trapradar:request_findings" }, (response) => {
      if (runtime.runtime.lastError || !response) {
        statusEl.textContent =
          "Impossibile analizzare questa pagina (potrebbe essere una pagina interna del browser).";
        return;
      }
      render(response.findings || []);
    });
  }

  function render(findings) {
    statusEl.hidden = true;
    if (findings.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    for (const f of findings) {
      const label = CATEGORY_LABELS && CATEGORY_LABELS[f.category];
      const li = document.createElement("li");
      li.className = "finding" + (f.weight >= 2 ? " severe" : "");

      const h2 = document.createElement("h2");
      h2.textContent = label ? label.it : f.category;
      li.appendChild(h2);

      const p = document.createElement("p");
      p.textContent = label ? label.explanation_it : "";
      li.appendChild(p);

      if (f.snippet) {
        const snip = document.createElement("p");
        snip.className = "snippet";
        snip.textContent = "“" + f.snippet + "”";
        li.appendChild(snip);
      }

      listEl.appendChild(li);
    }
  }

  main();
})();
