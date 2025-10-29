import * as React from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getDiseaseById, SeverityLevel } from '@/data/diseases'
import { cn } from '@/lib/utils'

const severityStyles: Record<SeverityLevel, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100',
  low: 'bg-sky-200 text-sky-900 dark:bg-sky-400/20 dark:text-sky-100',
  none: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100',
  unknown: 'bg-muted text-muted-foreground',
}

const severityLabel = (severity: SeverityLevel, isHealthy: boolean) => {
  if (isHealthy) return 'Healthy'
  if (severity === 'unknown') return 'Severity unknown'
  return `${severity.charAt(0).toUpperCase()}${severity.slice(1)} severity`
}

const placeholderBackground =
  'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 60%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, rgba(16,185,129,0.08), rgba(15,118,110,0.05))'

const lensSize = 160
const zoomScale = 240

export function DiseaseDetailPage() {
  const params = useParams<{ id: string }>()
  const decodedId = params.id ? decodeURIComponent(params.id) : ''
  const disease = getDiseaseById(decodedId)

  const [isZooming, setIsZooming] = React.useState(false)
  const [zoom, setZoom] = React.useState({ xPercent: 50, yPercent: 50, xPx: lensSize / 2, yPx: lensSize / 2 })
  const imageRef = React.useRef<HTMLDivElement>(null)

  const handlePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!disease?.imageUrl) return
    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    const clampedX = Math.min(Math.max(offsetX, 0), rect.width)
    const clampedY = Math.min(Math.max(offsetY, 0), rect.height)
    const xPercent = (clampedX / rect.width) * 100
    const yPercent = (clampedY / rect.height) * 100
    setZoom({ xPercent, yPercent, xPx: clampedX, yPx: clampedY })
    setIsZooming(true)
  }, [disease?.imageUrl])

  const handlePointerLeave = React.useCallback(() => {
    setIsZooming(false)
  }, [])

  if (!disease) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Disease Detail</h1>
        <div className="rounded-2xl bg-muted/10 p-6 text-sm text-muted-foreground">
          No data found for this disease.
        </div>
      </div>
    )
  }

  const severityText = severityLabel(disease.severity, disease.isHealthy)
  const hasImage = Boolean(disease.imageUrl)

  const listSection = (title: string, items: string[]) => (
    <section className="space-y-3 rounded-2xl bg-muted/10 p-5">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {items.length === 0 && <p className="text-xs text-muted-foreground">Not documented.</p>}
      </header>
      {items.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{disease.diseaseName}</h1>
          <p className="text-sm text-muted-foreground">Plant: {disease.plant}</p>
        </div>
        <Badge className={cn('px-3 py-1 text-sm', severityStyles[disease.severity])}>{severityText}</Badge>
      </div>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Specimen imagery</h2>
          <p className="text-sm text-muted-foreground">
            {hasImage
              ? 'Hover anywhere on the specimen to inspect close-up details. The live magnifier tracks your cursor.'
              : 'Hover over the placeholder to preview the zoom behaviour. Replace with an official asset to enable it.'}
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <div
            ref={imageRef}
            onPointerMove={hasImage ? handlePointerMove : undefined}
            onPointerLeave={hasImage ? handlePointerLeave : undefined}
            className={cn(
              'relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted/60 shadow-sm transition-shadow lg:h-full',
              hasImage && 'cursor-crosshair hover:shadow-lg'
            )}
            style={hasImage ? undefined : { backgroundImage: placeholderBackground }}
          >
            {hasImage ? (
              <img
                src={disease.imageUrl}
                alt={`${disease.diseaseName} specimen`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-xs font-medium uppercase tracking-widest text-muted-foreground"
                style={{ backgroundImage: placeholderBackground }}
              >
                Image placeholder
              </div>
            )}
            {hasImage && isZooming && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 shadow-xl transition-opacity"
                style={{
                  width: lensSize,
                  height: lensSize,
                  left: zoom.xPx,
                  top: zoom.yPx,
                  background:
                    'radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 60%, rgba(15,23,42,0.35) 100%)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                }}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/70" />
                  <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/70" />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-muted/10 p-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Live zoom window</span>
                <span>{isZooming ? 'Tracking cursor' : 'Hover to activate'}</span>
              </div>
              <div
                className={cn(
                  'relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/40',
                  !isZooming && 'opacity-60'
                )}
                style={{
                  backgroundImage: hasImage ? `url('${disease.imageUrl}')` : placeholderBackground,
                  backgroundSize: hasImage ? `${zoomScale}%` : '225%',
                  backgroundPosition: `${zoom.xPercent}% ${zoom.yPercent}%`,
                  transition: 'background-position 120ms ease, opacity 150ms ease',
                }}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {hasImage
                ? 'The zoom preview mirrors the real-time position of your cursor for inspection and QA review.'
                : 'Upload a verified specimen asset to unlock full-resolution zoom and live cursor tracking.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-muted/10 p-6 shadow-sm">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">Quick facts</h2>
              <p className="text-sm text-muted-foreground">Core catalog metadata for this specimen.</p>
            </header>
            <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground">Catalog label</dt>
                <dd className="font-medium leading-relaxed">{disease.label}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Causal agent</dt>
                <dd className="font-medium leading-relaxed">{disease.causalAgent}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Pathogen scientific name</dt>
                <dd className="font-medium leading-relaxed">{disease.pathogenScientificName}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Plant</dt>
                <dd className="font-medium leading-relaxed">{disease.plant}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl bg-muted/10 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{disease.description}</p>
          </section>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {listSection('Affected plant parts', disease.affectedParts)}
          {listSection('Symptoms', disease.symptoms)}
          {listSection('Recommended actions', disease.recommendations)}
          {listSection('Prevention tips', disease.prevention)}
          {listSection('Commonly confused with', disease.commonConfusion)}
        </div>
      </section>
    </div>
  )
}
