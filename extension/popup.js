/**
 * Notes2TeX - Extension Popup Script
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
      const latex = sample?.latex_full || "% Notes2TeX Sample Notes\n";

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
      let res;
      try {
        res = await fetch(`http://127.0.0.1:8008/api/process`, {
          method: "POST",
          body: formData
        });
      } catch (err1) {
        res = await fetch(`http://localhost:8008/api/process`, {
          method: "POST",
          body: formData
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const latex = data?.study_guide?.latex_full || "% Compiled with Notes2TeX\n";

      const isPdf = data?.pdf_info?.is_pdf;
      const totalPages = data?.pdf_info?.total_pages || 1;
      const noteLabel = isPdf && totalPages > 1
        ? `${data?.study_guide?.title || "PDF Document"} (Page 1 of ${totalPages})`
        : (data?.study_guide?.title || "Uploaded Notes");

      const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "INJECT_LATEX",
          latex: latex,
          label: noteLabel
        });
        window.close();
      } else {
        navigator.clipboard.writeText(latex);
        const pageMsg = isPdf && totalPages > 1 ? ` (Page 1 of ${totalPages})` : "";
        alert(`Compiled successfully${pageMsg}! (No active Overleaf tab open, copied LaTeX to your clipboard).`);
      }
    } catch (err) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        alert("Cannot connect to Notes2TeX backend!\nMake sure './start.sh' is running on port 8008.");
      } else {
        alert("Error compiling image: " + err.message);
      }
    } finally {
      loader.style.display = "none";
    }
  });
});
