/**
 * Notes2TeX - Overleaf Editor Injection Content Script
 * Injects compiled LaTeX and TikZ directly into the active Overleaf CodeMirror/Ace editor.
 */

// Listen for messages from popup or background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "INJECT_LATEX") {
    const success = injectIntoOverleaf(message.latex);
    showInjectionToast(success, message.label || "LaTeX");
    sendResponse({ success });
  } else if (message.action === "PING_OVERLEAF") {
    sendResponse({ active: true, title: document.title });
  }
  return true;
});

function injectIntoOverleaf(latexText) {
  if (!latexText) return false;

  // 1. Try modern Overleaf CodeMirror 6 (.cm-content)
  const cmContent = document.querySelector(".cm-content");
  if (cmContent) {
    cmContent.focus();
    // Use document.execCommand to maintain CodeMirror state, undo history, and syntax coloring
    const inserted = document.execCommand("insertText", false, "\n" + latexText + "\n");
    if (inserted) return true;

    // Fallback: Dispatch synthetic input events
    try {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode("\n" + latexText + "\n");
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        cmContent.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }
    } catch (e) {
      console.warn("[Notes2TeX] Range insertion fallback:", e);
    }
  }

  // 2. Try Legacy Ace Editor (.ace_text-input or ace editor instance)
  const aceInput = document.querySelector("textarea.ace_text-input");
  if (aceInput) {
    aceInput.focus();
    return document.execCommand("insertText", false, "\n" + latexText + "\n");
  }

  // 3. Try any active focused editable element
  const active = document.activeElement;
  if (active && (active.isContentEditable || active.tagName === "TEXTAREA")) {
    active.focus();
    return document.execCommand("insertText", false, "\n" + latexText + "\n");
  }

  return false;
}

function showInjectionToast(success, label) {
  const existing = document.getElementById("notes2tex-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "notes2tex-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    padding: 12px 18px;
    border-radius: 12px;
    background: ${success ? "rgba(15, 23, 42, 0.95)" : "rgba(69, 10, 10, 0.95)"};
    border: 1px solid ${success ? "rgba(56, 189, 248, 0.5)" : "rgba(239, 68, 68, 0.5)"};
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
  `;

  const text = success
    ? `<strong>Notes2TeX:</strong> Injected ${label} into Overleaf.`
    : `<strong>Notes2TeX:</strong> Click inside Overleaf editor first.`;

  toast.innerHTML = `<span>${text}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
