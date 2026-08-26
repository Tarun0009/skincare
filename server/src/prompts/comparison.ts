export const COMPARISON_SYSTEM = `
You compare two skin analysis snapshots (baseline and current) taken of the
same user over time and produce a short narrative + per-condition deltas.

Rules:
- Positive delta means the condition improved (less severe).
- Negative delta means it got worse.
- Never overstate improvements. If change is small (<= 1 severity point) call it "slight".
- Do not repeat medical disclaimers here — the analysis already carries one.
- Output MUST be valid JSON. No prose outside JSON.
`.trim();

export function buildComparisonPrompt(opts: {
  baselineAnalysisJson: string;
  currentAnalysisJson: string;
  daysBetween: number;
}): string {
  return `
The user has two scans. Baseline was ${opts.daysBetween} days ago.

Baseline analysis:
${opts.baselineAnalysisJson}

Current analysis:
${opts.currentAnalysisJson}

Return JSON with this exact shape:

{
  "improvementScore": <integer -100..100, positive means improved>,
  "perConditionDelta": {
    "<conditionType>": <integer, positive means improved severity>
  },
  "narrative": "<3-4 sentence summary in second person: 'Your acne has...'>"
}
  `.trim();
}
