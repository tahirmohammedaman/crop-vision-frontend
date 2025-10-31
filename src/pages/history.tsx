import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { historyApi, metadataApi } from '@/lib/api'
import type { PredictionHistoryItem } from '@/types/dto'

const PAGE_SIZE = 10

type FiltersState = {
  search: string
  crop: string
  disease: string
  origin: string
  confirmed: 'all' | 'true' | 'false'
  deviceId: string
  minConfidence: string
  maxConfidence: string
  startDate: Date | null
  endDate: Date | null
  tags: string[]
}

const initialFilters: FiltersState = {
  search: '',
  crop: '',
  disease: '',
  origin: '',
  confirmed: 'all',
  deviceId: '',
  minConfidence: '',
  maxConfidence: '',
  startDate: null,
  endDate: null,
  tags: [],
}

const origins = [
  { value: '', label: 'All origins' },
  { value: 'server_web', label: 'Server (web)' },
  { value: 'server_edge', label: 'Server (edge)' },
  { value: 'device_offline', label: 'Device (offline)' },
]

const confirmedOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'true', label: 'Only confirmed' },
  { value: 'false', label: 'Only unconfirmed' },
]

function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(handle)
  }, [value, delay])
  return debounced
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

function formatOrigin(origin: string) {
  return origin.replace(/_/g, ' ')
}

function buildDate(value: Date | null, endOfDay = false): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return date.toISOString()
}

function toConfidence(value: string): number | undefined {
  if (!value.trim()) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return undefined
  return Math.min(1, Math.max(0, num))
}

function formatConfidence(value: number): string {
  if (Number.isNaN(value)) return '—'
  if (value <= 1) return `${(value * 100).toFixed(1)}%`
  if (value <= 100) return `${value.toFixed(1)}%`
  return value.toFixed(2)
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong while contacting the server.'
}

type DatePickerFieldProps = {
  id: string
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder: string
}

function DatePickerField({ id, label, value, onChange, placeholder }: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor={id}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            type="button"
            className={cn(
              'h-10 w-full justify-start rounded-md border border-input bg-background px-3 text-left text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
            {value ? (
              dateFormatter.format(value)
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(selected: Date | undefined) => {
              onChange(selected ?? null)
              setOpen(false)
            }}
            initialFocus
          />
          {value && (
            <div className="border-t border-border/80 px-3 py-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = React.useState<FiltersState>(initialFilters)
  const [page, setPage] = React.useState(0)
  const [history, setHistory] = React.useState<PredictionHistoryItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isLookupLoading, setIsLookupLoading] = React.useState(true)
  const [lookupError, setLookupError] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [crops, setCrops] = React.useState<string[]>([])
  const [diseases, setDiseases] = React.useState<string[]>([])

  const debouncedSearch = useDebounce(filters.search)

  React.useEffect(() => {
    let cancelled = false
    async function loadLookups() {
      try {
        const [tagsRes, cropsRes, diseasesRes] = await Promise.all([
          metadataApi.tags(),
          metadataApi.crops(),
          metadataApi.diseases(),
        ])
        if (cancelled) return
        setTags(tagsRes)
        setCrops(cropsRes)
        setDiseases(diseasesRes)
      } catch (err) {
        if (cancelled) return
        setLookupError(describeError(err))
      } finally {
        if (!cancelled) setIsLookupLoading(false)
      }
    }
    loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      setIsLoading(true)
      setError(null)
      const params = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        crop: filters.crop || undefined,
        disease: filters.disease || undefined,
        tags: filters.tags.length ? filters.tags : undefined,
        min_confidence: toConfidence(filters.minConfidence),
        max_confidence: toConfidence(filters.maxConfidence),
        start_date: buildDate(filters.startDate),
        end_date: buildDate(filters.endDate, true),
        confirmed: filters.confirmed === 'all' ? undefined : filters.confirmed === 'true',
        origin: filters.origin || undefined,
        device_id: filters.deviceId.trim() ? filters.deviceId.trim() : undefined,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      }
      try {
        const res = await historyApi.list(params)
        if (cancelled) return
        setHistory(res.items)
        setTotal(res.total)
      } catch (err) {
        if (cancelled) return
        setHistory([])
        setTotal(0)
        setError(describeError(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadHistory()
    return () => {
      cancelled = true
    }
  }, [filters.crop, filters.disease, filters.tags, filters.minConfidence, filters.maxConfidence, filters.startDate, filters.endDate, filters.confirmed, filters.origin, filters.deviceId, debouncedSearch, page])

  const showingRangeStart = page * PAGE_SIZE + (history.length ? 1 : 0)
  const showingRangeEnd = page * PAGE_SIZE + history.length
  const canPrevious = page > 0
  const canNext = showingRangeEnd < total

  const resetFilters = () => {
    setPage(0)
    setFilters(() => ({ ...initialFilters }))
  }

  const toggleTag = (tag: string) => {
    setPage(0)
    setFilters((prev) => {
      const hasTag = prev.tags.includes(tag)
      const nextTags = hasTag ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
      return { ...prev, tags: nextTags }
    })
  }

  const handleInputChange = (key: keyof FiltersState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setPage(0)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectChange = <K extends 'crop' | 'disease' | 'origin' | 'confirmed'>(key: K) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setPage(0)
    setFilters((prev) => ({ ...prev, [key]: value as FiltersState[K] }))
  }

  const handleDateChange = (key: 'startDate' | 'endDate') => (date: Date | null) => {
    setPage(0)
    setFilters((prev) => ({ ...prev, [key]: date }))
  }

  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></div></div>
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

    if (!history.length) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-sm text-muted-foreground">
            No predictions match the current filters.
          </TableCell>
        </TableRow>
      )
    }

    return history.map((item) => {
      const corrected = item.corrected_label && item.corrected_label !== item.predicted_label ? item.corrected_label : null
      return (
        <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(`/history/${item.id}`, { state: { item } })}>
          <TableCell className="whitespace-nowrap text-sm">{new Date(item.created_at).toLocaleString()}</TableCell>
          <TableCell className="text-sm font-medium">{item.crop}</TableCell>
          <TableCell className="text-sm">
            <div className="flex flex-col gap-1">
              <span>{item.predicted_label}</span>
              {corrected && <span className="text-xs text-muted-foreground">Corrected to <span className="font-medium">{corrected}</span></span>}
            </div>
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums">{formatConfidence(item.predicted_confidence)}</TableCell>
          <TableCell className="text-sm">
            <Badge variant="outline" className="capitalize">{formatOrigin(item.origin)}</Badge>
          </TableCell>
          <TableCell className="text-sm">
            {item.confirmed == null ? <span className="text-muted-foreground">Pending</span> : item.confirmed ? <Badge variant="secondary">Confirmed</Badge> : <Badge variant="destructive">Incorrect</Badge>}
          </TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" onClick={(event) => {
              event.stopPropagation()
              navigate(`/history/${item.id}`, { state: { item } })
            }}>View</Button>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prediction history</h1>
        <p className="text-sm text-muted-foreground">Explore archived predictions, filter by crop or origin, and drill into the details for QA and feedback.</p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Combine filters to refine what is shown in the history table.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-search">Search</label>
              <Input id="history-search" placeholder="Search by crop, disease, tags, or device" value={filters.search} onChange={handleInputChange('search')} aria-label="Search prediction history" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-crop">Crop</label>
              <select id="history-crop" className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', 'disabled:cursor-not-allowed disabled:opacity-50')} value={filters.crop} onChange={handleSelectChange('crop')} disabled={isLookupLoading && !crops.length}>
                <option value="">All crops</option>
                {crops.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-disease">Disease</label>
              <select id="history-disease" className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', 'disabled:cursor-not-allowed disabled:opacity-50')} value={filters.disease} onChange={handleSelectChange('disease')} disabled={isLookupLoading && !diseases.length}>
                <option value="">All diseases</option>
                {diseases.map((disease) => (
                  <option key={disease} value={disease}>{disease}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-origin">Origin</label>
              <select id="history-origin" className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')} value={filters.origin} onChange={handleSelectChange('origin')}>
                {origins.map((option) => (
                  <option key={option.value || 'all-origins'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-confirmed">Status</label>
              <select id="history-confirmed" className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')} value={filters.confirmed} onChange={handleSelectChange('confirmed')}>
                {confirmedOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-device">Device ID</label>
              <Input id="history-device" value={filters.deviceId} onChange={handleInputChange('deviceId')} placeholder="Filter by device ID" />
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-min-confidence">Min confidence</label>
              <Input id="history-min-confidence" type="number" inputMode="decimal" step="0.01" min="0" max="1" value={filters.minConfidence} onChange={handleInputChange('minConfidence')} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="history-max-confidence">Max confidence</label>
              <Input id="history-max-confidence" type="number" inputMode="decimal" step="0.01" min="0" max="1" value={filters.maxConfidence} onChange={handleInputChange('maxConfidence')} placeholder="1.00" />
            </div>
            <DatePickerField
              id="history-start-date"
              label="Start date"
              placeholder="Pick start date"
              value={filters.startDate}
              onChange={handleDateChange('startDate')}
            />
            <DatePickerField
              id="history-end-date"
              label="End date"
              placeholder="Pick end date"
              value={filters.endDate}
              onChange={handleDateChange('endDate')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase text-muted-foreground">Tags</label>
              <Button
                variant="ghost"
                size="sm"
                disabled={!filters.tags.length}
                onClick={() => {
                  setPage(0)
                  setFilters((prev) => ({ ...prev, tags: [] }))
                }}
              >
                Clear tags
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {isLookupLoading && !tags.length ? (
                <Skeleton className="h-8 w-24 rounded-full" />
              ) : tags.length ? (
                tags.map((tag) => (
                  <Button key={tag} type="button" variant={filters.tags.includes(tag) ? 'default' : 'outline'} size="sm" onClick={() => toggleTag(tag)}>
                    {filters.tags.includes(tag) && <span className="mr-1">✓</span>}
                    {tag}
                  </Button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags available.</span>
              )}
            </div>
            {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Use decimals between 0 and 1 for confidence thresholds. Leaving fields blank ignores the filter.
            </div>
            <Button variant="outline" onClick={resetFilters}>Reset all</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>
            {total ? (
              <>Showing {showingRangeStart}-{showingRangeEnd} of {total} predictions</>
            ) : (
              'No predictions found'
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
                  <TableHead className="w-[80px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderBody()}</TableBody>
              <TableCaption>Tap a row to open the full prediction details.</TableCaption>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Page {page + 1}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!canPrevious} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
