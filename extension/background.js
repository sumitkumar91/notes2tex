/**
 * Notes2TeX - Background Service Worker (Manifest V3)
 * Orchestrates extension lifecycle and background coordination.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Notes2TeX] Extension installed successfully.");
});
