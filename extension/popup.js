/**
 * Board2TeX - Extension Popup Script
 */

const BACKEND_URL = "http://127.0.0.1:8008";

document.addEventListener("DOMContentLoaded", async () => {
  const overleafBadge = document.getElementById("overleaf-badge");
  const backendBadge = document.getElementById("backend-badge");
  const btnSnip = document.getElementById("btn-snip");
  const btnSample = document.getElementById("btn-sample");
  const btnUpload = document.getElementById("btn-upload");
  const fileInput = document.getElementById("file-input");
  const loader = document.getElementById("loader");

  // 1. Check for active Overleaf tabs
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
    if (tabs && tabs.length > 0) {
      overleafBadge.textContent = "Connected (" + tabs.length + ")";
      overleafBadge.className = "badge badge-ok";
    } else {
      overleafBadge.textContent = "Open an Overleaf tab";
      overleafBadge.className = "badge badge-warn";
    }
  } catch (e) {
    overleafBadge.textContent = "Overleaf Tab Not Found";
  }

  // 2. Check Backend Health
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (res.ok) {
      backendBadge.textContent = "Active (8008)";
      backendBadge.className = "badge badge-ok";
    } else {
      backendBadge.textContent = "Offline";
      backendBadge.className = "badge badge-warn";
    }
  } catch (e) {
    backendBadge.textContent = "Offline";
    backendBadge.className = "badge badge-warn";
  }

  // 3. Snip Area button
  btnSnip.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "TRIGGER_SNIP" });
    window.close();
  });

  // 4. Inject Demo Sample button (CSE 320 Virtual Memory & Heap Layout)
  btnSample.addEventListener("click", async () => {
    loader.style.display = "block";
    try {
      const res = await fetch(`${BACKEND_URL}/api/samples`);
      const data = await res.json();
      const sample = data.samples?.[0];
      const latex = sample?.latex_full || "% Board2TeX Sample Notes\n";

      const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "INJECT_LATEX",
          latex: latex,
          label: sample?.title || "Demo Notes"
        });
        window.close();
      } else {
        alert("Please open an Overleaf project tab first!");
      }
    } catch (err) {
      alert("Error injecting sample: " + err.message);
    } finally {
      loader.style.display = "none";
    }
  });

  // 5. Upload Photo & Inject button
  btnUpload.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loader.style.display = "block";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/process`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      const latex = data?.study_guide?.latex_full || "% Compiled with Board2TeX\n";

      const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "INJECT_LATEX",
          latex: latex,
          label: data?.study_guide?.title || "Uploaded Notes"
        });
        window.close();
      } else {
        navigator.clipboard.writeText(latex);
        alert("No Overleaf tab open. Copied compiled LaTeX to your clipboard!");
      }
    } catch (err) {
      alert("Error compiling image: " + err.message);
    } finally {
      loader.style.display = "none";
    }
  });
});
