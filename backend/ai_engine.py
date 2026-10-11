"""
Board2TeX - Multi-Modal Generative AI & LaTeX / TikZ Synthesis Engine
Interfaces with Google Gemini (or OpenAI / Anthropic) with specialized prompts
to convert whiteboard sketches into compiled LaTeX documents and TikZ vector graphics.
"""

import os
import json
import base64
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types


SYSTEM_PROMPT = """You are Board2TeX, an expert academic compiler that converts messy lecture hall whiteboard photos into publication-quality LaTeX documents.

You must analyze the whiteboard image and output strict JSON with the following structure:
{
  "title": "Title of the lecture or main topic",
  "subject": "e.g., Computer Systems, Machine Learning, Calculus, Linear Algebra",
  "summary": "2-3 sentence overview of the whiteboard contents",
  "regions": [
    {
      "id": "region-1",
      "type": "text | math | diagram",
      "label": "Short description of this region",
      "reading_order": 1,
      "bbox": {
        "x": 0, "y": 0, "width": 100, "height": 100,
        "normalized": {"ymin": 0.0, "xmin": 0.0, "ymax": 1.0, "xmax": 1.0}
      },
      "latex": "Corresponding LaTeX code for this section",
      "math_expressions": ["array of raw KaTeX math strings if type is math"],
      "tikz": "Clean \\begin{tikzpicture} ... \\end{tikzpicture} code if type is diagram",
      "svg": "<svg ...> clean SVG vector graphics representing the diagram if type is diagram </svg>"
    }
  ],
  "latex_full": "A complete, compilable LaTeX document using \\documentclass[11pt]{article}, including amsmath, amssymb, tikz, tcolorbox, and all necessary packages."
}

Rules:
1. For mathematical formulas: Use clean, standardized LaTeX (e.g. \\begin{align*}, \\sum, \\int, \\frac, \\mathbf).
2. For hand-drawn diagrams (memory frames, linked lists, trees, graphs, neural nets, circuit blocks):
   - Provide clean, professional LaTeX TikZ code using nodes and styled edges.
   - Provide a companion <svg>...</svg> block so it can render seamlessly in modern web browsers!
3. For text notes: Format into clean LaTeX \\section, \\subsection, or \\begin{itemize}.
4. Return ONLY valid JSON without markdown fences."""


def process_whiteboard_with_gemini(
    image_bytes: bytes,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calls Gemini 2.5 Flash / Pro Vision to analyze and compile whiteboard to LaTeX and TikZ.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY not configured. Please supply an API key.")

    client = genai.Client(api_key=key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            "Analyze this lecture whiteboard. Identify all text, math formulas, and diagrams. Convert them into clean LaTeX and TikZ following the requested JSON schema."
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
        )
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    data = json.loads(raw_text.strip())
    return data


def generate_fallback_study_guide(cv_regions: List[Dict[str, Any]], image_shape: tuple) -> Dict[str, Any]:
    """
    Fallback synthesis when no API key is provided:
    Maps OpenCV detected bounding boxes into a formatted LaTeX document and preview.
    """
    h, w = image_shape[:2]
    processed_regions = []

    latex_sections = []

    for r in cv_regions:
        reg_type = r["type"]
        idx = r["reading_order"]

        if reg_type == "math":
            math_expr = r"\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
            r["math_expressions"] = [math_expr]
            r["label"] = f"Mathematical Derivation (Block {idx})"
            r["latex"] = f"""\\begin{{equation*}}
{math_expr}
\\end{{equation*}}"""
            latex_sections.append(f"\\section*{{Equation {idx}}}\n" + r["latex"])

        elif reg_type == "diagram":
            r["label"] = f"Structural System Diagram (Block {idx})"
            r["tikz"] = r"""\begin{tikzpicture}[node distance=2cm, auto, thick]
  \node[draw, rectangle, fill=blue!10, rounded corners] (nodeA) {State A};
  \node[draw, rectangle, fill=green!10, rounded corners, right of=nodeA] (nodeB) {State B};
  \draw[->] (nodeA) -- node[above] {transition} (nodeB);
\end{tikzpicture}"""
            r["svg"] = """<svg viewBox="0 0 400 120" class="w-full h-auto bg-slate-900 rounded-lg p-2 border border-slate-700">
  <defs>
    <marker id="arrow-fb" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
    </marker>
  </defs>
  <rect x="30" y="35" width="100" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <text x="80" y="65" text-anchor="middle" fill="#f8fafc" font-size="12">Component A</text>
  <path d="M 135 60 L 235 60" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow-fb)"/>
  <text x="185" y="50" text-anchor="middle" fill="#38bdf8" font-size="11">Data Flow</text>
  <rect x="240" y="35" width="100" height="50" rx="6" fill="#1e293b" stroke="#22c55e" stroke-width="2"/>
  <text x="290" y="65" text-anchor="middle" fill="#f8fafc" font-size="12">Component B</text>
</svg>"""
            latex_sections.append(f"\\section*{{Diagram {idx}}}\n" + r["tikz"])

        else:
            r["label"] = f"Lecture Notes (Block {idx})"
            r["latex"] = f"""\\begin{{itemize}}
  \\item Key concept extracted from spatial region {idx}.
  \\item Bounding box: ({r['bbox']['x']}, {r['bbox']['y']}) with width {r['bbox']['width']}px.
\\end{{itemize}}"""
            latex_sections.append(f"\\section*{{Notes {idx}}}\n" + r["latex"])

        processed_regions.append(r)

    full_tex = r"""\documentclass[11pt, a4paper]{article}
\usepackage{amsmath, amssymb, tikz, geometry}
\geometry{margin=1in}
\title{\textbf{Board2TeX Lecture Notes}}
\author{Compiled from Whiteboard Vision Analysis}
\date{\today}

\begin{document}
\maketitle

""" + "\n\n".join(latex_sections) + r"""

\end{document}"""

    return {
        "title": "Whiteboard Lecture Analysis",
        "subject": "STEM Lecture Notes",
        "summary": f"Detected {len(cv_regions)} spatial regions ({sum(1 for r in cv_regions if r['type']=='math')} math, {sum(1 for r in cv_regions if r['type']=='diagram')} diagrams, {sum(1 for r in cv_regions if r['type']=='text')} text blocks).",
        "regions": processed_regions,
        "latex_full": full_tex
    }
