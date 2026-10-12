# Notes2TeX — Notes & Whiteboards to Compiled LaTeX

Notes2TeX is an end-to-end Computer Vision and Multimodal Generative AI system that turns messy handwritten spiral notebook pages, oblique whiteboard photos, and multi-page lecture slide PDFs into publication-grade, compiled LaTeX study guides with live KaTeX math and synthesized vector TikZ diagrams.

---

## The Problem

Every STEM and CS student experiences the same dilemma: after an intense lecture, students leave with crooked, glare-filled phone snapshots of whiteboards, scribbled notebook formulas, or annotated slide decks.

When reviewing those notes later:
1. **Unreadable:** Distorted by oblique perspective angles, low marker contrast, and harsh fluorescent lighting glare.
2. **Disconnected:** Isolated scribbles and arrows that cannot be searched, copied, or compiled into clean documents.
3. **Lost in camera rolls:** Static raster images that never turn into usable study material.

**Notes2TeX solves this.** It parses physical visual notes and slide decks into compiled LaTeX study guides with live-rendered KaTeX math, synthesized vector TikZ graphics, and a 1-click Overleaf injector.

---

## Technical Architecture

Notes2TeX implements an authentic multi-stage Computer Vision and Multimodal Generative AI pipeline designed to eliminate the common pitfalls of raw OCR:

```
           [Handwritten Note / Whiteboard / PDF Slide]
                             │
                             ▼
       ┌───────────────────────────────────────────┐
       │   STAGE 1: OpenCV Perspective Keystoning  │
       │   - Canny edge contour quad detection     │
       │   - 4-point homography warp to flat plane │
       └─────────────────────┬─────────────────────┘
                             │
                             ▼
       ┌───────────────────────────────────────────┐
       │   STAGE 2: Adaptive Glare Suppression     │
       │   - LAB color space conversion            │
       │   - CLAHE illumination normalization      │
       │   - Marker stroke sharpening              │
       └─────────────────────┬─────────────────────┘
                             │
                             ▼
       ┌───────────────────────────────────────────┐
       │   STAGE 3: Layout Region Segmentation     │
       │   - Morphological bounding box clustering │
       │   - Periodic text projection profiling    │
       │   - Classification: Text / Math / Diagram │
       └─────────────────────┬─────────────────────┘
                             │
                             ▼
       ┌───────────────────────────────────────────┐
       │   STAGE 4: Multimodal Synthesis (Gemini 3)│
       │   - KaTeX inline & display math parsing   │
       │   - Generative TikZ vector synthesis      │
       │   - Local Tesseract OCR fallback pipeline │
       └─────────────────────┬─────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [React Studio on :5555]        [1-Click Overleaf Extension]
   - Bounding-box canvas          - Browser crosshair snip
   - Live KaTeX preview           - Direct CodeMirror DOM paste
   - TikZ vector rendering        - Zero manual copy-paste
   - .tex source editor
```

---

## Core Capabilities

### 1. Computer Vision Normalization (OpenCV)
- **Perspective Keystoning:** Detects document/whiteboard perimeter contours (`cv2.approxPolyDP`) and computes a homography matrix (`cv2.getPerspectiveTransform`) to un-warp angled photos taken from lecture desks into straight orthogonal planes.
- **Glare & Lighting Neutralization:** Converts images to LAB color space and applies Contrast Limited Adaptive Histogram Equalization (CLAHE) to the $L$-channel, suppressing fluorescent reflections while boosting faded marker contrast.
- **Layout Segmentation:** Uses horizontal projection profiling and connected-component dilation to cluster and classify regions into Text, Mathematical Expressions, and Structural Diagrams.

### 2. Multimodal Generative Synthesis (Gemini 3 Flash)
- **Math Proof Parsing:** Preserves mathematical variables, fractions, integrals, and matrices formatted with standard LaTeX math delimiters.
- **Vector TikZ Generation:** Synthesizes editable, publication-quality LaTeX TikZ vector graphics from hand-drawn graphs, memory layouts, and flowcharts.
- **Resilient Fallback Chain:** Automatically cascades across models (`gemini-3-flash-preview`, `gemini-3.5-flash`, `gemini-2.0-flash`) with local Tesseract OCR fallback for offline operation.

### 3. Interactive Web Studio (React, Vite, Tailwind CSS)
- **Interactive Vision Canvas:** Visualizes classified bounding boxes with color-coded chips (Text, Math, Diagram). Clicking any box immediately scrolls to and highlights that compiled section in the study guide.
- **Live KaTeX Math Engine:** Renders mathematical notation side-by-side with raw `.tex` source code.
- **Multi-Page PDF Processing:** In-memory PDF rasterization (`pypdfium2`) with a dedicated pagination toolbar to navigate and compile multi-page slide decks.
- **Export Suite:** 1-Click download of raw `.tex` source files, clipboard copying, and print-ready PDF export.

### 4. 1-Click Overleaf Chrome Extension (Manifest V3)
- Press **`Cmd+Shift+X`** (or `Alt+Shift+X` on Windows/Linux) anywhere on your screen.
- Drag a selection box over any lecture slide, textbook passage, or handwritten note.
- The extension captures the region, compiles it through the backend pipeline, and programmatically injects the compiled LaTeX directly into your active Overleaf editor tab at your cursor position—zero copy-pasting required.

---

## Repository Structure

```
notes2tex/
├── backend/
│   ├── main.py            # FastAPI REST API, routing & in-memory PDF rasterization
│   ├── cv_engine.py       # OpenCV homography, CLAHE glare removal & segmentation
│   ├── ai_engine.py       # Gemini 3 Flash multimodal synthesis & TikZ generation
│   └── samples.py         # Pre-loaded STEM lecture samples (CSE 320 Virtual Memory)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Studio state management, tabs & stepper
│   │   ├── components/
│   │   │   ├── Header.jsx              # Navigation, upload trigger & export actions
│   │   │   ├── WhiteboardViewer.jsx    # Interactive canvas with bounding boxes
│   │   │   ├── StudyGuideViewer.jsx    # Live KaTeX math & TikZ vector preview
│   │   │   ├── LatexEditor.jsx         # Raw LaTeX code viewer with line metrics
│   │   │   ├── OpenCVInspector.jsx     # Computer vision stage metrics inspector
│   │   │   └── ApiKeyModal.jsx         # Local browser API key configuration
│   │   └── index.css                   # Neo-brutalist theme & grid-notebook styling
│   ├── package.json
│   └── vite.config.js
├── extension/
│   ├── manifest.json      # Chrome Manifest V3 configuration
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Extension controller & Overleaf tab detector
│   ├── snipper.js         # On-screen drag-to-snip overlay
│   ├── background.js      # Service worker, offscreen canvas crop & API caller
│   └── content.js         # CodeMirror 6 DOM injector for Overleaf tabs
├── start.sh               # Concurrent startup script for backend & frontend
├── .gitignore             # Strict secret isolation (.env never tracked)
└── README.md
```

---

## Quickstart & Setup

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** and npm

### 1. Clone the Repository
```bash
git clone https://github.com/sumitkumar91/notes2tex.git
cd notes2tex
```

### 2. Setup Environment Variables
Create a `.env` file in the project root (this file is ignored by `.gitignore` and never committed):
```bash
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(You can obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). You can also provide the key directly in the web UI).*

### 3. Launch with One Command
```bash
./start.sh
```
This automatically initializes the virtual environment, installs dependencies, and launches both services:
- **Web App Studio:** [http://localhost:5555](http://localhost:5555)
- **FastAPI Backend:** [http://127.0.0.1:8008](http://127.0.0.1:8008) (Interactive Swagger docs at `/docs`)

---

## Chrome Extension Setup

1. Open Chrome, Brave, or Edge and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** in the top left.
4. Select the `extension/` folder inside the `notes2tex` repository.
5. Open any project on [Overleaf](https://www.overleaf.com), press **`Cmd+Shift+X`**, drag a crosshair over any visual note on your screen, and watch the compiled LaTeX inject directly into your document.

---

## Privacy & Security

- **Zero Secret Exposure:** API keys are never stored on external third-party servers. All requests are routed through your local backend instance or stored in your browser's local storage.
- **In-Memory Processing:** Uploaded images and PDF pages are processed in-memory (RAM) via OpenCV and `pypdfium2` without persistent storage.
- **Sanitized Responses:** Error handlers and logging pipelines automatically redact headers, credential keys, and environment variables.

---

## License

MIT License. Created by [Sumit Kumar](https://github.com/sumitkumar91).
