/**
 * Notes2TeX - Extension Popup Script
 */

const BACKEND_URL = "http://127.0.0.1:8008";

const FALLBACK_SAMPLE_LATEX = `\\documentclass[11pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{geometry}
\\usepackage{tikz}
\\geometry{margin=1in}

\\title{\\textbf{CSE 320: Dynamic Memory Allocation \\& Heap Layout}}
\\author{Compiled with Notes2TeX}
\\date{Department of Computer Science}

\\begin{document}
\\maketitle

\\section{Overview \\& Alignment Constraints}
Dynamic memory allocators manage the heap segment located directly above the BSS segment:
\\begin{itemize}
    \\item \\texttt{malloc(size\\_t size)} enforces \\textbf{8-byte alignment} (or 16-byte alignment on modern systems).
    \\item Every memory block encapsulates a \\textbf{Header} and \\textbf{Footer} boundary tags storing size and allocation bit ($a=1$ or $a=0$).
    \\item In an \\textbf{Explicit Free List}, pointers to neighboring free blocks are embedded directly inside the unallocated payload area.
\\end{itemize}

\\section{Block Geometry and Address Arithmetic}
The effective size of an allocated block is determined by padding the requested payload size with header/footer boundary overhead:
\\begin{equation}
\\text{Block\\_Size} = \\max\\Big(\\text{Alignment}, \\Big\\lceil \\frac{\\text{size} + 2 \\cdot \\text{DSIZE}}{\\text{Alignment}} \\Big\\rceil \\cdot \\text{Alignment}\\Big)
\\end{equation}

\\section{Memory Layout \\& Explicit Free List Topology}
The structural diagram below illustrates the pointer relationship between an in-use allocated block and an explicit doubly linked free block node:

\\begin{center}
\\begin{tikzpicture}[node distance=1.5cm, auto, >=stealth]
  \\tikzstyle{header} = [draw=red!80, fill=red!15, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \\tikzstyle{payload} = [draw=black!70, fill=gray!10, thick, minimum width=3.5cm, minimum height=1.2cm, align=center]
  \\tikzstyle{footer} = [draw=red!80, fill=red!15, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \\tikzstyle{fheader} = [draw=green!80, fill=green!15, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \\tikzstyle{fpayload} = [draw=green!60, fill=green!5, thick, minimum width=3.5cm, minimum height=1.4cm, align=center]
  \\tikzstyle{ffooter} = [draw=green!80, fill=green!10, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]

  % Allocated Block
  \\node[header] (h1) at (0, 3) {Header: 32 bytes $\\mid$ $a=1$};
  \\node[payload, below of=h1, node distance=0.9cm] (p1) {Payload Data (16 bytes)};
  \\node[footer, below of=p1, node distance=0.9cm] (f1) {Footer: 32 bytes $\\mid$ $a=1$};
  \\node[above of=h1, node distance=0.6cm] {\\textbf{Allocated Block (32B)}};

  % Free Block
  \\node[fheader] (h2) at (5.5, 3) {Header: 64 bytes $\\mid$ $a=0$};
  \\node[fpayload, below of=h2, node distance=1.0cm] (p2) {Explicit Pointer Node\\\\$\\bullet$ \\texttt{*next\\_free} $\\to$\\\\$\\bullet$ \\texttt{*prev\\_free} $\\leftarrow$};
  \\node[ffooter, below of=p2, node distance=1.0cm] (f2) {Footer: 64 bytes $\\mid$ $a=0$};
  \\node[above of=h2, node distance=0.6cm] {\\textbf{Free List Block (64B)}};

  % Arrows
  \\draw[->, ultra thick, blue!80] (p1.east) -- node[above] {\\texttt{next\\_free}} (h2.west);
  \\draw[<-, dashed, thick, blue!60] (f1.east) -- ++(1,0) -- ++(0,-0.5) -- ++(2.5,0) -- (f2.west);
\\end{tikzpicture}
\\end{center}

\\end{document}
`;

document.addEventListener("DOMContentLoaded", async () => {
  const overleafBadge = document.getElementById("overleaf-badge");
  const backendBadge = document.getElementById("backend-badge");
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

  // 3. Inject Demo Sample button (CSE 320 Virtual Memory & Heap Layout)
  btnSample.addEventListener("click", async () => {
    loader.style.display = "block";
    try {
      let latex = FALLBACK_SAMPLE_LATEX;
      let label = "CSE 320 Virtual Memory & Heap Layout";

      try {
        const res = await fetch(`${BACKEND_URL}/api/samples`);
        if (res.ok) {
          const data = await res.json();
          const sample = data.samples?.[0];
          if (sample?.latex_full) latex = sample.latex_full;
          if (sample?.title) label = sample.title;
        }
      } catch (e) {
        // Fallback to built-in CSE sample when backend is offline
      }

      const tabs = await chrome.tabs.query({ url: "*://*.overleaf.com/project/*" });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "INJECT_LATEX",
          latex: latex,
          label: label
        });
        window.close();
      } else {
        navigator.clipboard.writeText(latex);
        alert("Copied CSE 320 LaTeX & TikZ sample to clipboard! (Open an Overleaf project tab to inject directly at cursor).");
      }
    } catch (err) {
      alert("Error injecting sample: " + err.message);
    } finally {
      loader.style.display = "none";
    }
  });

  // 4. Upload Photo & Inject button
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
