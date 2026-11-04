import * as React from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  Camera,
  ImagePlus,
  Leaf,
  Sun,
  Hand,
  RotateCcw,
  RefreshCw,
  X,
  ChevronDown,
  WifiOff,
  AlertTriangle,
  UserCheck,
  History as HistoryIcon,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DeterminationLabel, ConfidenceMeter, VerdictIcon } from '@/components/determination-label'
import { predictionsApi } from '@/lib/api'
import { getDiseaseById } from '@/data/diseases'
import { formatPercent, formatPredictionLabel, verdictFor, verdictCopy, type VerdictTier } from '@/lib/confidence'
import { cn } from '@/lib/utils'
import type { PredictionResponse } from '@/types/dto'

type DecoratedTopResult = {
  label: string
  displayName: string
  plant?: string
  confidence: number
  isPredicted: boolean
}

type UploadResultState = {
  predictedLabel: string
  predictedName: string
  confidence: number
  plant?: string
  description?: string
  recommendations: string[]
  topResults: DecoratedTopResult[]
  imageUrl?: string | null
  referenceImageUrl?: string
  isHealthy: boolean
  submittedTags: string[]
}

type FailureKind = 'offline' | 'timeout' | 'too-large' | 'server' | 'rejected' | 'unknown'
type Failure = { kind: FailureKind; detail?: string }

const failureCopy: Record<FailureKind, { title: string; body: string }> = {
  offline: {
    title: 'No connection',
    body: 'Your photo is still here. Move to a place with signal, then tap Try again.',
  },
  timeout: {
    title: 'The connection is too slow',
    body: 'Your photo is still here. Try again, or wait until the signal is stronger.',
  },
  'too-large': {
    title: 'This photo is too large',
    body: 'Choose a smaller photo, or take a new one with the camera.',
  },
  server: {
    title: 'The server had a problem',
    body: 'This is not your fault. Your photo is still here; try again in a minute.',
  },
  rejected: {
    title: 'The photo was not accepted',
    body: 'Check that it is a clear photo of one leaf, then try again.',
  },
  unknown: {
    title: 'Something went wrong',
    body: 'Your photo is still here. Tap Try again.',
  },
}

function classifyError(err: unknown): Failure {
  if (isAxiosError(err)) {
    const data = err.response?.data
    const detail = typeof data === 'string' ? data : (data as { detail?: unknown } | undefined)?.detail
    const detailText = typeof detail === 'string' ? detail : undefined
    if (!err.response) {
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return { kind: 'timeout' }
      // No response at all: the request never reached the server.
      return { kind: 'offline' }
    }
    const status = err.response.status
    if (status === 413) return { kind: 'too-large', detail: detailText }
    if (status >= 500) return { kind: 'server', detail: detailText }
    return { kind: 'rejected', detail: detailText }
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { kind: 'offline' }
  return { kind: 'unknown', detail: err instanceof Error ? err.message : undefined }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SLOW_AFTER_MS = 15000

export function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [tagsInput, setTagsInput] = React.useState<string>('')
  const [tags, setTags] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<number>(0)
  const [result, setResult] = React.useState<UploadResultState | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSlow, setIsSlow] = React.useState(false)
  const [failure, setFailure] = React.useState<Failure | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)
  const previewObjectUrlRef = React.useRef<string | null>(null)
  const resultHeadingRef = React.useRef<HTMLHeadingElement | null>(null)

  React.useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!isSubmitting) return
    const handle = window.setTimeout(() => setIsSlow(true), SLOW_AFTER_MS)
    return () => window.clearTimeout(handle)
  }, [isSubmitting])

  React.useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0 })
      resultHeadingRef.current?.focus()
    }
  }, [result])

  const buildTopResults = React.useCallback(
    (response: PredictionResponse): DecoratedTopResult[] => {
      const entries = new Map<string, number>()
      const recordEntry = (label: string | undefined | null, confidence: number | undefined | null) => {
        if (!label) return
        const parsed = typeof confidence === 'number' ? confidence : Number(confidence)
        const normalized = Number.isFinite(parsed) ? parsed : 0
        const existing = entries.get(label)
        if (existing === undefined || normalized > existing) {
          entries.set(label, normalized)
        }
      }

      if (Array.isArray(response.probabilities)) {
        if (response.classes?.length) {
          response.classes.forEach((label, index) => {
            recordEntry(label, response.probabilities?.[index])
          })
        }
      } else if (response.probabilities) {
        for (const [label, confidence] of Object.entries(response.probabilities)) {
          recordEntry(label, typeof confidence === 'number' ? confidence : Number(confidence))
        }
      }

      if (response.classes?.length) {
        response.classes.forEach((label, index) => {
          if (entries.has(label)) return
          recordEntry(label, index === 0 ? response.confidence : undefined)
        })
      }

      recordEntry(response.predicted_class, response.confidence)

      return Array.from(entries.entries())
        .map(([label, confidence]) => ({
          label,
          confidence: Number.isFinite(confidence) ? confidence : 0,
        }))
        .filter((entry) => entry.label)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map((entry) => {
          const catalogEntry = getDiseaseById(entry.label)
          const plantFallback = entry.label.split('___')[0]?.replace(/_/g, ' ').trim()
          return {
            label: entry.label,
            displayName: catalogEntry?.diseaseName ?? formatPredictionLabel(entry.label),
            plant: catalogEntry?.plant ?? (plantFallback || undefined),
            confidence: entry.confidence,
            isPredicted: entry.label === response.predicted_class,
          }
        })
    },
    []
  )

  const selectFile = (selected: File | null) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    const url = selected ? URL.createObjectURL(selected) : null
    previewObjectUrlRef.current = url
    setPreviewUrl(url)
    setFile(selected)
    setResult(null)
    setFailure(null)
    setProgress(0)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    if (selected) selectFile(selected)
    event.target.value = ''
  }

  const openCamera = () => {
    if (!isSubmitting) cameraInputRef.current?.click()
  }
  const openGallery = () => {
    if (!isSubmitting) galleryInputRef.current?.click()
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    if (isSubmitting) return
    const dropped = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith('image/'))
    if (dropped) selectFile(dropped)
  }

  const startOver = () => {
    selectFile(null)
    setTags([])
    setTagsInput('')
    window.scrollTo({ top: 0 })
  }

  const onSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!file || isSubmitting) return

    setIsSubmitting(true)
    setIsSlow(false)
    setFailure(null)
    setResult(null)
    setProgress(0)

    try {
      const handleProgress = (pct: number) => {
        setProgress((previous) => Math.max(previous, Math.min(100, Math.round(pct))))
      }

      handleProgress(1)

      const response = await predictionsApi.create(
        {
          file,
          tags: tags.length ? tags : undefined,
          origin: 'server_web',
        },
        handleProgress
      )

      const decoratedTopResults = buildTopResults(response)
      const predictedEntry = decoratedTopResults.find((item) => item.isPredicted)
      const catalogEntry = getDiseaseById(response.predicted_class)

      const recommendations = (catalogEntry?.recommendations ?? []).filter((item) => item && item.trim().length > 0)

      setProgress(100)
      setResult({
        predictedLabel: response.predicted_class,
        predictedName: catalogEntry?.diseaseName ?? formatPredictionLabel(response.predicted_class),
        confidence: predictedEntry?.confidence ?? response.confidence ?? 0,
        plant: catalogEntry?.plant ?? predictedEntry?.plant,
        description: catalogEntry?.description,
        recommendations,
        topResults: decoratedTopResults,
        imageUrl: previewObjectUrlRef.current,
        referenceImageUrl: catalogEntry?.imageUrl,
        isHealthy: catalogEntry?.isHealthy ?? /healthy/i.test(response.predicted_class),
        submittedTags: [...tags],
      })
    } catch (err) {
      setProgress(0)
      setFailure(classifyError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    const value = tagsInput.trim().replace(/,$/, '')
    if (!value) return
    if (!tags.includes(value)) setTags((current) => [...current, value])
    setTagsInput('')
  }

  const onTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    } else if (event.key === 'Backspace' && !tagsInput) {
      setTags((current) => current.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => setTags((current) => current.filter((value) => value !== tag))

  const fileInputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
        disabled={isSubmitting}
      />
      <input
        ref={galleryInputRef}
        id="image"
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
        disabled={isSubmitting}
      />
    </>
  )

  if (result) {
    return (
      <>
        {fileInputs}
        <ResultView
          result={result}
          headingRef={resultHeadingRef}
          onRetake={() => {
            setResult(null)
            openCamera()
          }}
          onStartOver={startOver}
        />
      </>
    )
  }

  const stage = isSubmitting ? (progress < 100 ? 'sending' : 'checking') : null

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-bold tracking-[-0.01em]">Check a leaf</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Take a clear photo of one sick leaf. You'll get the likely disease, how sure the model is, and what to do.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {fileInputs}

        <div
          onDragOver={(event) => {
            event.preventDefault()
            if (!isSubmitting) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 bg-card',
            previewUrl ? 'border-border' : 'border-dashed border-input',
            isDragging && 'border-primary bg-likely-tint'
          )}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="The leaf photo you chose"
                className={cn('h-full w-full object-cover transition-[filter] duration-500', stage === 'checking' && 'saturate-[.6]')}
              />
              {stage && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  <div className="leaf-sweep absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-transparent via-white/45 to-transparent" />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col justify-center gap-4 p-5">
              <p className="text-base font-semibold">For a good result</p>
              <ul className="space-y-3 text-base">
                <li className="flex items-start gap-3">
                  <Leaf className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <span>One leaf, filling most of the photo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sun className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <span>Daylight, but out of harsh direct sun</span>
                </li>
                <li className="flex items-start gap-3">
                  <Hand className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <span>Hold steady so the spots are sharp</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {file && !stage && (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="min-w-0 truncate">
              {file.name} · {formatBytes(file.size)}
            </span>
            <button
              type="button"
              onClick={() => selectFile(null)}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 font-semibold text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" aria-hidden />
              Remove
            </button>
          </div>
        )}

        {stage && (
          <div className="rounded-xl border bg-card p-4" role="status" aria-live="polite">
            <ol className="space-y-3 text-base">
              <li className="flex items-center gap-3">
                {stage === 'sending' ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
                ) : (
                  <VerdictIcon tier="likely" className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span className={cn('flex-1', stage === 'sending' ? 'font-semibold' : 'text-muted-foreground')}>
                  {stage === 'sending' ? 'Sending photo…' : 'Photo sent'}
                </span>
                {stage === 'sending' && <span className="tabular-nums font-semibold">{progress}%</span>}
              </li>
              <li className="flex items-center gap-3">
                {stage === 'checking' ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-input" aria-hidden />
                )}
                <span className={cn('flex-1', stage === 'checking' ? 'font-semibold' : 'text-muted-foreground')}>
                  Checking the leaf…
                </span>
              </li>
            </ol>
            {stage === 'sending' && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
            {isSlow && (
              <p className="mt-4 text-sm font-medium text-possible">
                Slow connection. Still working; keep this screen open.
              </p>
            )}
          </div>
        )}

        {failure && <FailureNotice failure={failure} onRetry={() => onSubmit()} onChoose={openGallery} />}

        {!stage && (
          <div className="grid gap-3">
            {file ? (
              <>
                {!failure && (
                  <Button type="submit" size="xl" className="w-full">
                    Check this leaf
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" size="lg" onClick={openCamera}>
                    <Camera className="mr-2 h-5 w-5" aria-hidden />
                    Retake
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={openGallery}>
                    <ImagePlus className="mr-2 h-5 w-5" aria-hidden />
                    Gallery
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button type="button" size="xl" className="w-full" onClick={openCamera}>
                  <Camera className="mr-2 h-6 w-6" aria-hidden />
                  Take photo
                </Button>
                <Button type="button" variant="outline" size="lg" className="w-full" onClick={openGallery}>
                  <ImagePlus className="mr-2 h-5 w-5" aria-hidden />
                  Choose from gallery
                </Button>
                <p className="hidden text-center text-sm text-muted-foreground md:block">
                  On a computer you can also drop an image onto the box above.
                </p>
              </>
            )}
          </div>
        )}

        <details className="group rounded-xl border bg-card" open={tags.length > 0 || undefined}>
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              Add tags <span className="font-normal text-muted-foreground">(optional)</span>
              {tags.length > 0 && <span className="ml-2 tabular-nums text-muted-foreground">· {tags.length}</span>}
            </span>
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-3 border-t px-4 pb-4 pt-3">
            <label htmlFor="tags" className="block text-sm text-muted-foreground">
              Field, plot or variety, so you can find this check later.
            </label>
            <div className="flex gap-2">
              <input
                id="tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                onKeyDown={onTagKeyDown}
                enterKeyHint="done"
                className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base placeholder:text-muted-foreground"
                placeholder="e.g. plot-3"
                disabled={isSubmitting}
              />
              <Button type="button" variant="outline" size="lg" onClick={addTag} disabled={!tagsInput.trim() || isSubmitting}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tags">
                {tags.map((tag) => (
                  <li key={tag} className="inline-flex h-10 items-center gap-1 rounded-full bg-secondary pl-3 text-sm font-medium">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </form>
    </div>
  )
}

function FailureNotice({ failure, onRetry, onChoose }: { failure: Failure; onRetry: () => void; onChoose: () => void }) {
  const copy = failureCopy[failure.kind]
  const Icon = failure.kind === 'offline' || failure.kind === 'timeout' ? WifiOff : AlertTriangle
  const canRetry = failure.kind !== 'too-large'
  return (
    <div role="alert" className="rounded-xl border border-unsure/40 bg-unsure-tint p-4">
      <p className="flex items-center gap-2 text-lg font-bold text-unsure">
        <Icon className="h-6 w-6 shrink-0" aria-hidden />
        {copy.title}
      </p>
      <p className="mt-2 text-base text-foreground">{copy.body}</p>
      {failure.detail && <p className="mt-2 text-sm text-muted-foreground">Server said: “{failure.detail}”</p>}
      <div className="mt-4">
        {canRetry ? (
          <Button type="button" size="xl" className="w-full" onClick={onRetry}>
            <RefreshCw className="mr-2 h-5 w-5" aria-hidden />
            Try again
          </Button>
        ) : (
          <Button type="button" size="xl" className="w-full" onClick={onChoose}>
            <ImagePlus className="mr-2 h-5 w-5" aria-hidden />
            Choose another photo
          </Button>
        )}
      </div>
    </div>
  )
}

type ResultViewProps = {
  result: UploadResultState
  headingRef: React.RefObject<HTMLHeadingElement>
  onRetake: () => void
  onStartOver: () => void
}

function ResultView({ result, headingRef, onRetake, onStartOver }: ResultViewProps) {
  const baseTier = verdictFor(result.confidence, result.predictedLabel)
  const tier: VerdictTier = result.isHealthy && baseTier === 'likely' ? 'healthy' : baseTier
  const others = result.topResults.filter((item) => !item.isPredicted && item.confidence > 0.01)
  const runnerUp = others[0]
  const closeCall = runnerUp && result.confidence - runnerUp.confidence < 0.2
  const showTreatment = !result.isHealthy && result.recommendations.length > 0

  const treatmentList = (
    <ol className="space-y-3">
      {result.recommendations.map((recommendation, index) => (
        <li key={recommendation} className="flex gap-3 text-base leading-relaxed">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tabular-nums">
            {index + 1}
          </span>
          <span>{recommendation}</span>
        </li>
      ))}
    </ol>
  )

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-[-0.01em] outline-none">
        Result
      </h1>

      <DeterminationLabel tier={tier} confidence={result.confidence} name={result.predictedName} plant={result.plant} />

      {closeCall && runnerUp && (
        <p className="rounded-xl bg-possible-tint p-4 text-base text-foreground">
          <span className="font-semibold">Could also be {runnerUp.displayName}</span>
          {runnerUp.plant && runnerUp.plant !== result.plant ? ` on ${runnerUp.plant}` : ''} ({formatPercent(runnerUp.confidence)}). The two look similar, so a second opinion helps.
        </p>
      )}

      {tier === 'unsure' && (
        <section aria-labelledby="next-steps" className="space-y-3">
          <h2 id="next-steps" className="text-lg font-bold">
            What to do now
          </h2>
          <Button type="button" size="xl" className="w-full" onClick={onRetake}>
            <Camera className="mr-2 h-6 w-6" aria-hidden />
            Retake the photo
          </Button>
          <p className="text-sm text-muted-foreground">Closer, sharper and in even daylight usually helps most.</p>
          <div className="flex gap-3 rounded-xl border bg-card p-4">
            <UserCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
            <p className="text-base">
              <span className="font-semibold">Ask an agronomist to check it.</span> Show them this result or the leaf
              itself. This check is saved in your{' '}
              <Link to="/history" className="font-semibold text-primary underline underline-offset-4">
                history
              </Link>
              , where it can be reviewed.
            </p>
          </div>
        </section>
      )}

      <figure className="grid grid-cols-3 gap-3">
        {result.imageUrl && (
          <div className={cn(result.referenceImageUrl ? 'col-span-2' : 'col-span-3')}>
            <img
              src={result.imageUrl}
              alt="Your leaf photo"
              className="aspect-[4/3] w-full rounded-xl border object-cover"
            />
            <figcaption className="mt-1.5 text-sm text-muted-foreground">Your photo</figcaption>
          </div>
        )}
        {result.referenceImageUrl && (
          <div>
            <img
              src={result.referenceImageUrl}
              alt={`Reference photo of ${result.predictedName}`}
              loading="lazy"
              className="aspect-square w-full rounded-xl border object-cover"
            />
            <p className="mt-1.5 text-sm text-muted-foreground">{result.isHealthy ? 'Healthy leaf' : 'Typical case'}</p>
          </div>
        )}
      </figure>

      {showTreatment && tier !== 'unsure' && (
        <section aria-labelledby="treatment" className="space-y-3">
          <h2 id="treatment" className="text-lg font-bold">
            What to do
          </h2>
          {tier === 'possible' && (
            <p className="text-base text-muted-foreground">Compare your leaf with the typical case first. If they match:</p>
          )}
          {treatmentList}
        </section>
      )}

      {showTreatment && tier === 'unsure' && (
        <details className="group rounded-xl border bg-card">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
            If it is confirmed as {result.predictedName}
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="border-t px-4 pb-4 pt-3">{treatmentList}</div>
        </details>
      )}

      {result.description && (
        <section aria-labelledby="about" className="space-y-2">
          <h2 id="about" className="text-lg font-bold">
            {result.isHealthy ? 'About this result' : `About ${result.predictedName}`}
          </h2>
          <p className="max-w-[65ch] text-base leading-relaxed">{result.description}</p>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="others" className="space-y-3">
          <h2 id="others" className="text-lg font-bold">
            Other possibilities
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {others.map((item) => {
              const otherTier = verdictFor(item.confidence, item.label)
              return (
                <li key={item.label} className="space-y-2 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.displayName}</p>
                      {item.plant && <p className="text-sm text-muted-foreground">{item.plant}</p>}
                    </div>
                    <span className="shrink-0 tabular-nums font-semibold">{formatPercent(item.confidence)}</span>
                  </div>
                  <ConfidenceMeter value={item.confidence} tier={otherTier} />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {result.submittedTags.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Tags: <span className="font-medium text-foreground">{result.submittedTags.join(', ')}</span>
        </p>
      )}

      <div className="grid gap-3 border-t pt-6">
        <Button type="button" size="xl" variant={tier === 'unsure' ? 'outline' : 'default'} className="w-full" onClick={onStartOver}>
          <RotateCcw className="mr-2 h-5 w-5" aria-hidden />
          Check another leaf
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/history">
            <HistoryIcon className="mr-2 h-5 w-5" aria-hidden />
            See all checks
          </Link>
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {verdictCopy[tier].word}: {result.predictedName}, {formatPercent(result.confidence)}.
      </p>
    </div>
  )
}
