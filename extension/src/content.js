// TrapRadar content script.
// Runs on every page, scans visible text + form controls against local
// heuristics (src/patterns.js), tracks suspicious countdowns across reloads
// using chrome.storage.local, and reports a per-tab finding list to the
// popup / background badge. Nothing is sent off-device.

(function () {
  "use strict";

  const runtime = typeof browser !== "undefined" ? browser : chrome;
  const { CATEGORIES, CATEGORY_LABELS, scanTextNode, scanCheckbox } = window.TrapRadarPatterns;

  const MAX_FINDINGS = 40;
  const findings = [];
  const seenSnippets = new Set();

  function addFinding(finding) {
    const key = finding.category + "::" + finding.snippet;
    if (seenSnippets.has(key)) return;
    if (findings.length >= MAX_FINDINGS) return;
    seenSnippets.add(key);
    findings.push(finding);
    reportFindings();
  }

  function reportFindings() {
    runtime.runtime.sendMessage({
      type: "trapradar:findings",
      url: location.href,
      count: findings.length,
      findings,
    }).catch(() => {});
  }

  // --- Text scan -------------------------------------------------------

  function scanTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.nodeValue;
        if (!text || text.trim().length < 6) return NodeFilter.FILTER_REJECT;
        const parentTag = node.parentElement && node.parentElement.tagName;
        if (parentTag === "SCRIPT" || parentTag === "STYLE" || parentTag === "NOSCRIPT") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    let scanned = 0;
    const LIMIT = 4000; // guard against pathological pages
    while ((node = walker.nextNode()) && scanned < LIMIT) {
      scanned++;
      const results = scanTextNode(node.nodeValue);
      for (const r of results) addFinding(r);
    }
  }

  // --- Checkbox scan -----------------------------------------------------

  function scanCheckboxes(root) {
    const boxes = root.querySelectorAll ? root.querySelectorAll('input[type="checkbox"]') : [];
    for (const box of boxes) {
      const result = scanCheckbox(box);
      if (result) addFinding(result);
    }
  }

  // --- Countdown detection ------------------------------------------------
  // Heuristic: find elements whose text looks like a live countdown
  // (hh:mm:ss or "Xg Xh Xm" style) and whose value decreases over time.
  // Store the first-seen deadline per (hostname + element signature) in
  // storage.local; if the *same* page shows a *different* (typically later)
  // deadline on a later visit, flag it as a likely fake/reset timer.

  const COUNTDOWN_REGEX = /\b(\d{1,2}:\d{2}:\d{2}|\d{1,3}\s*(g|gg|giorni|days|d)\s+\d{1,2}\s*(h|ore|hours)\b)/i;

  function signatureFor(el) {
    const path = [];
    let node = el;
    for (let depth = 0; node && depth < 5; depth++) {
      const tag = node.tagName ? node.tagName.toLowerCase() : "";
      const cls = node.className && typeof node.className === "string" ? node.className.split(/\s+/)[0] : "";
      path.unshift(cls ? `${tag}.${cls}` : tag);
      node = node.parentElement;
    }
    return path.join(">");
  }

  function parseDurationSeconds(text) {
    const hms = text.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (hms) return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
    return null;
  }

  async function checkCountdowns() {
    const candidates = [];
    const all = document.querySelectorAll("body *");
    let checked = 0;
    for (const el of all) {
      if (checked > 3000) break;
      if (el.children.length > 0) continue; // leaf nodes only
      const text = el.textContent && el.textContent.trim();
      if (!text || !COUNTDOWN_REGEX.test(text)) continue;
      checked++;
      candidates.push({ el, text });
    }
    if (candidates.length === 0) return;

    const host = location.hostname;
    const storageKey = "trapradar:countdowns:" + host;
    const stored = await runtime.storage.local.get(storageKey);
    const record = stored[storageKey] || {};
    const now = Date.now();
    let changed = false;

    for (const { el, text } of candidates.slice(0, 20)) {
      const sig = signatureFor(el);
      const seconds = parseDurationSeconds(text);
      if (seconds === null) continue;
      const deadline = now + seconds * 1000;
      const prior = record[sig];

      if (prior) {
        const driftMs = Math.abs(deadline - prior.deadline);
        // If on a fresh visit (>2 min since first seen) the countdown still
        // shows roughly the same time left, it never really moved forward.
        const sinceFirstSeen = now - prior.firstSeen;
        if (sinceFirstSeen > 2 * 60 * 1000 && driftMs < 90 * 1000) {
          addFinding({
            category: CATEGORIES.FAKE_URGENCY,
            snippet: `Timer "${text.trim().slice(0, 60)}" mostra sempre la stessa scadenza residua ad ogni visita: probabile countdown non reale.`,
            weight: 2,
          });
        }
      } else {
        record[sig] = { deadline, firstSeen: now };
        changed = true;
      }
    }

    if (changed) {
      await runtime.storage.local.set({ [storageKey]: record });
    }
  }

  // --- Run ----------------------------------------------------------------

  function runScan() {
    scanTextNodes(document.body);
    scanCheckboxes(document);
    checkCountdowns().catch(() => {});
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    runScan();
  } else {
    window.addEventListener("DOMContentLoaded", runScan, { once: true });
  }

  // Re-scan on major DOM changes (SPA checkout flows render late).
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runScan, 800);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Answer popup requests for the current findings snapshot.
  runtime.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "trapradar:request_findings") {
      sendResponse({ url: location.href, count: findings.length, findings });
    }
  });
})();
