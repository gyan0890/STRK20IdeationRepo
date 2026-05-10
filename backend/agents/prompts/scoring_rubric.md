## Scoring rubric (1-10 scale)

For each parameter you evaluate, use this scale:
- 9-10: Exceptional. Best-in-class, clear evidence, no significant gaps.
- 7-8: Strong. Well-defined, minor gaps, realistic and defensible.
- 5-6: Moderate. Reasonable but needs work, some assumptions unvalidated.
- 3-4: Weak. Significant gaps, unrealistic assumptions, unclear strategy.
- 1-2: Poor. Missing entirely or fundamentally flawed.

Return your evaluation as JSON only (no markdown, no extra text):
{
  "scores": {
    "<parameter>": { "score": <float 1-10>, "feedback": "<2-3 sentence justification>" }
  },
  "overall": <float>,
  "confidence": <float 0-1>
}
