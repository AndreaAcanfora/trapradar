// TrapRadar heuristics engine.
// Pure, side-effect-free pattern definitions + scoring helpers.
// Everything here runs locally in the content script: no network calls, no telemetry.

(function (root) {
  "use strict";

  const CATEGORIES = {
    HIDDEN_SUBSCRIPTION: "hidden_subscription",
    ADDED_COST: "added_cost",
    FAKE_URGENCY: "fake_urgency",
    CONFIRMSHAMING: "confirmshaming",
    PRECHECKED: "prechecked",
    HARD_TO_CANCEL: "hard_to_cancel",
  };

  const CATEGORY_LABELS = {
    [CATEGORIES.HIDDEN_SUBSCRIPTION]: {
      it: "Abbonamento nascosto",
      en: "Hidden subscription",
      explanation_it:
        "Il testo suggerisce un addebito ricorrente automatico dopo una prova gratuita o un primo acquisto.",
    },
    [CATEGORIES.ADDED_COST]: {
      it: "Costo aggiunto al checkout",
      en: "Drip pricing / added cost",
      explanation_it:
        "Compaiono voci di costo extra (servizio, gestione, spedizione) non evidenti nel prezzo iniziale.",
    },
    [CATEGORIES.FAKE_URGENCY]: {
      it: "Countdown o scorte sospette",
      en: "Fake urgency / scarcity",
      explanation_it:
        "Un timer o un messaggio di scarsità che potrebbe ripartire da zero ad ogni visita, senza una vera scadenza.",
    },
    [CATEGORIES.CONFIRMSHAMING]: {
      it: "Confirmshaming",
      en: "Confirmshaming",
      explanation_it:
        "Il link per rifiutare un'offerta usa un linguaggio colpevolizzante per scoraggiarti dal cliccarlo.",
    },
    [CATEGORIES.PRECHECKED]: {
      it: "Caselle pre-selezionate",
      en: "Pre-checked opt-in",
      explanation_it:
        "Una casella collegata a un costo extra, un abbonamento o l'iscrizione a comunicazioni è già selezionata.",
    },
    [CATEGORIES.HARD_TO_CANCEL]: {
      it: "Difficile disdire",
      en: "Hard to cancel",
      explanation_it:
        "Il testo descrive una procedura di disdetta più complessa dell'iscrizione (telefono, posta, più passaggi).",
    },
  };

  // Regex are case-insensitive and cover IT + EN, kept deliberately simple
  // (precision over recall for a first MVP: fewer false positives).
  const TEXT_RULES = [
    {
      category: CATEGORIES.HIDDEN_SUBSCRIPTION,
      regex:
        /\b(si rinnov\w+ automaticamente|rinnovo automatico|addebit\w+ automaticamente dopo|al termine della prova (verrai|sarai) addebitat\w+|cancella(?:lo)? (quando vuoi|in qualsiasi momento) prima che|auto[- ]?renew(s|al)?|automatically renews|will be charged after your trial|unless you cancel before)\b/i,
      weight: 2,
    },
    {
      category: CATEGORIES.ADDED_COST,
      regex:
        /\b(costi? di gestione|contributo spese|commissione di servizio|spese di servizio|tassa di prenotazione|service fee|convenience fee|booking fee|processing fee|handling fee|resort fee)\b/i,
      weight: 2,
    },
    {
      category: CATEGORIES.FAKE_URGENCY,
      regex:
        /\b(solo \d+ (rimast\w+|disponibil\w+)|ultim\w+ \d+ post\w+|offerta scade tra|l'offerta termina tra|only \d+ left|selling fast|offer ends in|deal ends in|hurry,? (only|just) \d+)\b/i,
      weight: 1,
    },
    {
      category: CATEGORIES.CONFIRMSHAMING,
      regex:
        /\b(no,? (preferisco|non voglio) (pagare|risparmiare|il prezzo pieno)|no thanks,? i (don'?t want to save|prefer to pay full price|hate (saving money|discounts))|non mi interessa risparmiare)\b/i,
      weight: 2,
    },
    {
      category: CATEGORIES.HARD_TO_CANCEL,
      regex:
        /\b(per disdire (chiama|contatta|invia)|per annullare l'abbonamento (chiama|telefona)|to cancel,? (please )?call|cancel by (phone|mail) only|disdetta solo (telefonica|via posta))\b/i,
      weight: 1,
    },
  ];

  function scanTextNode(text) {
    const findings = [];
    for (const rule of TEXT_RULES) {
      const match = text.match(rule.regex);
      if (match) {
        findings.push({
          category: rule.category,
          snippet: match[0].trim().slice(0, 160),
          weight: rule.weight,
        });
      }
    }
    return findings;
  }

  function scanCheckbox(el) {
    if (!(el instanceof HTMLInputElement) || el.type !== "checkbox") return null;
    if (!el.checked) return null;

    const label = describeControl(el).toLowerCase();
    const suspicious =
      /abbonament\w+|newsletter|offerte|partner|marketing|iscriv\w+|subscri\w+|opt[- ]?in|receive (offers|emails)|assicurazione|protezione (acquisto|viaggio)|insurance/i.test(
        label
      );
    if (!suspicious) return null;

    return {
      category: CATEGORIES.PRECHECKED,
      snippet: label.slice(0, 160) || "(checkbox senza testo associato)",
      weight: 1,
    };
  }

  function describeControl(el) {
    if (el.id) {
      const labelFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (labelFor && labelFor.textContent.trim()) return labelFor.textContent.trim();
    }
    const parentLabel = el.closest("label");
    if (parentLabel && parentLabel.textContent.trim()) return parentLabel.textContent.trim();
    const aria = el.getAttribute("aria-label");
    if (aria) return aria;
    const sibling = el.nextElementSibling;
    if (sibling && sibling.textContent && sibling.textContent.trim()) return sibling.textContent.trim();
    return "";
  }

  const api = {
    CATEGORIES,
    CATEGORY_LABELS,
    scanTextNode,
    scanCheckbox,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.TrapRadarPatterns = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
