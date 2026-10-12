"""
Notes2TeX - Computer Vision Preprocessing & Layout Segmentation Engine
Implements perspective rectification, glare suppression, adaptive contrast,
and multi-modal region classification (Text vs Math vs Diagram).
"""

import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional


def decode_image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes into an OpenCV BGR image."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image from provided bytes.")
    return image


def encode_image_to_base64(image: np.ndarray, format: str = ".jpg") -> str:
    """Encode an OpenCV BGR image into base64 data URI."""
    success, buffer = cv2.imencode(format, image, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not success:
        raise ValueError("Failed to encode image to buffer.")
    b64_str = base64.b64encode(buffer).decode("utf-8")
    mime = "image/jpeg" if format.lower() in [".jpg", ".jpeg"] else "image/png"
    return f"data:{mime};base64,{b64_str}"


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 coordinates: top-left, top-right, bottom-right, bottom-left.
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Top-left has smallest sum
    rect[2] = pts[np.argmax(s)]  # Bottom-right has largest sum

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Top-right has smallest difference
    rect[3] = pts[np.argmax(diff)]  # Bottom-left has largest difference
    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Applies homography perspective transform to rectify angled whiteboard into a flat plane.
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    if max_width < 100 or max_height < 100:
        return image

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))
    return warped


def auto_detect_whiteboard_quad(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Attempts to detect the rectangular perimeter of the whiteboard in the image.
    Returns 4 corner points if detected, else None.
    """
    orig_h, orig_w = image.shape[:2]
    scale = 800.0 / max(orig_h, orig_w)
    resized = cv2.resize(image, (int(orig_w * scale), int(orig_h * scale)))

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    # Dilate edges to close gaps in whiteboard frames
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    dilated = cv2.dilate(edged, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(approx)
            total_area = resized.shape[0] * resized.shape[1]
            # Whiteboard should occupy at least 35% of camera frame
            if area > 0.35 * total_area:
                pts = approx.reshape(4, 2) / scale
                return pts.astype(np.float32)

    return None


def enhance_whiteboard_contrast(image: np.ndarray) -> np.ndarray:
    """
    Performs dry-erase marker enhancement, illumination flattening, and glare suppression:
    1. Illumination estimation via morphological closing with a large structuring element
    2. Division normalization to remove light gradients and shadows
    3. CLAHE to bring out faint colored markers (red, green, blue)
    """
    # Convert to LAB for luminance-specific processing
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    # Estimate background illumination using large morphological opening
    kernel_size = max(25, int(min(image.shape[:2]) * 0.05))
    if kernel_size % 2 == 0:
        kernel_size += 1
    bg_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    bg_illum = cv2.morphologyEx(l_channel, cv2.MORPH_DILATE, bg_kernel)
    bg_illum = cv2.GaussianBlur(bg_illum, (kernel_size, kernel_size), 0)

    # Normalize illumination (flatten shadows across the board)
    bg_float = bg_illum.astype(np.float32) + 1e-5
    l_float = l_channel.astype(np.float32)
    norm_l = np.clip((l_float / bg_float) * 255.0, 0, 255).astype(np.uint8)

    # Apply CLAHE on normalized luminance channel
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(norm_l)

    # Boost marker ink contrast slightly
    enhanced_l = cv2.addWeighted(enhanced_l, 1.2, l_channel, -0.2, 0)

    # Merge channels back
    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    result = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    return result


def segment_whiteboard_regions(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Segments the whiteboard into discrete spatial bounding boxes and classifies each:
    - 'text': Horizontal linear stroke alignment, line periodicity, bullet points
    - 'math': Compact symbolic density, fraction bars, superscripts/subscripts, operators
    - 'diagram': Boxes, arrows, interconnected graph components, loops with large area
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold to extract marker ink mask
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 12
    )

    # Remove speckle noise
    clean_mask = cv2.medianBlur(thresh, 3)

    # Use horizontal-biased dilation: merges words into lines without fusing vertical blocks
    line_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 4))
    dilated_lines = cv2.dilate(clean_mask, line_kernel, iterations=2)

    # Moderate block grouping
    block_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (12, 10))
    dilated = cv2.dilate(dilated_lines, block_kernel, iterations=1)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    raw_boxes = []
    min_area = (w * h) * 0.002  # Filter out tiny smudges

    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        area = bw * bh
        if area >= min_area and bw > 35 and bh > 18:
            raw_boxes.append((x, y, bw, bh))

    # Merge overlapping or tightly proximate bounding boxes
    merged_boxes = merge_bounding_boxes(raw_boxes, h_margin=15, v_margin=10)

    # Classify each region by geometric & stroke topology features
    regions = []
    for idx, (x, y, bw, bh) in enumerate(merged_boxes):
        roi_mask = clean_mask[y:y+bh, x:x+bw]
        roi_area = float(bw * bh + 1e-5)
        ink_pixels = cv2.countNonZero(roi_mask)
        density = ink_pixels / roi_area
        aspect_ratio = bw / float(bh + 1e-5)

        # 1. Horizontal Projection Profile: count horizontal text lines
        row_sums = np.sum(roi_mask > 0, axis=1)
        # Smooth projection
        if len(row_sums) > 5:
            smooth_sums = np.convolve(row_sums, np.ones(5)/5.0, mode='same')
            # Detect peaks (lines of handwriting)
            peaks = 0
            mean_val = np.mean(smooth_sums)
            is_peak = False
            for val in smooth_sums:
                if val > mean_val * 1.2:
                    if not is_peak:
                        peaks += 1
                        is_peak = True
                elif val < mean_val * 0.8:
                    is_peak = False
        else:
            peaks = 1

        # 2. Check for LARGE structural boxes/circles (NOT letter loops like 'o', 'e')
        roi_contours, hierarchy = cv2.findContours(roi_mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
        large_holes = 0
        if hierarchy is not None:
            for c_idx, h_item in enumerate(hierarchy[0]):
                # h_item[3] != -1 means it is an internal contour / hole
                if h_item[3] != -1:
                    hole_area = cv2.contourArea(roi_contours[c_idx])
                    # Must be a drawn geometric container (at least 3.5% of total box area)
                    if hole_area > 0.035 * roi_area:
                        large_holes += 1

        # 3. Detect long straight geometric lines / arrows (Hough Lines)
        lines = cv2.HoughLinesP(roi_mask, 1, np.pi/180, threshold=40, minLineLength=int(min(bw, bh) * 0.45), maxLineGap=10)
        has_long_lines = lines is not None and len(lines) >= 2

        # Robust classification decision tree:
        # Strict diagram rule: MUST have large box enclosures OR long arrow vectors, and NOT be rhythmic text
        is_diagram = False
        if bw > w * 0.18 and bh > h * 0.15 and density < 0.18:
            if (large_holes >= 1 and has_long_lines) or large_holes >= 2:
                is_diagram = True

        # Math formula rule:
        # Single or 2 lines, moderate aspect ratio, operators or fraction bars
        is_math = False
        if not is_diagram:
            if 0.9 <= aspect_ratio <= 3.8 and (bh < h * 0.22):
                # Check for horizontal fraction line:
                mid_y = bh // 2
                mid_band = roi_mask[max(0, mid_y-5):min(bh, mid_y+5), :]
                mid_proj = np.sum(mid_band > 0, axis=0)
                has_fraction_bar = np.max(mid_proj) > bw * 0.5

                if has_fraction_bar or peaks <= 2:
                    # If it's a short 1-2 line block with math-like aspect ratio
                    if aspect_ratio < 3.2 and peaks <= 2:
                        is_math = True

        if is_diagram:
            modality = "diagram"
            confidence = 0.91
        elif is_math:
            modality = "math"
            confidence = 0.88
        else:
            modality = "text"
            confidence = 0.93

        regions.append({
            "id": f"region-{idx + 1}",
            "type": modality,
            "confidence": round(confidence, 2),
            "bbox": {
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "normalized": {
                    "ymin": round(y / h, 4),
                    "xmin": round(x / w, 4),
                    "ymax": round((y + bh) / h, 4),
                    "xmax": round((x + bw) / w, 4)
                }
            }
        })

    # Sort regions topologically (reading order: top-to-bottom, column-grouped)
    regions.sort(key=lambda r: (r["bbox"]["y"] // 90, r["bbox"]["x"]))

    # Re-assign sequential IDs in reading order
    for new_idx, r in enumerate(regions):
        r["id"] = f"region-{new_idx + 1}"
        r["reading_order"] = new_idx + 1

    return regions


def merge_bounding_boxes(boxes: List[Tuple[int, int, int, int]], h_margin: int = 20, v_margin: int = 15) -> List[Tuple[int, int, int, int]]:
    """
    Merges nearby bounding boxes that are part of the same block/paragraph.
    """
    if not boxes:
        return []

    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))
    merged = []

    for box in boxes:
        x1, y1, w1, h1 = box
        x2, y2 = x1 + w1, y1 + h1
        merged_any = False

        for i, m_box in enumerate(merged):
            mx1, my1, mw1, mh1 = m_box
            mx2, my2 = mx1 + mw1, my1 + mh1

            # Check overlap or proximity
            overlap_x = not (x2 + h_margin < mx1 or x1 > mx2 + h_margin)
            overlap_y = not (y2 + v_margin < my1 or y1 > my2 + v_margin)

            if overlap_x and overlap_y:
                nx1 = min(x1, mx1)
                ny1 = min(y1, my1)
                nx2 = max(x2, mx2)
                ny2 = max(y2, my2)
                merged[i] = (nx1, ny1, nx2 - nx1, ny2 - ny1)
                merged_any = True
                break

        if not merged_any:
            merged.append(box)

    return merged
