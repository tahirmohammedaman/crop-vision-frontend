import * as React from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { VerdictChip } from '@/components/determination-label'
import { CalendarIcon, Check, ChevronRight, Camera, RefreshCw, Search, SlidersHorizontal, X, AlertTriangle } from 'lucide-react'
import { cn, formatDateTimeLocal } from '@/lib/utils'
import { historyApi, metadataApi } from '@/lib/api'
import { getDiseaseById } from '@/data/diseases'
import { formatPercent, formatPredictionLabel, verdictFor } from '@/lib/confidence'
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
  { value: 'server_web', label: 'Phone or web' },
  { value: 'server_edge', label: 'Field device' },
  { value: 'device_offline', label: 'Field device, offline' },
]

const confirmedOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'true', label: 'Confirmed by a reviewer' },
  { value: 'false', label: 'Marked wrong by a reviewer' },
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

function formatOrigin(origin?: string | null) {
  if (!origin) return 'Unknown source'
  const known = origins.find((o) => o.value === origin)
  return known ? known.label : origin.replace(/_/g, ' ')
}

function displayName(label: string) {
  return getDiseaseById(label)?.diseaseName ?? formatPredictionLabel(label)
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

/** Filter inputs are typed as percent (0–100); the API still receives 0–1. */
function toConfidence(value: string): number | undefined {
  if (!value.trim()) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return undefined
  return Math.min(1, Math.max(0, num / 100))
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
      <label className="block text-sm font-semibold" htmlFor={id}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            type="button"
            className={cn(
              'h-12 w-full justify-start rounded-lg border border-input bg-background px-3 text-left text-base font-normal transition-colors hover:bg-accent hover:text-accent-foreground',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5 opacity-70" aria-hidden />
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

const selectClass =
  'h-12 w-full rounded-lg border border-input bg-background px-3 text-base disabled:cursor-not-allowed disabled:opacity-60'
const fieldLabelClass = 'block text-sm font-semibold'

function ReviewStatus({ item }: { item: PredictionHistoryItem }) {
  const corrected = item.corrected_label && item.corrected_label !== item.predicted_label
  if (corrected) return <span className="text-sm font-semibold text-possible">Corrected</span>
  if (item.confirmed) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-likely">
        <Check className="h-4 w-4" aria-hidden />
        Confirmed
      </span>
    )
  }
  if (item.confirmed === false) return <span className="text-sm font-semibold text-unsure">Marked wrong</span>
  return <span className="text-sm text-muted-foreground">Not reviewed yet</span>
}

function HistoryRow({ item }: { item: PredictionHistoryItem }) {
  const corrected = item.corrected_label && item.corrected_label !== item.predicted_label ? item.corrected_label : null
  const tier = verdictFor(item.predicted_confidence, item.predicted_label)
  return (
    <li>
      <Link
        to={`/history/${item.id}`}
        state={{ item }}
        className="flex items-center gap-3 px-4 py-4 hover:bg-accent/60 focus-visible:bg-accent/60"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <VerdictChip tier={tier} />
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{formatPercent(item.predicted_confidence)}</span>
          </div>
          {corrected ? (
            <>
              <p className="rounded-md bg-possible-tint px-2 py-1 text-base font-semibold">
                <span className="sr-only">Reviewer corrected to </span>
                {displayName(corrected)}
              </p>
              <p className="text-sm text-muted-foreground">
                Model said <s>{displayName(item.predicted_label)}</s>
              </p>
            </>
          ) : (
            <p className="text-base font-semibold leading-snug">{displayName(item.predicted_label)}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {item.crop} · {formatDateTimeLocal(item.created_at)}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{formatOrigin(item.origin)}{item.device_id ? ` (${item.device_id})` : ''}</span>
            <span aria-hidden>·</span>
            <ReviewStatus item={item} />
          </p>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1 self-start text-sm tabular-nums text-muted-foreground">
          #{item.id}
          <ChevronRight className="mt-6 h-5 w-5" aria-hidden />
        </span>
      </Link>
    </li>
  )
}

export function HistoryPage() {
  const [filters, setFilters] = React.useState<FiltersState>(initialFilters)
  const [page, setPage] = React.useState(0)
  const [history, setHistory] = React.useState<PredictionHistoryItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
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
  }, [filters.crop, filters.disease, filters.tags, filters.minConfidence, filters.maxConfidence, filters.startDate, filters.endDate, filters.confirmed, filters.origin, filters.deviceId, debouncedSearch, page, reloadKey])

  const showingRangeStart = page * PAGE_SIZE + (history.length ? 1 : 0)
  const showingRangeEnd = page * PAGE_SIZE + history.length
  const canPrevious = page > 0
  const canNext = showingRangeEnd < total

  const activeFilterCount = [
    filters.crop,
    filters.disease,
    filters.origin,
    filters.confirmed !== 'all',
    filters.deviceId.trim(),
    filters.minConfidence.trim(),
    filters.maxConfidence.trim(),
    filters.startDate,
    filters.endDate,
    filters.tags.length > 0,
  ].filter(Boolean).length
  const anyFilter = activeFilterCount > 0 || filters.search.trim().length > 0

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
        <ul className="divide-y rounded-xl border bg-card" aria-label="Loading checks">
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-2 p-4">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </li>
          ))}
        </ul>
      )
    }

    if (error) {
      return (
        <div role="alert" className="rounded-xl border border-unsure/40 bg-unsure-tint p-4">
          <p className="flex items-center gap-2 text-lg font-bold text-unsure">
            <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden />
            Couldn't load your checks
          </p>
          <p className="mt-2 text-base">
            {typeof navigator !== 'undefined' && !navigator.onLine
              ? 'You are offline. Connect and try again.'
              : 'The server did not answer. Try again in a moment.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button size="xl" className="mt-4 w-full" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="mr-2 h-5 w-5" aria-hidden />
            Try again
          </Button>
        </div>
      )
    }

    if (!history.length) {
      return anyFilter ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-lg font-bold">No checks match these filters</p>
          <p className="mt-1 text-base text-muted-foreground">Try fewer filters or a different search.</p>
          <Button variant="outline" size="lg" className="mt-4" onClick={resetFilters}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-lg font-bold">No checks yet</p>
          <p className="mt-1 text-base text-muted-foreground">
            Every leaf you check appears here, with photos from field devices too.
          </p>
          <Button asChild size="xl" className="mt-4 w-full">
            <Link to="/upload">
              <Camera className="mr-2 h-5 w-5" aria-hidden />
              Check a leaf
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {history.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </ul>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em]">History</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Every leaf checked from phones and field devices. Tap one to see the full result or review it.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="history-search"
            type="search"
            placeholder="Search crop, disease, tag, device"
            value={filters.search}
            onChange={handleInputChange('search')}
            aria-label="Search history"
            className="h-12 rounded-lg pl-10 text-base"
          />
        </div>
        <Button
          type="button"
          variant={filtersOpen || activeFilterCount ? 'default' : 'outline'}
          size="lg"
          className="shrink-0 px-4"
          aria-expanded={filtersOpen}
          aria-controls="history-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal className="h-5 w-5 sm:mr-2" aria-hidden />
          <span className="sr-only sm:not-sr-only">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 tabular-nums" aria-label={`${activeFilterCount} active`}>
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {filtersOpen && (
        <section id="history-filters" aria-label="Filters" className="space-y-5 rounded-xl border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={fieldLabelClass} htmlFor="history-crop">Crop</label>
              <select id="history-crop" className={selectClass} value={filters.crop} onChange={handleSelectChange('crop')} disabled={isLookupLoading && !crops.length}>
                <option value="">All crops</option>
                {crops.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass} htmlFor="history-disease">Disease</label>
              <select id="history-disease" className={selectClass} value={filters.disease} onChange={handleSelectChange('disease')} disabled={isLookupLoading && !diseases.length}>
                <option value="">All diseases</option>
                {diseases.map((disease) => (
                  <option key={disease} value={disease}>{disease}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass} htmlFor="history-confirmed">Review status</label>
              <select id="history-confirmed" className={selectClass} value={filters.confirmed} onChange={handleSelectChange('confirmed')}>
                {confirmedOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={fieldLabelClass} htmlFor="history-origin">Source</label>
              <select id="history-origin" className={selectClass} value={filters.origin} onChange={handleSelectChange('origin')}>
                {origins.map((option) => (
                  <option key={option.value || 'all-origins'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className={fieldLabelClass}>How sure the model was (%)</legend>
            <div className="flex items-center gap-3">
              <Input id="history-min-confidence" aria-label="At least, percent" type="number" inputMode="numeric" step="1" min="0" max="100" value={filters.minConfidence} onChange={handleInputChange('minConfidence')} placeholder="0" className="h-12 rounded-lg text-base" />
              <span className="text-muted-foreground">to</span>
              <Input id="history-max-confidence" aria-label="At most, percent" type="number" inputMode="numeric" step="1" min="0" max="100" value={filters.maxConfidence} onChange={handleInputChange('maxConfidence')} placeholder="100" className="h-12 rounded-lg text-base" />
            </div>
            <p className="text-sm text-muted-foreground">Under 60% is shown as “Not sure”. Try 0 to 60 to find checks worth reviewing.</p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <DatePickerField id="history-start-date" label="From" placeholder="Any date" value={filters.startDate} onChange={handleDateChange('startDate')} />
            <DatePickerField id="history-end-date" label="To" placeholder="Any date" value={filters.endDate} onChange={handleDateChange('endDate')} />
          </div>

          <div className="space-y-2">
            <label className={fieldLabelClass} htmlFor="history-device">Device ID</label>
            <Input id="history-device" value={filters.deviceId} onChange={handleInputChange('deviceId')} placeholder="e.g. pi-field-02" className="h-12 rounded-lg text-base" />
          </div>

          <div className="space-y-2">
            <p className={fieldLabelClass}>Tags</p>
            <div className="flex flex-wrap gap-2">
              {isLookupLoading && !tags.length ? (
                <Skeleton className="h-11 w-24 rounded-full" />
              ) : tags.length ? (
                tags.map((tag) => {
                  const on = filters.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold',
                        on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-accent'
                      )}
                    >
                      {on && <Check className="h-4 w-4" aria-hidden />}
                      {tag}
                    </button>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground">No tags yet.</span>
              )}
            </div>
            {lookupError && <p className="text-sm text-unsure">Couldn't load filter options: {lookupError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <Button variant="outline" size="lg" onClick={resetFilters} disabled={!anyFilter}>
              <X className="mr-2 h-5 w-5" aria-hidden />
              Clear all
            </Button>
            <Button size="lg" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        </section>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isLoading ? 'Loading…' : total ? `${showingRangeStart}–${showingRangeEnd} of ${total} checks` : ''}
      </p>

      {renderBody()}

      {(canPrevious || canNext) && (
        <nav aria-label="Pages" className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" disabled={!canPrevious} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            Previous
          </Button>
          <Button variant="outline" size="lg" disabled={!canNext} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
