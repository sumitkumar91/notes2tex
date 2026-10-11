# 📐 Board2TeX — Messy Whiteboard to Compiled Study Guide

> **Built for Banana Hacks 2026** — *The Image AI Hackathon*  
> **Submission URL:** [bananahacks.tech](https://www.bananahacks.tech) & Devpost  
> **Theme:** Image Classification, Spatial Layout Processing, and Synthetic Vector Generation

---

## 🌟 The Problem & Inspiration
Every STEM and CS student knows the feeling: it's 8:30 PM in a lecture hall (like Roth Hall or Javits), the professor finishes a dense proof or draws an intricate memory allocation diagram, and everyone rushes to take a crooked, glare-filled phone photo of the whiteboard.

Three days later when studying for midterms, that photo is:
1. **Unreadable**: Distorted by angled perspective, low marker contrast, and harsh fluorescent light glare.
2. **Disconnected**: Isolated scribbles and arrows that can't be searched, copy-pasted, or compiled into clean notes.
3. **Lost in camera rolls**: Static raster images that never turn into usable study material.

**Board2TeX solves this.** It turns raw, angled whiteboard photos into publication-grade, compiled LaTeX study guides with live-rendered math and synthesized **vector TikZ diagrams**.

---

## 🔬 Non-Trivial Computer Vision & AI Architecture

Judges explicitly penalize thin API wrappers. Board2TeX implements an authentic multi-stage Computer Vision and Generative AI pipeline:

```
           [Angled Whiteboard Photo with Glare]
                            │
                            ▼
      ┌───────────────────────────────────────────┐
      │   STAGE 1: OpenCV Perspective Keystoning  │
      │   - Quad contour approximation (approxPolyDP)│
      │   - 4-point homography (warpPerspective)  │
      └─────────────────────┬─────────────────────┘
                            │
                            ▼
      ┌───────────────────────────────────────────┐
      │   STAGE 2: Glare & Contrast Normalization │
      │   - Morphological background illumination │
      │   - Luminance-channel CLAHE (clip=2.5)    │
      │   - Dry-erase ink isolation & thresholding│
      └─────────────────────┬─────────────────────┘
                            │
                            ▼
      ┌───────────────────────────────────────────┐
      │   STAGE 3: Spatial Modality Segmentation  │
      │   - Connected component topological merge │
      │   - Geometric & loop feature extraction   │
      │   - Routes to [TEXT], [MATH], or [DIAGRAM]│
      └─────────────────────┬─────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │ [MATH] Engine     │           │ [DIAGRAM] Engine  │
  │ LaTeX formula     │           │ Generative TikZ & │
  │ & KaTeX parser    │           │ SVG vectorization │
  └─────────┬─────────┘           └─────────┬─────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
      ┌───────────────────────────────────────────┐
      │   STAGE 4: Academic Document Assembly     │
      │   - LaTeX 2e document class article AST   │
      │   - Interactive web studio with sync hover│
      │   - 1-Click .tex export & printable PDF   │
      └───────────────────────────────────────────┘
```

---

## ✨ Key Features

* **📷 Perspective Keystoning:** Un-warps photos taken at oblique angles from lecture desks into straight orthogonal planes.
* **💡 Glare Elimination:** Strips away reflective fluorescent light patches on dry-erase boards while amplifying faint colored ink.
* **🏷️ Interactive Bounding-Box Overlay:** Displays detected segments directly on the whiteboard canvas with colored modality chips (🟢 Text, 🔵 Math, 🟣 Diagram). Clicking or hovering any box auto-scrolls to that section in the study guide.
* **🎨 Synthetic TikZ & SVG Generation:** Transforms messy hand-drawn boxes, pointer arrows, and graphs into clean, razor-sharp vector diagrams that render in the browser and compile directly in LaTeX.
* **⚡ Live KaTeX Math Engine:** Real-time equation rendering alongside the source code.
* **💾 Export Suite:** 1-Click download of raw `.tex` source code, copy to clipboard, or print-ready PDF study sheet.
* **🧩 1-Click Overleaf Chrome Extension:** Snap an on-screen snipping rectangle over any note or PDF, and it automatically injects compiled LaTeX equations & TikZ figures directly into your active Overleaf editor tab at your cursor position!
* **🧪 Pre-loaded STEM Demo Library:** Built-in interactive sample (CSE 320 Virtual Memory & Heap Allocation) for instant live judging demos.

---

## 🧩 1-Click Overleaf Chrome Extension Setup (Free)

1. Open Chrome/Brave/Edge and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right.
3. Click **Load unpacked** in the top left.
4. Select the [`board2tex/extension`](file:///Users/sumitkumar/coding/board2tex/extension) directory.
5. Open any project on [Overleaf](https://www.overleaf.com), press **Cmd+Shift+X**, drag a box over any math note, and watch it type itself into your document!

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
* Python 3.10+ (or Python 3.12)
* Node.js 18+ and npm

### 2. Run with One Command
```bash
./start.sh
```
This automatically starts:
* **FastAPI Backend:** `http://127.0.0.1:8000` (API Docs at `/docs`)
* **Vite React Frontend:** `http://localhost:5173`

---

## 🎬 3-Minute Video Demo Script (Strict Hackathon Constraint)

* **0:00 - 0:30 (The Hook):** Show the crooked, glare-heavy photo of a lecture whiteboard. Present the student dilemma before finals.
* **0:30 - 1:15 (The Live Experience):** Open Board2TeX. Show the interactive canvas. Hover over the messy hand-drawn linked-list memory chunk on the board — show the right pane immediately highlight the corresponding compiled TikZ vector graphic.
* **1:15 - 2:00 (The Math & Text):** Show the KaTeX formula conversion and the side-by-side LaTeX source code inspector.
* **2:00 - 2:40 (The Technical Architecture):** Open the **CV Pipeline Inspector** tab. Walk through the homography matrix, the CLAHE glare suppression, and the modality segmentation heuristics. Prove to the judges why this is an engineering pipeline, not a wrapper.
* **2:40 - 3:00 (Closing & Impact):** Click "Export .tex" and "Save PDF". Conclude with how this transforms late-night studying for every STEM student.

---

## 🏆 Devpost Submission Draft

* **Project Name:** Board2TeX
* **Tagline:** Messy Whiteboard Photos to Compiled LaTeX Study Guides with Generative TikZ Diagrams
* **Inspiration:** Late night CS and engineering lectures where taking photos of whiteboards is common, but making sense of them later is impossible.
* **What We Learned:** How to combine classical computer vision (morphological filtering, perspective homography, connected-component topology) with modern multimodal generative models to bridge the gap between physical chalk/marker scribbles and clean digital documents.
