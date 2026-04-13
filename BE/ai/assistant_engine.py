#!/usr/bin/env python3
"""Simple Python assistant engine for gearbox workflow hints.

Input (stdin JSON):
{
  "question": "...",
  "language": "vi|en",
  "context": { ... }
}

Output (stdout JSON):
{
  "reply": "...",
  "actions": ["..."],
  "confidence": 0.0
}
"""

import json
import math
import re
import sys
from typing import Any, Dict, List


def safe_float(value: Any, fallback: float) -> float:
    try:
        parsed = float(value)
        if math.isnan(parsed) or math.isinf(parsed):
            return fallback
        return parsed
    except Exception:
        return fallback


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def detect_intent(question: str) -> str:
    q = normalize(question)
    if any(token in q for token in ["safety", "an toan", "factor"]):
        return "safety"
    if any(token in q for token in ["ratio", "ti so", "u belt", "gear ratio"]):
        return "ratio"
    if any(token in q for token in ["material", "vat lieu", "steel"]):
        return "material"
    if any(token in q for token in ["stress", "ung suat", "bending", "contact"]):
        return "stress"
    if any(token in q for token in ["export", "report", "bao cao"]):
        return "export"
    return "general"


def build_metrics(context: Dict[str, Any]) -> Dict[str, float]:
    power = safe_float(context.get("power"), 15.5)
    speed = safe_float(context.get("speed"), 1450.0)
    belt_ratio = safe_float(context.get("beltRatio"), 3.0)
    face_width = safe_float(context.get("faceWidth"), 25.0)
    shaft_d = safe_float(context.get("shaftDiameter"), 40.0)

    torque = (9550.0 * power) / max(1.0, speed)
    stress_index = clamp((torque / max(1.0, face_width)) * 10.0, 30.0, 200.0)

    safety_factor = safe_float(context.get("safetyFactor"), 0.0)
    if safety_factor <= 0:
        safety_factor = clamp(shaft_d / 34.0, 1.0, 2.6)

    return {
        "power": power,
        "speed": speed,
        "belt_ratio": belt_ratio,
        "face_width": face_width,
        "shaft_d": shaft_d,
        "torque": torque,
        "stress_index": stress_index,
        "safety_factor": safety_factor,
    }


def format_reply(intent: str, m: Dict[str, float], lang: str) -> Dict[str, Any]:
    vi = lang != "en"

    if intent == "safety":
        gap = 1.25 - m["safety_factor"]
        if vi:
            if gap <= 0:
                reply = (
                    f"Safety factor hien tai ~{m['safety_factor']:.2f}, da dat nguong khuyen nghi. "
                    "Ban co the toi uu tiep bang cach giam trong luong truc hoac toi uu ratio de tang hieu suat."
                )
            else:
                reply = (
                    f"Safety factor hien tai ~{m['safety_factor']:.2f}, thap hon nguong 1.25. "
                    f"Khuyen nghi tang duong kinh truc len khoang {m['shaft_d'] + max(2.0, gap * 8):.1f} mm "
                    "va tang face width 3-6 mm."
                )
        else:
            if gap <= 0:
                reply = (
                    f"Current safety factor is ~{m['safety_factor']:.2f}, already above the recommended threshold. "
                    "You can optimize mass or ratio to improve efficiency further."
                )
            else:
                reply = (
                    f"Current safety factor is ~{m['safety_factor']:.2f}, below the 1.25 target. "
                    f"Increase shaft diameter to around {m['shaft_d'] + max(2.0, gap * 8):.1f} mm and add 3-6 mm face width."
                )

        actions = [
            "Increase shaft standard diameter",
            "Increase face width",
            "Re-check safety factor at Step 5",
        ]
        confidence = 0.86

    elif intent == "ratio":
        if vi:
            reply = (
                f"Ti so hien tai ~{m['belt_ratio']:.2f}. Vung on dinh thuong trong khoang 2.5-4.0 cho cap dau. "
                "Neu ratio cao hon, nen chia lai cap truyen de giam peak stress va rung."
            )
        else:
            reply = (
                f"Current ratio is ~{m['belt_ratio']:.2f}. A stable first-stage zone is often 2.5-4.0. "
                "If higher than that, split ratio across stages to reduce peak stress and vibration."
            )
        actions = [
            "Keep first-stage ratio in 2.5-4.0",
            "Distribute ratio across stages",
            "Re-validate torque distribution",
        ]
        confidence = 0.83

    elif intent == "material":
        if vi:
            reply = (
                "Goi y vat lieu theo muc tai: C45 cho tai vua, 40Cr-QT cho tai cao, "
                "18CrNiMo7-6 cho duty cao va chu ky moi lon."
            )
        else:
            reply = (
                "Material hint by load level: C45 for medium load, 40Cr-QT for higher load, "
                "18CrNiMo7-6 for high-duty and fatigue-critical cases."
            )
        actions = [
            "Match material to duty cycle",
            "Check allowable stress tables",
            "Update safety-factor assumptions",
        ]
        confidence = 0.8

    elif intent == "stress":
        if vi:
            reply = (
                f"Stress index uoc tinh ~{m['stress_index']:.1f}. Ban co the giam ung suat bang cach "
                "tang face width, giam ratio cap dau, va uu tien che do spiral de phan bo tai tot hon."
            )
        else:
            reply = (
                f"Estimated stress index is ~{m['stress_index']:.1f}. Reduce stress by increasing face width, "
                "lowering first-stage ratio, and using spiral mode for better load distribution."
            )
        actions = [
            "Increase face width",
            "Lower first-stage ratio",
            "Use spiral gear mode",
        ]
        confidence = 0.82

    elif intent == "export":
        if vi:
            reply = (
                "Checklist truoc khi export: Save Draft, xac nhan Step 1/3/4 co du lieu, "
                "kiem tra safety factor va chon dung dinh dang file."
            )
        else:
            reply = (
                "Export checklist: Save Draft, ensure Step 1/3/4 data exists, "
                "validate safety factor, and choose the right output format."
            )
        actions = [
            "Save current draft",
            "Verify step data readiness",
            "Choose proper export format",
        ]
        confidence = 0.88

    else:
        if vi:
            reply = (
                f"Theo du lieu hien tai (P={m['power']:.1f} kW, n={m['speed']:.0f} rpm), "
                "ban nen kiem tra ratio tong, do ben truc va margin safety factor truoc khi chot phuong an."
            )
        else:
            reply = (
                f"Based on current data (P={m['power']:.1f} kW, n={m['speed']:.0f} rpm), "
                "review total ratio, shaft strength, and safety-factor margin before finalizing."
            )
        actions = [
            "Review ratio and torque",
            "Validate shaft and bearing selection",
            "Confirm safety margin",
        ]
        confidence = 0.75

    return {
        "reply": reply,
        "actions": actions,
        "confidence": confidence,
    }


def main() -> None:
    raw = sys.stdin.read() or "{}"
    try:
        payload = json.loads(raw)
    except Exception:
        payload = {}

    question = str(payload.get("question") or "")
    language = "en" if str(payload.get("language") or "").lower() == "en" else "vi"
    context = payload.get("context") if isinstance(payload.get("context"), dict) else {}

    intent = detect_intent(question)
    metrics = build_metrics(context)
    result = format_reply(intent, metrics, language)

    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
