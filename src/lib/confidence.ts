// Plain-language confidence tiers for the result and history views.
// These thresholds are a client display choice only; the server decides
// what lands in the review queue.

export type VerdictTier = 'likely' | 'possible' | 'unsure' | 'healthy'

export const LIKELY_MIN = 0.85
export const POSSIBLE_MIN = 0.6

/** Normalise 0–1 or 0–100 inputs to 0–1. */
export function toUnit(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0
  const v = value > 1 ? value / 100 : value
  return Math.min(1, Math.max(0, v))
}

export function formatPercent(value: number | null | undefined): string {
  const pct = toUnit(value) * 100
  if (pct > 0 && pct < 1) return '<1%'
  return `${Math.round(pct)}%`
}

export function isHealthyLabel(label: string | null | undefined): boolean {
  return !!label && /healthy/i.test(label)
}

export function verdictFor(confidence: number | null | undefined, label?: string | null): VerdictTier {
  const c = toUnit(confidence)
  if (c >= LIKELY_MIN) return isHealthyLabel(label) ? 'healthy' : 'likely'
  if (c >= POSSIBLE_MIN) return 'possible'
  return 'unsure'
}

export const verdictCopy: Record<VerdictTier, { word: string; sentence: string }> = {
  likely: { word: 'Likely', sentence: 'The model is fairly sure.' },
  healthy: { word: 'Looks healthy', sentence: 'The model is fairly sure this leaf has no disease it knows.' },
  possible: {
    word: 'Possible',
    sentence: 'It could be this, but compare the leaf with the reference photo before you treat.',
  },
  unsure: {
    word: 'Not sure',
    sentence: "The model can't tell yet. Don't treat the crop based on this alone.",
  },
}

export function formatPredictionLabel(label: string | null | undefined): string {
  if (!label) return 'Unknown'
  return (
    label
      .split('___')
      .map((segment) => segment.replace(/_/g, ' ').trim())
      .filter(Boolean)
      .join(' – ') || label
  )
}
