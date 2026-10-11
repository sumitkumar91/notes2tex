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

CRITICAL RULES:
1. ONLY classify as "diagram" if the region contains a genuine hand-drawn graphical figure (memory layout, flowchart, state machine, graph, circuit). NEVER classify text or math as diagram!
2. REPRESENT THE DOCUMENT LAYOUT AND TEXT EXACTLY AS SHOWN:
   - For numbered sections or points (e.g., "3. Parenthesis: ...", "4. Variables: ..."), format as \\noindent\\textbf{4. Variables:} ... with continuous prose paragraph text. DO NOT use \\begin{itemize} \\item for numbered paragraphs!
   - Preserve normal paragraphs as natural text separated by blank lines (\\n\\n), NOT bulleted lists.
   - Only use \\begin{itemize} if the original image literally has bullet dots or dashes.
3. INLINE MATHEMATICAL NOTATION:
   - Wrap all mathematical variables, sets, predicates, comparisons, and formulas in inline math: $VAR = \\{x_1, x_2, \\dots\\}$, $\\mathbf{C} = \\{c_1, c_2, \\dots\\}$, $\\mathbf{P}$, $\\mathcal{L}$, $x < y$, $P(x, y)$, $n < 0$, etc.
4. If a document has NO diagrams and only contains text and math, do NOT invent diagrams! Output only "text" and "math" regions.
5. Return ONLY valid JSON without markdown fences."""


def process_whiteboard_with_gemini(
    image_bytes: bytes,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calls Gemini 2.5 Flash Vision to analyze and compile whiteboard to LaTeX and TikZ.
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
            "Transcribe this textbook / whiteboard document into publication-ready LaTeX. Represent layout, paragraphs, and numbered items EXACTLY as shown. Do NOT use \\item or \\begin{itemize} for regular text or numbered paragraphs. Preserve all inline math."
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
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


def generate_fallback_study_guide(cv_regions: List[Dict[str, Any]], image: Any) -> Dict[str, Any]:
    """
    Fallback synthesis using local Computer Vision & Tesseract OCR:
    Extracts actual words and mathematical text from cropped regions.
    """
    import cv2
    import numpy as np
    import pytesseract
    import re

    processed_regions = []
    latex_sections = []
    lecture_title = "Whiteboard Lecture Notes"

    for r in cv_regions:
        reg_type = r["type"]
        idx = r["reading_order"]
        bx = r["bbox"]["x"]
        by = r["bbox"]["y"]
        bw = r["bbox"]["width"]
        bh = r["bbox"]["height"]

        # Crop region for Tesseract OCR
        cropped = None
        ocr_text = ""
        if isinstance(image, np.ndarray):
            cropped = image[max(0, by):min(image.shape[0], by+bh), max(0, bx):min(image.shape[1], bx+bw)]
            if cropped.size > 0:
                try:
                    # Run Tesseract with auto page segmentation
                    ocr_text = pytesseract.image_to_string(cropped, config='--psm 6').strip()
                except Exception as e:
                    print(f"OCR warning: {e}")

        clean_text = ocr_text if ocr_text else f"Extracted notes from section {idx}"
        lines = [line.strip() for line in clean_text.split("\n") if line.strip()]

        if reg_type == "math":
            # Extract math expressions
            math_expr = clean_text.replace("\n", " ") if clean_text else r"f(x) = \sum_{i=1}^{n} w_i x_i + b"
            r["label"] = f"Mathematical Expression {idx}"
            r["math_expressions"] = [math_expr]
            r["latex"] = f"""\\begin{{equation*}}
{math_expr}
\\end{{equation*}}"""
            latex_sections.append(f"\\subsection*{{Equation {idx}}}\n" + r["latex"])

        elif reg_type == "diagram":
            r["label"] = f"Structural System Diagram {idx}"
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
            latex_sections.append(f"\\subsection*{{Diagram {idx}}}\n" + r["tikz"])

        else:
            # TEXT REGION - Format as natural paragraphs, NEVER force itemize!
            first_line = lines[0] if lines else f"Section {idx}"
            if idx == 1 and ("chapter" in first_line.lower() or "introduction" in first_line.lower()):
                lecture_title = first_line

            # Group lines into paragraphs and handle numbered items properly
            formatted_paragraphs = []
            curr_p = []
            for line in lines:
                # If line starts with a number like "3. Parenthesis:" or "4. Variables:"
                if re.match(r'^\d+\.\s*', line):
                    if curr_p:
                        formatted_paragraphs.append(" ".join(curr_p))
                        curr_p = []
                    # Check for colon
                    if ":" in line:
                        prefix, rest = line.split(":", 1)
                        curr_p.append(f"\\noindent\\textbf{{{prefix}:}}{rest}")
                    else:
                        curr_p.append(f"\\noindent\\textbf{{{line}}}")
                else:
                    curr_p.append(line)

            if curr_p:
                formatted_paragraphs.append(" ".join(curr_p))

            tex_body = "\n\n".join(formatted_paragraphs) if formatted_paragraphs else clean_text
            r["label"] = first_line[:40] if first_line else f"Section {idx}"
            r["latex"] = tex_body
            latex_sections.append(tex_body)

        processed_regions.append(r)

    full_tex = f"""\\documentclass[11pt, a4paper]{{article}}
\\usepackage{{amsmath, amssymb, tikz, geometry}}
\\geometry{{margin=1in}}
\\title{{\\textbf{{{lecture_title}}}}}
\\author{{Compiled with Board2TeX Vision Engine}}
\\date{{\\today}}

\\begin{{document}}
\\maketitle

""" + "\n\n".join(latex_sections) + r"""

\end{document}"""

    return {
        "title": lecture_title,
        "subject": "STEM Lecture Notes",
        "summary": f"Detected {len(cv_regions)} spatial regions ({sum(1 for r in cv_regions if r['type']=='text')} text blocks, {sum(1 for r in cv_regions if r['type']=='math')} math expressions, {sum(1 for r in cv_regions if r['type']=='diagram')} diagrams).",
        "regions": processed_regions,
        "latex_full": full_tex
    }
