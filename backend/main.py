"""
Board2TeX - FastAPI Vision & LaTeX Compilation Backend
"""

import os
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from cv_engine import (
    decode_image_from_bytes,
    encode_image_to_base64,
    auto_detect_whiteboard_quad,
    four_point_transform,
    enhance_whiteboard_contrast,
    segment_whiteboard_regions
)
from ai_engine import (
    process_whiteboard_with_gemini,
    generate_fallback_study_guide
)
from samples import get_all_samples

app = FastAPI(
    title="Board2TeX API",
    description="Messy Whiteboard to Compiled LaTeX Study Guide Vision Pipeline",
    version="1.0.0"
)

# Enable CORS for frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "opencv_version": cv2.__version__,
        "gemini_api_configured": bool(os.environ.get("GEMINI_API_KEY")),
        "service": "Board2TeX Backend"
    }


@app.get("/api/samples")
def get_samples():
    """Returns pre-rendered STEM lecture whiteboard samples for instant testing."""
    return {"samples": get_all_samples()}


class ProcessRequest(BaseModel):
    image_base64: str
    api_key: Optional[str] = None


@app.post("/api/process")
async def process_whiteboard(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    x_api_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    """
    Main Computer Vision & Generative AI pipeline:
    1. OpenCV Perspective Correction & Keystoning
    2. Adaptive Illumination Normalization & Glare Removal
    3. Spatial Layout & Region Modality Classification (Text / Math / Diagram)
    4. LaTeX Math Parsing & Generative TikZ / SVG Vectorization
    """
    try:
        # 1. Read input bytes
        if file is not None:
            image_bytes = await file.read()
        elif image_base64 is not None:
            raw_b64 = image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]
            import base64
            image_bytes = base64.b64decode(raw_b64)
        else:
            raise HTTPException(status_code=400, detail="No image file or base64 provided.")

        raw_image = decode_image_from_bytes(image_bytes)
        h, w = raw_image.shape[:2]

        # 2. Stage 1: Computer Vision Keystoning / Perspective Warp
        quad = auto_detect_whiteboard_quad(raw_image)
        perspective_rectified = False
        if quad is not None:
            rectified_image = four_point_transform(raw_image, quad)
            perspective_rectified = True
        else:
            rectified_image = raw_image.copy()

        # 3. Stage 2: OpenCV Glare Removal & Dry-Erase Contrast Enhancement
        enhanced_image = enhance_whiteboard_contrast(rectified_image)

        # 4. Stage 3: Spatial Region Segmentation
        cv_regions = segment_whiteboard_regions(enhanced_image)

        # Encode processed images for frontend display
        rectified_b64 = encode_image_to_base64(rectified_image)
        enhanced_b64 = encode_image_to_base64(enhanced_image)

        # 5. Stage 4: Multi-Modal Synthesis (AI or CV Fallback)
        # Re-encode enhanced image to JPEG bytes for vision model
        _, enc_buf = cv2.imencode(".jpg", enhanced_image, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        enhanced_bytes = enc_buf.tobytes()

        api_key = x_api_key or os.environ.get("GEMINI_API_KEY")
        study_guide = None
        mode_used = "cv_fallback"

        if api_key:
            try:
                study_guide = process_whiteboard_with_gemini(enhanced_bytes, api_key=api_key)
                mode_used = "gemini_multimodal"
            except Exception as e:
                # If API call fails (rate limit, invalid key), gracefully fallback to CV engine
                print(f"[Warning] AI generation failed, falling back to CV pipeline: {e}")
                study_guide = generate_fallback_study_guide(cv_regions, enhanced_image.shape)
                study_guide["api_warning"] = str(e)
        else:
            study_guide = generate_fallback_study_guide(cv_regions, enhanced_image.shape)

        return {
            "success": True,
            "mode": mode_used,
            "opencv_metrics": {
                "original_resolution": f"{w}x{h}",
                "perspective_rectified": perspective_rectified,
                "detected_quad": quad.tolist() if quad is not None else None,
                "glare_suppression_applied": True,
                "detected_regions_count": len(cv_regions)
            },
            "rectified_image": rectified_b64,
            "enhanced_image": enhanced_b64,
            "study_guide": study_guide
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export-tex")
async def export_tex(payload: Dict[str, Any]):
    """Exports raw .tex file as attachment."""
    latex_content = payload.get("latex_full", "% No LaTeX content provided")
    title = payload.get("title", "lecture_notes").replace(" ", "_").lower()
    return PlainTextResponse(
        content=latex_content,
        headers={
            "Content-Disposition": f"attachment; filename={title}.tex"
        }
    )
