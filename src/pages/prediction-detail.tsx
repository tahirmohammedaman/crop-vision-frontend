import * as React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { PredictionHistoryItem } from '@/types/dto'
import { historyApi, mediaApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatOrigin(origin: string) {
  return origin.replace(/_/g, ' ')
}

function formatConfidence(value: number) {
  if (Number.isNaN(value)) return '—'
  if (value <= 1) return `${(value * 100).toFixed(2)}%`
  if (value <= 100) return `${value.toFixed(2)}%`
  return value.toFixed(2)
}

function statusBadge(item: PredictionHistoryItem) {
  if (item.confirmed == null) {
    return <Badge variant="secondary">Pending review</Badge>
  }
  if (item.confirmed) {
    return <Badge variant="secondary">Confirmed correct</Badge>
  }
  return <Badge variant="destructive">Marked incorrect</Badge>
}

function usePredictionFromState() {
  const location = useLocation()
  const state = location.state as { item?: PredictionHistoryItem } | undefined
  return state?.item
}

export function PredictionDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const stateItem = usePredictionFromState()
  const numericId = params.id ? Number(params.id) : NaN
  const [item, setItem] = React.useState<PredictionHistoryItem | null>(stateItem ?? null)
  const [isLoading, setIsLoading] = React.useState(!stateItem)
  const [error, setError] = React.useState<string | null>(null)
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [isImageLoading, setIsImageLoading] = React.useState(false)
  const [imageError, setImageError] = React.useState<string | null>(null)

  const probabilityEntries = React.useMemo(() => {
    if (!item?.probabilities) return [] as Array<{ label: string; value: number }>
    return Object.entries(item.probabilities)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && !Number.isNaN(entry[1]))
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [item])

  const metadataEntries = React.useMemo<Array<{ label: string; value: React.ReactNode }>>(() => {
    if (!item) return []
    return [
      { label: 'Prediction ID', value: `#${item.id}` },
      { label: 'Crop', value: item.crop },
      { label: 'Predicted label', value: item.predicted_label },
      { label: 'Corrected label', value: item.corrected_label ? item.corrected_label : '—' },
      { label: 'Confidence', value: formatConfidence(item.predicted_confidence) },
      { label: 'Created at', value: formatDateTime(item.created_at) },
      { label: 'Device timestamp', value: formatDateTime(item.device_local_timestamp) },
      { label: 'Device ID', value: item.device_id ?? '—' },
      { label: 'Origin', value: formatOrigin(item.origin) },
      { label: 'Confirmed', value: item.confirmed == null ? 'Pending review' : item.confirmed ? 'Yes' : 'No' },
      { label: 'Confirmed at', value: item.confirmed_at ? formatDateTime(item.confirmed_at) : '—' },
      { label: 'Uploader', value: item.user?.username ?? '—' },
      { label: 'Uploader ID', value: item.user_id ?? '—' },
      {
        label: 'Image key',
        value: item.image_url ? (
          <span className="font-mono text-xs leading-relaxed text-muted-foreground break-all">{item.image_url}</span>
        ) : (
          '—'
        ),
      },
    ]
  }, [item])

  React.useEffect(() => {
    if (!Number.isNaN(numericId) && stateItem) {
      setItem(stateItem)
      setIsLoading(false)
      setError(null)
    }
  }, [numericId, stateItem])

  React.useEffect(() => {
    if (Number.isNaN(numericId) || stateItem) return
    let cancelled = false
    async function loadPrediction() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await historyApi.getById(numericId)
        if (cancelled) return
        if (!response) {
          setError('Prediction not found.')
          setItem(null)
          return
        }
        setItem(response)
      } catch (err) {
        if (cancelled) return
        setItem(null)
        setError(err instanceof Error ? err.message : 'Failed to load prediction details.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadPrediction()
    return () => {
      cancelled = true
    }
  }, [numericId, stateItem])

  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    if (!item?.image_url) {
      setImageUrl(null)
      setImageError(null)
      setIsImageLoading(false)
      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    setImageUrl(null)
    setImageError(null)
    setIsImageLoading(true)

    mediaApi.fetchImage(item.image_url)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      })
      .catch((err) => {
        if (cancelled) return
        setImageUrl(null)
        setImageError(err instanceof Error ? err.message : 'Unable to load image preview.')
      })
      .finally(() => {
        if (!cancelled) setIsImageLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [item?.image_url])

  if (!params.id || Number.isNaN(numericId)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Prediction detail</h1>
        <Card>
          <CardContent className="py-6 text-sm text-destructive">The provided prediction id is invalid.</CardContent>
        </Card>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prediction #{numericId}</h1>
          <p className="text-sm text-muted-foreground">Inspect the complete record, including device metadata and review outcomes.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>Back to history</Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : item ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)]">
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription>Full payload returned by the history endpoint for this prediction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="px-3 py-1 text-base">{item.predicted_label}</Badge>
                    <Badge variant="secondary" className="capitalize">{item.crop}</Badge>
                    <Badge variant="outline">Confidence {formatConfidence(item.predicted_confidence)}</Badge>
                    {statusBadge(item)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Origin</span>
                    <Badge variant="outline" className="capitalize">{formatOrigin(item.origin)}</Badge>
                  </div>
                  {item.corrected_label && item.corrected_label !== item.predicted_label && (
                    <div className="rounded-md border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                      Corrected to <span className="font-semibold">{item.corrected_label}</span> during review.
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  {metadataEntries.map(({ label, value }) => (
                    <div key={label} className="space-y-1 rounded-md border border-border/80 p-3 text-sm">
                      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                      <div className="break-words text-sm text-foreground/90">{value}</div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Tags</p>
                  {item.tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge variant="secondary" key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags recorded.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Probability distribution</CardTitle>
                <CardDescription>Confidence values across all reported classes.</CardDescription>
              </CardHeader>
              <CardContent>
                {probabilityEntries.length ? (
                  <div className="space-y-3">
                    {probabilityEntries.map(({ label, value }) => {
                      const percent = value <= 1 ? value * 100 : value
                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{label}</span>
                            <span className="tabular-nums text-muted-foreground">{formatConfidence(value)}</span>
                          </div>
                          <Progress value={Math.max(0, Math.min(100, percent))} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No class probabilities were included with this record.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Specimen image</CardTitle>
              <CardDescription>Fetched from the media endpoint using the stored image key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isImageLoading ? (
                <Skeleton className="h-72 w-full rounded-lg" />
              ) : imageUrl ? (
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <img src={imageUrl} alt={`Prediction ${item.id}`} className="h-auto w-full object-cover" />
                </div>
              ) : (
                <div className={cn('flex h-72 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-sm text-muted-foreground')}>
                  {imageError ?? 'No image available for this record.'}
                </div>
              )}
              {imageError && !isImageLoading && (
                <p className="text-xs text-destructive">Unable to load image preview from the media endpoint. {imageError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Prediction not found.</CardContent>
        </Card>
      )}
    </div>
  )
}
