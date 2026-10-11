/**
 * Board2TeX - On-Screen Snipping Tool Overlay
 * Allows user to drag-select an area of their screen to compile directly into Overleaf.
 */

(function () {
  if (document.getElementById("board2tex-snipper-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "board2tex-snipper-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.4);
    cursor: crosshair;
    z-index: 99999999;
    user-select: none;
  `;

  const banner = document.createElement("div");
  banner.style.cssText = `
    position: fixed;
    top: 20px; left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    border: 1px solid #38bdf8;
    color: #f8fafc;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-family: sans-serif;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  `;
  banner.innerHTML = "<span>📐 Board2TeX:</span> Drag a rectangle over notes or equations (Press Esc to cancel)";
  overlay.appendChild(banner);

  const box = document.createElement("div");
  box.style.cssText = `
    position: absolute;
    border: 2px dashed #38bdf8;
    background: rgba(56, 189, 248, 0.15);
    display: none;
    pointer-events: none;
    border-radius: 4px;
  `;
  overlay.appendChild(box);

  let startX = 0, startY = 0, isDragging = false;

  function onMouseDown(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    box.style.width = "0px";
    box.style.height = "0px";
    box.style.display = "block";
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    overlay.remove();
    cleanupEvents();

    if (w > 20 && h > 20) {
      // Send crop bounds to background script
      const dpr = window.devicePixelRatio || 1;
      chrome.runtime.sendMessage({
        action: "PROCESS_SNIP_AREA",
        bounds: {
          x: Math.round(x * dpr),
          y: Math.round(y * dpr),
          width: Math.round(w * dpr),
          height: Math.round(h * dpr)
        }
      });
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      overlay.remove();
      cleanupEvents();
    }
  }

  function cleanupEvents() {
    overlay.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
  }

  overlay.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);

  document.body.appendChild(overlay);
})();
