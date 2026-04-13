# Local LLM Draft Workflow (Ollama / LM Studio)

This document describes the AI draft workflow for generating a complete gearbox wizard draft and step-by-step engineering reviews.

## Goals

- Generate a complete draft payload for Step 1 -> Step 5 from user intent.
- Review each step payload and provide warnings/suggestions while users fill inputs.
- Run fully on local models (no cloud dependency) through Ollama or LM Studio.

## Implemented API Endpoints

- `POST /api/v1/ai/generate-draft`
- `POST /api/v1/ai/review-step`

Both endpoints require JWT auth.

## Environment Variables

- `LOCAL_LLM_PROVIDER`: `ollama` or `lmstudio`
- `LOCAL_LLM_MODEL`: model name
- `LOCAL_LLM_TIMEOUT_MS`: request timeout in milliseconds
- `OLLAMA_ENDPOINT`: default `http://127.0.0.1:11434/api/chat`
- `LMSTUDIO_ENDPOINT`: default `http://127.0.0.1:1234/v1/chat/completions`

## Request/Response Contracts

### 1) Generate Draft

Request:

```json
{
  "goal": "Create a balanced industrial gearbox draft",
  "language": "vi",
  "currentData": {
    "step1Input": { "power": 15.5, "speed": 1450, "loadType": "constant", "life": 20000 }
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "step1": { "power": 15.5, "speed": 1450, "loadType": "constant", "life": 20000 },
    "step2": { "strategy": "..." },
    "step3": { "uBelt": 3, "d1": 120, "spurTeeth": 24, "moduleValue": 2.5, "faceWidth": 25, "gearMode": "spiral", "helixAngle": 20 },
    "step4": { "preferredBearing": "SKF 6207-2RS1", "expectedLifeHours": 20000 },
    "step5Estimate": { "safetyFactorTarget": 1.25, "riskLevel": "medium", "summary": "..." },
    "notes": ["...", "..."],
    "source": "local-llm"
  }
}
```

### 2) Review Step

Request:

```json
{
  "step": 3,
  "language": "en",
  "payload": {
    "uBelt": 6.5,
    "d1": 120
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "step": 3,
    "warnings": ["Belt ratio is outside the common stable range (1.5-6)."],
    "suggestions": ["Check ratio split across stages to reduce peak stress."],
    "source": "rule-check"
  }
}
```

## Frontend Integration Plan

1. Add a `Generate Full Draft` action in AI Assistant UI.
2. Map response fields directly to wizard payload shape used by local draft persistence.
3. Add lightweight step-review hook when step data changes (debounced requests to `/ai/review-step`).
4. Render warnings/suggestions as non-blocking hints.

## Notes

- If local LLM is unavailable, backend returns deterministic fallback draft/review.
- This keeps the workflow usable before final model selection.
