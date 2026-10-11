"""
Board2TeX - Pre-packaged Real STEM Lecture Whiteboard Samples
Generates realistic whiteboard imagery with authentic marker textures,
accompanied by pre-parsed LaTeX math, TikZ diagrams, and SVG vectors.
"""

import base64
import numpy as np
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Dict, Any, List


def generate_cse320_whiteboard_image() -> str:
    """
    Renders a realistic dry-erase whiteboard for CSE 320: Virtual Memory & Heap Allocation.
    Features text notes, pointer arithmetic equations, and a linked-list memory chunk diagram.
    """
    w, h = 1000, 650
    # Whiteboard off-white background with subtle lighting gradient
    img = Image.new("RGB", (w, h), (248, 250, 252))
    draw = ImageDraw.Draw(img)

    # Draw whiteboard aluminum frame edge
    draw.rectangle([0, 0, w, 12], fill=(203, 213, 225))
    draw.rectangle([0, h-12, w, h], fill=(148, 163, 184))
    draw.rectangle([0, 0, 10, h], fill=(203, 213, 225))
    draw.rectangle([w-10, 0, w, h], fill=(203, 213, 225))

    # Marker colors: Blue, Red, Green, Black
    c_blue = (29, 78, 216)
    c_dark = (30, 41, 59)
    c_red = (220, 38, 38)
    c_green = (22, 101, 52)
    c_gray = (100, 116, 139)

    # 1. Header / Lecture Title (Black/Blue Marker)
    draw.text((40, 30), "CSE 320: Dynamic Memory Allocation (Heap Layout)", fill=c_blue)
    draw.line([(40, 55), (600, 55)], fill=c_blue, width=3)

    # 2. Text Bullet Points (Black Marker)
    draw.text((45, 80), "* malloc(size_t size): 8-byte aligned payload", fill=c_dark)
    draw.text((45, 110), "* Header/Footer format: [ Size (29 bits) | a/f (3 bits) ]", fill=c_dark)
    draw.text((45, 140), "* Explicit Free List: Pointers stored directly inside free payload blocks", fill=c_dark)

    # 3. Mathematical Formula (Math block - Green/Red Marker)
    draw.text((45, 185), "Address Calculation & Boundary Tag Overhead:", fill=c_gray)
    draw.rectangle([45, 210, 430, 310], outline=(186, 230, 253), fill=(240, 249, 255), width=2)
    draw.text((60, 225), "Block_Size = max( Alignment, round_up(size + 2 * DSIZE) )", fill=c_green)
    draw.text((60, 255), "Effective Utilization:  U = (sum(payload)) / (H_curr - H_base)", fill=c_red)
    draw.text((60, 285), "Fragmentation Ratio:    phi = 1.0 - (max_free_block / total_free)", fill=c_dark)

    # 4. Hand-drawn Memory Diagram (Diagram block)
    # Memory chunk block 1: Allocated Block
    draw.rectangle([500, 120, 700, 220], outline=c_dark, width=3)
    draw.rectangle([500, 120, 700, 150], fill=(254, 226, 226), outline=c_red, width=2)
    draw.text((520, 128), "Header: 32 bytes | a=1", fill=c_red)
    draw.text((540, 170), "Payload [16B]", fill=c_dark)
    draw.rectangle([500, 195, 700, 220], fill=(254, 226, 226), outline=c_red, width=2)
    draw.text((520, 200), "Footer: 32 bytes | a=1", fill=c_red)

    # Pointer arrow pointing to Block 2
    draw.line([(700, 170), (760, 170)], fill=c_blue, width=3)
    draw.polygon([(760, 165), (775, 170), (760, 175)], fill=c_blue)
    draw.text((705, 150), "next_free", fill=c_blue)

    # Memory chunk block 2: Free Block with Explicit Pointers
    draw.rectangle([780, 120, 960, 260], outline=c_dark, width=3)
    draw.rectangle([780, 120, 960, 150], fill=(220, 252, 231), outline=c_green, width=2)
    draw.text((795, 128), "Header: 64 bytes | a=0", fill=c_green)
    draw.text((800, 165), "*next_free ptr", fill=c_blue)
    draw.text((800, 195), "*prev_free ptr", fill=c_blue)
    draw.rectangle([780, 230, 960, 260], fill=(220, 252, 231), outline=c_green, width=2)
    draw.text((795, 238), "Footer: 64 bytes | a=0", fill=c_green)

    # Second row of notes (Coalescing algorithm)
    draw.text((45, 340), "Coalescing Cases (Case 1..4):", fill=c_blue)
    draw.text((60, 370), "Case 1: prev_alloc == 1, next_alloc == 1  --> No coalescing", fill=c_dark)
    draw.text((60, 400), "Case 2: prev_alloc == 1, next_alloc == 0  --> Merge with next", fill=c_dark)
    draw.text((60, 430), "Case 3: prev_alloc == 0, next_alloc == 1  --> Merge with prev", fill=c_dark)
    draw.text((60, 460), "Case 4: prev_alloc == 0, next_alloc == 0  --> Merge prev + next", fill=c_dark)

    # Hand-drawn Coalescing Flow Diagram (Bottom right)
    draw.ellipse([540, 360, 680, 430], outline=c_dark, width=3)
    draw.text((565, 390), "Free Block", fill=c_dark)
    draw.line([(680, 395), (740, 395)], fill=c_red, width=3)
    draw.polygon([(740, 390), (755, 395), (740, 400)], fill=c_red)
    draw.text((685, 375), "Coalesce", fill=c_red)

    draw.rectangle([760, 360, 940, 430], outline=c_green, width=3)
    draw.text((780, 390), "Unified Chunk", fill=c_green)

    # Add subtle realistic whiteboard eraser smudge / glare
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.ellipse([700, 50, 980, 300], fill=(255, 255, 255, 35))  # Fluorescent light glare
    ov_draw.line([(50, 520), (400, 520)], fill=(203, 213, 225, 40), width=15) # dry eraser streak
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # Slight blur to mimic phone camera lens
    img = img.filter(ImageFilter.GaussianBlur(radius=0.4))

    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=92)
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def get_sample_cse320_payload() -> Dict[str, Any]:
    """
    Returns complete parsed study guide data for CSE 320 Virtual Memory.
    """
    tikz_code = r"""\begin{tikzpicture}[font=\sffamily\small, node distance=1.8cm, auto]
  % Styles
  \tikzstyle{header} = [draw=red!80, fill=red!10, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \tikzstyle{payload} = [draw=gray!80, fill=gray!5, thick, minimum width=3.5cm, minimum height=1.2cm, align=center]
  \tikzstyle{footer} = [draw=red!80, fill=red!10, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \tikzstyle{fheader} = [draw=green!80, fill=green!10, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]
  \tikzstyle{fpayload} = [draw=green!60, fill=green!5, thick, minimum width=3.5cm, minimum height=1.4cm, align=center]
  \tikzstyle{ffooter} = [draw=green!80, fill=green!10, thick, minimum width=3.5cm, minimum height=0.6cm, align=center]

  % Allocated Block
  \node[header] (h1) at (0, 3) {Header: 32 bytes $\mid$ $a=1$};
  \node[payload, below of=h1, node distance=0.9cm] (p1) {Payload Data (16 bytes)};
  \node[footer, below of=p1, node distance=0.9cm] (f1) {Footer: 32 bytes $\mid$ $a=1$};
  \node[above of=h1, node distance=0.6cm] {\textbf{Allocated Block (32B)}};

  % Free Block
  \node[fheader] (h2) at (5.5, 3) {Header: 64 bytes $\mid$ $a=0$};
  \node[fpayload, below of=h2, node distance=1.0cm] (p2) {Explicit Pointer Node\\$\bullet$ \texttt{*next\_free} $\to$\\$\bullet$ \texttt{*prev\_free} $\leftarrow$};
  \node[ffooter, below of=p2, node distance=1.0cm] (f2) {Footer: 64 bytes $\mid$ $a=0$};
  \node[above of=h2, node distance=0.6cm] {\textbf{Free List Block (64B)}};

  % Arrows
  \draw[->, ultra thick, blue!80] (p1.east) -- node[above] {\texttt{next\_free}} (h2.west);
  \draw[<-, dashed, thick, blue!60] (f1.east) -- ++(1,0) -- ++(0,-0.5) -- ++(2.5,0) -- (f2.west);
\end{tikzpicture}"""

    svg_diagram = """<svg viewBox="0 0 700 240" class="w-full h-auto bg-slate-900 rounded-lg p-3 text-slate-100 font-sans border border-slate-700">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
    </marker>
  </defs>
  <!-- Block 1: Allocated -->
  <g transform="translate(40, 20)">
    <text x="75" y="0" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="600">ALLOCATED BLOCK (32B)</text>
    <rect x="0" y="10" width="150" height="30" rx="3" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="2"/>
    <text x="75" y="30" text-anchor="middle" fill="#fca5a5" font-size="11">Header: 32B | a=1</text>
    
    <rect x="0" y="44" width="150" height="60" rx="3" fill="#334155" fill-opacity="0.4" stroke="#64748b" stroke-width="1.5"/>
    <text x="75" y="78" text-anchor="middle" fill="#e2e8f0" font-size="12">Payload (16 Bytes)</text>

    <rect x="0" y="108" width="150" height="30" rx="3" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="2"/>
    <text x="75" y="128" text-anchor="middle" fill="#fca5a5" font-size="11">Footer: 32B | a=1</text>
  </g>

  <!-- Pointer Arrow -->
  <path d="M 195 95 L 340 95" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow)" stroke-dasharray="4,2"/>
  <text x="265" y="85" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="600">next_free ptr</text>

  <!-- Block 2: Free Block -->
  <g transform="translate(350, 20)">
    <text x="85" y="0" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="600">EXPLICIT FREE BLOCK (64B)</text>
    <rect x="0" y="10" width="170" height="30" rx="3" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="2"/>
    <text x="85" y="30" text-anchor="middle" fill="#86efac" font-size="11">Header: 64B | a=0</text>
    
    <rect x="0" y="44" width="170" height="70" rx="3" fill="#14532d" fill-opacity="0.3" stroke="#22c55e" stroke-width="1.5"/>
    <text x="85" y="72" text-anchor="middle" fill="#86efac" font-size="11">&bull; *next_free [8B]</text>
    <text x="85" y="94" text-anchor="middle" fill="#86efac" font-size="11">&bull; *prev_free [8B]</text>

    <rect x="0" y="118" width="170" height="30" rx="3" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="2"/>
    <text x="85" y="138" text-anchor="middle" fill="#86efac" font-size="11">Footer: 64B | a=0</text>
  </g>

  <!-- Coalescing annotation -->
  <g transform="translate(540, 50)">
    <circle cx="60" cy="40" r="38" fill="#6366f1" fill-opacity="0.2" stroke="#6366f1" stroke-width="2"/>
    <text x="60" y="36" text-anchor="middle" fill="#c7d2fe" font-size="11" font-weight="600">Boundary Tag</text>
    <text x="60" y="52" text-anchor="middle" fill="#c7d2fe" font-size="10">O(1) Coalesce</text>
  </g>
</svg>"""

    latex_document = r"""\documentclass[11pt, a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath, amssymb, amsthm}
\usepackage{geometry}
\usepackage{tikz}
\usepackage{tcolorbox}
\usepackage{hyperref}
\geometry{margin=1in}

\title{\textbf{CSE 320: Dynamic Memory Allocation \& Heap Layout}}
\author{Compiled with Board2TeX}
\date{Stony Brook University $\cdot$ Department of Computer Science}

\begin{document}
\maketitle

\section{Overview \& Alignment Constraints}
Dynamic memory allocators manage the heap segment located directly above the BSS segment. In 64-bit x86 systems:
\begin{itemize}
    \item \texttt{malloc(size\_t size)} enforces \textbf{8-byte alignment} (or 16-byte alignment on modern glibc).
    \item Every memory block encapsulates a \textbf{Header} and \textbf{Footer} (boundary tags) storing size and allocation status.
    \item In an \textbf{Explicit Free List}, pointers to neighboring free blocks are embedded directly inside the unallocated payload area.
\end{itemize}

\section{Block Geometry and Address Arithmetic}
The effective size of an allocated block is determined by padding the requested payload size with header/footer boundary overhead:
\begin{equation}
\text{Block\_Size} = \max\Big(\text{Alignment}, \Big\lceil \frac{\text{size} + 2 \cdot \text{DSIZE}}{\text{Alignment}} \Big\rceil \cdot \text{Alignment}\Big)
\end{equation}

The heap utilization metric $U$ and external fragmentation index $\Phi$ are governed by:
\begin{align}
U &= \frac{\sum_{i=1}^k \text{payload}_i}{H_{\text{current}} - H_{\text{base}}} \\
\Phi &= 1.0 - \frac{\max(\text{FreeBlockSize})}{\text{TotalFreeMemory}}
\end{align}

\section{Memory Layout \& Explicit Free List Topology}
The structural diagram below illustrates the pointer relationship between an in-use allocated block and an explicit doubly linked free block node:

\begin{center}
""" + tikz_code + r"""
\end{center}

\section{Boundary Tag Coalescing Cases}
When \texttt{free(ptr)} is invoked, constant time $O(1)$ bidirectional coalescing evaluates adjacent boundary tags:
\begin{enumerate}
    \item \textbf{Case 1:} Preceding block allocated ($a_p=1$), Succeeding block allocated ($a_s=1$) $\implies$ No coalescence.
    \item \textbf{Case 2:} $a_p=1, a_s=0 \implies$ Merge current block with next block.
    \item \textbf{Case 3:} $a_p=0, a_s=1 \implies$ Merge current block with previous block.
    \item \textbf{Case 4:} $a_p=0, a_s=0 \implies$ Merge previous, current, and next into one contiguous free chunk.
\end{enumerate}

\end{document}"""

    return {
        "id": "sample-cse320",
        "title": "CSE 320: Dynamic Memory Allocation & Heap Layout",
        "subject": "Computer Systems / Low-Level C",
        "raw_image": generate_cse320_whiteboard_image(),
        "opencv_metrics": {
            "resolution": "1000x650",
            "perspective_rectified": True,
            "glare_suppressed": True,
            "clahe_clip_limit": 2.5,
            "detected_contours": 14,
            "classified_regions": 4
        },
        "regions": [
            {
                "id": "region-1",
                "type": "text",
                "label": "Lecture Title & Alignment Notes",
                "confidence": 0.94,
                "reading_order": 1,
                "bbox": {"x": 40, "y": 30, "width": 560, "height": 130, "normalized": {"ymin": 0.046, "xmin": 0.04, "ymax": 0.246, "xmax": 0.60}},
                "latex": r"""\section{Overview \& Alignment Constraints}
Dynamic memory allocators manage the heap segment:
\begin{itemize}
    \item \texttt{malloc(size\_t size)}: 8-byte aligned payload.
    \item Header/Footer format: [ Size (29 bits) | a/f (3 bits) ].
    \item Explicit Free List: Pointers stored inside payload.
\end{itemize}"""
            },
            {
                "id": "region-2",
                "type": "diagram",
                "label": "Memory Block Geometry & Pointer Graph",
                "confidence": 0.96,
                "reading_order": 2,
                "bbox": {"x": 500, "y": 110, "width": 460, "height": 160, "normalized": {"ymin": 0.169, "xmin": 0.50, "ymax": 0.415, "xmax": 0.96}},
                "tikz": tikz_code,
                "svg": svg_diagram
            },
            {
                "id": "region-3",
                "type": "math",
                "label": "Address Arithmetic & Utilization Equations",
                "confidence": 0.92,
                "reading_order": 3,
                "bbox": {"x": 45, "y": 185, "width": 400, "height": 135, "normalized": {"ymin": 0.284, "xmin": 0.045, "ymax": 0.492, "xmax": 0.445}},
                "math_expressions": [
                    r"\text{Block\_Size} = \max(\text{Alignment}, \text{round\_up}(\text{size} + 2 \cdot \text{DSIZE}))",
                    r"U = \frac{\sum \text{payload}_i}{H_{\text{curr}} - H_{\text{base}}}",
                    r"\Phi = 1.0 - \frac{\max(\text{free\_block})}{\text{total\_free}}"
                ],
                "latex": r"""\begin{align*}
\text{Block\_Size} &= \max(\text{Alignment}, \lceil \text{size} + 2 \cdot \text{DSIZE} \rceil) \\
U &= \frac{\sum \text{payload}}{H_{\text{curr}} - H_{\text{base}}} \\
\Phi &= 1.0 - \frac{\text{max\_free\_block}}{\text{total\_free}}
\end{align*}"""
            },
            {
                "id": "region-4",
                "type": "text",
                "label": "Boundary Tag Coalescing State Machine",
                "confidence": 0.91,
                "reading_order": 4,
                "bbox": {"x": 45, "y": 335, "width": 460, "height": 150, "normalized": {"ymin": 0.515, "xmin": 0.045, "ymax": 0.746, "xmax": 0.505}},
                "latex": r"""\section{Boundary Tag Coalescing}
\begin{itemize}
    \item \textbf{Case 1:} $prev\_alloc = 1, next\_alloc = 1 \implies$ No coalescing
    \item \textbf{Case 2:} $prev\_alloc = 1, next\_alloc = 0 \implies$ Merge with next
    \item \textbf{Case 3:} $prev\_alloc = 0, next\_alloc = 1 \implies$ Merge with prev
    \item \textbf{Case 4:} $prev\_alloc = 0, next\_alloc = 0 \implies$ Merge prev + next
\end{itemize}"""
            }
        ],
        "latex_full": latex_document
    }


def get_all_samples() -> List[Dict[str, Any]]:
    """Returns list of pre-rendered STEM lecture samples."""
    return [get_sample_cse320_payload()]
