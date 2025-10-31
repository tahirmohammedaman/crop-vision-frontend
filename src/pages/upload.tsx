import * as React from 'react'
import { isAxiosError } from 'axios'
import { ImageUp, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { predictionsApi } from '@/lib/api'
import { getDiseaseById } from '@/data/diseases'
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
  submittedTags: string[]
}

const formatPredictionLabel = (label: string) => {
  if (!label) return 'Unknown'
  return (
    label
      .split('___')
      .map((segment) => segment.replace(/_/g, ' ').trim())
      .filter(Boolean)
      .join(' - ') || label
  )
}

const toPercentString = (value: number | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '0%'
  const scaled = value > 1 ? value : value * 100
  const formatted = scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1)
  return `${Number(formatted)}%`
}

export function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [tagsInput, setTagsInput] = React.useState<string>('')
  const [tags, setTags] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<number>(0)
  const [result, setResult] = React.useState<UploadResultState | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const previewObjectUrlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setFile(selected)
    setResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileDialog = React.useCallback(() => {
    if (isSubmitting) return
    fileInputRef.current?.click()
  }, [isSubmitting])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    setResult(null)
    setProgress(0)

    let localPreviewUrl: string | null = null

    try {
      localPreviewUrl = URL.createObjectURL(file)
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
      previewObjectUrlRef.current = localPreviewUrl

      const handleProgress = (pct: number) => {
        setProgress((previous) => {
          const next = Math.max(previous, Math.min(100, Math.round(pct)))
          return next
        })
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
        imageUrl: localPreviewUrl,
        submittedTags: [...tags],
      })
    } catch (err) {
      if (localPreviewUrl && previewObjectUrlRef.current === localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
        previewObjectUrlRef.current = null
      }
      setProgress(0)

      if (isAxiosError(err)) {
        const detail =
          typeof err.response?.data === 'string'
            ? err.response.data
            : (err.response?.data as { detail?: string })?.detail
        setError(detail || 'Upload failed. Please try again.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Upload failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      const value = tagsInput.trim().replace(/,$/, '')
      if (!value) return
      if (!tags.includes(value)) setTags((current) => [...current, value])
      setTagsInput('')
    } else if (event.key === 'Backspace' && !tagsInput) {
      setTags((current) => current.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => setTags((current) => current.filter((value) => value !== tag))

  const otherPredictions =
    result?.topResults.filter((item) => !item.isPredicted && item.confidence > 0.01) ?? []

  return (
    <div className={`grid gap-6 ${result ? 'lg:grid-cols-2' : 'justify-items-center'}`}>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Upload image</CardTitle>
          <CardDescription>Choose a plant image and optionally add tags</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    triggerFileDialog()
                  }
                }}
                onClick={triggerFileDialog}
                aria-label="Choose or drop an image"
                aria-disabled={isSubmitting}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center transition hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSubmitting && 'pointer-events-none opacity-70'
                )}
              >
                <ImageUp className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <div className="text-sm">
                  <span className="font-medium">Click to select</span> or drag and drop
                </div>
                <div className="text-xs text-muted-foreground">PNG, JPG up to ~10MB</div>
                {file && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Selected: <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>
              <Input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Choose image"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border p-2 focus-within:ring-2 focus-within:ring-ring">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="rounded-full p-0.5 text-muted-foreground hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  onKeyDown={onTagKeyDown}
                  className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Add tags"
                  aria-label="Add tag"
                  disabled={isSubmitting}
                />
              </div>
              <div className="text-xs text-muted-foreground">Use Enter or comma to add tags. Backspace removes last tag.</div>
            </div>

            {progress > 0 && (
              <div className="space-y-1">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground" aria-live="polite">
                  {progress < 100 ? `Uploading... ${progress}%` : 'Processing complete'}
                </div>
              </div>
            )}

            {error && (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!file || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction</CardTitle>
            <CardDescription>Results powered by the CropVision API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.imageUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={result.imageUrl}
                  alt={`Prediction preview for ${result.predictedName}`}
                  className="max-h-80 max-w-full rounded object-contain"
                />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Predicted class</div>
                <div className="text-xl font-semibold leading-tight">{result.predictedName}</div>
                {result.plant && <div className="text-sm text-muted-foreground">{result.plant}</div>}
              </div>
              <Badge>{toPercentString(result.confidence)}</Badge>
            </div>

            {result.submittedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.submittedTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <div className="font-medium">Other predictions</div>
              {otherPredictions.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {otherPredictions.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm"
                    >
                      <div>
                        <div>{item.displayName}</div>
                        {item.plant && <div className="text-xs text-muted-foreground">{item.plant}</div>}
                      </div>
                      <span className="tabular-nums">{toPercentString(item.confidence)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No other predictions with confidence above 1%.</p>
              )}
            </div>

            <div>
              <div className="font-medium">Disease description</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {result.description ?? 'No description available for this disease yet.'}
              </p>
            </div>

            <div>
              <div className="font-medium">Recommended actions</div>
              {result.recommendations.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {result.recommendations.map((recommendation) => (
                    <li key={recommendation} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No recommended actions available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
