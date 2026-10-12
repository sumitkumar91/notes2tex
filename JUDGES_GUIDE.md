# Notes2TeX — Judge & Evaluator Quickstart Guide

Thank you for reviewing Notes2TeX!

- **Project:** Notes2TeX
- **Author:** Sumit Kumar (Solo)
- **Repository:** https://github.com/sumitkumar91/notes2tex

---

## 1. Quickest Test: 1-Click Overleaf Chrome Extension (60 Seconds)

To evaluate the Chrome Extension without running any backend servers:

1. Open Chrome, Brave, or Edge and go to `chrome://extensions`.
2. Toggle on **Developer mode** (top right).
3. Click **Load unpacked** (top left) and select the `extension/` folder in this zip.
4. Open any project on [Overleaf](https://www.overleaf.com).
5. Click the **Notes2TeX** extension icon in your browser toolbar:
   - Click **Inject Demo Sample to Overleaf**: watch the pre-loaded CSE 320 Virtual Memory and heap layout LaTeX and TikZ code inject directly into the Overleaf editor at your cursor position with zero manual copy-pasting.

---

## 2. Full Local Studio Evaluation

To test the full OpenCV computer vision and multimodal synthesis pipeline:

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### Steps
1. In the project root, create a `.env` file with your Gemini API key (or enter it in the web interface):
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   ```
2. Start both services with one command:
   ```bash
   ./start.sh
   ```
3. Open your browser:
   - **Interactive Web Studio:** http://localhost:5555
   - **FastAPI REST Engine:** http://127.0.0.1:8008 (API Docs at `/docs`)
4. Upload any whiteboard photo, handwritten formula, or multi-page lecture PDF to see:
   - OpenCV perspective homography keystone un-warping
   - CLAHE glare and reflection neutralization
   - Color-coded layout segmentation (Text, Math, Diagram)
   - Real-time KaTeX math rendering and generative TikZ vector synthesis
