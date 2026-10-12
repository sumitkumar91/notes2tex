/**
 * Notes2TeX - Background Service Worker (Manifest V3)
 * Orchestrates screen capture, backend communication, and Overleaf tab injection.
 */

const BACKEND_URL = "http://127.0.0.1:8008";

// Listen for keyboard command (Cmd+Shift+X)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "snip_to_overleaf") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["snipper.js"]
      });
    }
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRIGGER_SNIP") {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["snipper.js"]
        });
      }
    });
    sendResponse({ started: true });
  } else if (request.action === "PROCESS_SNIP_AREA") {
    handleCroppedArea(request.bounds);
  }
  return true;
});

async function handleCroppedArea(bounds) {
  try {
    // 1. Capture the full screen visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });

    // 2. Crop image to selected bounds using canvas
    const croppedBase64 = await cropImageData(dataUrl, bounds);

    // 3. Send to Notes2TeX backend
    const res = await fetch(`${BACKEND_URL}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: croppedBase64 })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Backend processing failed");
    }

    const latexText = data?.study_guide?.latex_full || "% Compiled with Notes2TeX\n";

    // 4. Find Overleaf tab and inject
    const overleafTabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
    if (overleafTabs.length > 0) {
      const targetTab = overleafTabs[0];
      // Focus the Overleaf tab
      await chrome.tabs.update(targetTab.id, { active: true });
      await chrome.windows.update(targetTab.windowId, { focused: true });

      // Send injection message
      chrome.tabs.sendMessage(targetTab.id, {
        action: "INJECT_LATEX",
        latex: latexText,
        label: data?.study_guide?.title || "LaTeX"
      });
    } else {
      // Fallback: Copy to clipboard if no Overleaf tab is open
      console.warn("[Notes2TeX] No active Overleaf tab found.");
    }
  } catch (err) {
    console.error("[Notes2TeX] Snipping error:", err);
  }
}

// Crops base64 image data using OffscreenCanvas or createImageBitmap
async function cropImageData(fullDataUrl, bounds) {
  const response = await fetch(fullDataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // Use OffscreenCanvas available in Manifest V3 service workers
  const canvas = new OffscreenCanvas(bounds.width, bounds.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    imageBitmap,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );

  const croppedBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}
