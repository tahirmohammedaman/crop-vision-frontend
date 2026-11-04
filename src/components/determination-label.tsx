import { CheckCircle2, HelpCircle, AlertTriangle, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent, toUnit, verdictCopy, LIKELY_MIN, POSSIBLE_MIN, type VerdictTier } from '@/lib/confidence'

const tierStyle: Record<VerdictTier, { text: string; rule: string; tint: string; bar: string }> = {
  likely: { text: 'text-likely', rule: 'border-t-likely', tint: 'bg-likely-tint', bar: 'bg-likely' },
  healthy: { text: 'text-likely', rule: 'border-t-likely', tint: 'bg-likely-tint', bar: 'bg-likely' },
  possible: { text: 'text-possible', rule: 'border-t-possible', tint: 'bg-possible-tint', bar: 'bg-possible' },
  unsure: { text: 'text-unsure', rule: 'border-t-unsure', tint: 'bg-unsure-tint', bar: 'bg-unsure' },
}

export function VerdictIcon({ tier, className }: { tier: VerdictTier; className?: string }) {
  const Icon = tier === 'healthy' ? Leaf : tier === 'likely' ? CheckCircle2 : tier === 'possible' ? HelpCircle : AlertTriangle
  return <Icon className={className} aria-hidden="true" strokeWidth={2.25} />
}

/** Word + icon chip, used in lists. */
export function VerdictChip({ tier, className }: { tier: VerdictTier; className?: string }) {
  const s = tierStyle[tier]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold', s.tint, s.text, className)}>
      <VerdictIcon tier={tier} className="h-4 w-4" />
      {verdictCopy[tier].word}
    </span>
  )
}

/** Horizontal meter with tick marks at the two tier boundaries. */
export function ConfidenceMeter({ value, tier, className }: { value: number; tier: VerdictTier; className?: string }) {
  const pct = toUnit(value) * 100
  return (
    <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
      <div className={cn('h-full rounded-full', tierStyle[tier].bar)} style={{ width: `${Math.max(2, pct)}%` }} />
      <span className="absolute inset-y-0 w-0.5 bg-card" style={{ left: `${POSSIBLE_MIN * 100}%` }} />
      <span className="absolute inset-y-0 w-0.5 bg-card" style={{ left: `${LIKELY_MIN * 100}%` }} />
    </div>
  )
}

type DeterminationLabelProps = {
  tier: VerdictTier
  confidence: number
  name: string
  plant?: string
  className?: string
}

/**
 * The determination label: the one place a diagnosis is stated.
 * Verdict word first, then the name, then the number.
 */
export function DeterminationLabel({ tier, confidence, name, plant, className }: DeterminationLabelProps) {
  const s = tierStyle[tier]
  const copy = verdictCopy[tier]
  return (
    <section
      aria-label="Diagnosis"
      className={cn('rounded-xl border border-t-[6px] bg-card p-5 text-card-foreground', s.rule, className)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn('flex items-center gap-2 text-lg font-bold', s.text)}>
          <VerdictIcon tier={tier} className="h-6 w-6" />
          {copy.word}
        </p>
        <p className="text-lg font-semibold tabular-nums text-muted-foreground">
          <span className="sr-only">Confidence </span>
          {formatPercent(confidence)}
        </p>
      </div>
      <h2 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-[-0.01em] [text-wrap:balance]">{name}</h2>
      {plant && <p className="mt-1 text-base text-muted-foreground">on {plant}</p>}
      <ConfidenceMeter value={confidence} tier={tier} className="mt-4" />
      <div className="relative mt-1.5 h-4 text-xs text-muted-foreground" aria-hidden="true">
        <span className="absolute left-0">Not sure</span>
        <span className="absolute" style={{ left: `${POSSIBLE_MIN * 100}%` }}>Possible</span>
        <span className="absolute right-0">Likely</span>
      </div>
      <p className="mt-4 text-base leading-relaxed">{copy.sentence}</p>
    </section>
  )
}
