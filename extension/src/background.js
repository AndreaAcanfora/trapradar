// TrapRadar background service worker.
// Only job: keep the toolbar badge in sync with per-tab findings.
// No network access, no external messaging.

const runtime = typeof browser !== "undefined" ? browser : chrome;

const countsByTab = new Map();

runtime.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== "trapradar:findings") return;
  const tabId = sender.tab && sender.tab.id;
  if (tabId == null) return;

  countsByTab.set(tabId, message.count || 0);
  updateBadge(tabId, message.count || 0);
});

runtime.tabs.onRemoved.addListener((tabId) => {
  countsByTab.delete(tabId);
});

runtime.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    countsByTab.delete(tabId);
    updateBadge(tabId, 0);
  }
});

function updateBadge(tabId, count) {
  const text = count > 0 ? String(count) : "";
  const color = count > 3 ? "#dc2626" : count > 0 ? "#f59e0b" : "#16a34a";
  runtime.action.setBadgeText({ tabId, text }).catch(() => {});
  runtime.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
}
