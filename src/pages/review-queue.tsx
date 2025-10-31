import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { PredictionHistoryItem } from '@/types/dto'
import { reviewApi } from '@/lib/api'

const PAGE_SIZE = 10

function formatOrigin(origin?: string | null) {
  if (!origin) return '—'
  return origin.replace(/_/g, ' ')
}

function formatConfidence(value?: number | null): string {
  if (value == null) return '—'
  if (Number.isNaN(value)) return '—'
  if (value <= 1) return `${(value * 100).toFixed(1)}%`
  if (value <= 100) return `${value.toFixed(1)}%`
  return value.toFixed(2)
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unable to load review queue from the server.'
}

export function ReviewQueuePage() {
  const navigate = useNavigate()
  const [page, setPage] = React.useState(0)
  const [items, setItems] = React.useState<PredictionHistoryItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function loadQueue() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await reviewApi.queue({ skip: page * PAGE_SIZE, limit: PAGE_SIZE })
        if (cancelled) return
        setItems(res.items)
        setTotal(res.total)
      } catch (err) {
        if (cancelled) return
        setItems([])
        setTotal(0)
        setError(describeError(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadQueue()
    return () => {
      cancelled = true
    }
  }, [page])

  const showingRangeStart = page * PAGE_SIZE + (items.length ? 1 : 0)
  const showingRangeEnd = page * PAGE_SIZE + items.length
  const canPrevious = page > 0
  const canNext = showingRangeEnd < total

  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-sm text-destructive">
            {error}
          </TableCell>
        </TableRow>
      )
    }

    if (!items.length) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-sm text-muted-foreground">
            No predictions are waiting for review.
          </TableCell>
        </TableRow>
      )
    }

    return items.map((item) => {
      const corrected = item.corrected_label && item.corrected_label !== item.predicted_label ? item.corrected_label : null
      return (
        <TableRow
          key={item.id}
          className="cursor-pointer"
          onClick={() => navigate(`/review/${item.id}`, { state: { item } })}
        >
          <TableCell className="whitespace-nowrap text-sm">{new Date(item.created_at).toLocaleString()}</TableCell>
          <TableCell className="text-sm font-medium">{item.crop}</TableCell>
          <TableCell className="text-sm">
            <div className="flex flex-col gap-1">
              <span>{item.predicted_label}</span>
              {corrected && (
                <span className="text-xs text-muted-foreground">
                  Corrected to <span className="font-medium">{corrected}</span>
                </span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums">{formatConfidence(item.predicted_confidence)}</TableCell>
          <TableCell className="text-sm">
            <Badge variant="outline" className="capitalize">{formatOrigin(item.origin)}</Badge>
          </TableCell>
          <TableCell className="text-sm">
            {corrected ? (
              <Badge variant="destructive">Corrected</Badge>
            ) : item.confirmed ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">Confirmed</Badge>
            ) : item.confirmed === false ? (
              <Badge variant="destructive">Incorrect</Badge>
            ) : (
              <span className="text-muted-foreground">Pending</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/review/${item.id}`, { state: { item } })
              }}
            >
              Review
            </Button>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-sm text-muted-foreground">Work through pending predictions that require confirmation.</p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Pending reviews</CardTitle>
          <CardDescription>
            {total ? (
              <>Showing {showingRangeStart}-{showingRangeEnd} of {total} predictions</>
            ) : (
              'No queued predictions'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Created</TableHead>
                  <TableHead className="min-w-[120px]">Crop</TableHead>
                  <TableHead className="min-w-[220px]">Prediction</TableHead>
                  <TableHead className="min-w-[120px] text-right">Confidence</TableHead>
                  <TableHead className="min-w-[120px]">Origin</TableHead>
                  <TableHead className="min-w-[120px]">Verification</TableHead>
                  <TableHead className="min-w-[80px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderBody()}</TableBody>
              <TableCaption>Select a row to open the review detail.</TableCaption>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Page {page + 1}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrevious}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
