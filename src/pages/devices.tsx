import * as React from 'react'
import {
  Activity,
  Camera,
  Clock3,
  Copy,
  Cpu,
  HardDrive,
  KeyRound,
  MapPin,
  MemoryStick,
  Thermometer,
  Timer,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { devicesApi } from '@/lib/api'
import type { Device, DeviceMetrics, DeviceRegistrationResponse } from '@/types/dto'
import { cn, formatDateLocal, formatDateTimeLocal, formatTimeLocal, toDate } from '@/lib/utils'
import { toast } from 'sonner'

type DeviceForm = {
  name: string
  device_id: string
  location: string
  tags: string[]
}

const createEmptyForm = (): DeviceForm => ({
  name: '',
  device_id: '',
  location: '',
  tags: [],
})

const ONLINE_THRESHOLD_MINUTES = 21

type LastSeenStatus = {
  isOnline: boolean
  label: string
  timestampText: string
}

function getLastSeenStatus(value?: string | null): LastSeenStatus {
  if (!value) return { isOnline: false, label: '—', timestampText: '—' }
  const date = toDate(value)
  if (!date) {
    const fallback = typeof value === 'string' ? value : '—'
    return { isOnline: false, label: fallback, timestampText: fallback }
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const thresholdMs = ONLINE_THRESHOLD_MINUTES * 60 * 1000
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const time = formatTimeLocal(date)
  const timestampText = isSameDay ? `Today at ${time}` : `${formatDateLocal(date)} ${time}`

  if (Math.abs(diffMs) <= thresholdMs) {
    return { isOnline: true, label: 'Online', timestampText }
  }

  return { isOnline: false, label: timestampText, timestampText }
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  const clamped = Math.max(0, Math.min(100, value))
  return `${clamped.toFixed(0)}%`
}

function formatTemperature(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}°C`
}

function formatUptime(seconds?: number | null) {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return '—'
  const totalSeconds = Math.floor(seconds)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const parts = [] as string[]
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  } catch (error) {
    console.error('clipboard error', error)
    toast.error(`Unable to copy ${label}. Please copy it manually.`)
  }
}

function buildMetrics(metrics: DeviceMetrics | null | undefined) {
  if (!metrics) return [] as Array<{ key: string; label: string; value: string; icon: React.ComponentType<{ className?: string }> }>
  const entries = [] as Array<{ key: string; label: string; value: string; icon: React.ComponentType<{ className?: string }> }>
  entries.push({ key: 'cpu', label: 'CPU usage', value: formatPercent(metrics.cpu_percent), icon: Cpu })
  entries.push({ key: 'memory', label: 'Memory usage', value: formatPercent(metrics.mem_percent), icon: MemoryStick })
  entries.push({ key: 'disk', label: 'Disk usage', value: formatPercent(metrics.disk_percent), icon: HardDrive })
  if (metrics.temp_c != null) {
    entries.push({ key: 'temperature', label: 'Temperature', value: formatTemperature(metrics.temp_c), icon: Thermometer })
  }
  if (metrics.uptime_seconds != null) {
    entries.push({ key: 'uptime', label: 'Uptime', value: formatUptime(metrics.uptime_seconds), icon: Timer })
  }
  if (metrics.camera_status) {
    entries.push({ key: 'camera', label: 'Camera', value: metrics.camera_status, icon: Camera })
  }
  return entries
}

function formatTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => tag.trim().length > 0)
}

export function DevicesPage() {
  const [devices, setDevices] = React.useState<Device[]>([])
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<DeviceForm>(createEmptyForm)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isRegistering, setIsRegistering] = React.useState<boolean>(false)
  const [tagInputValue, setTagInputValue] = React.useState<string>('')
  const [registration, setRegistration] = React.useState<DeviceRegistrationResponse | null>(null)

  const loadDevices = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await devicesApi.list()
      setDevices(response.items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load devices.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((previous) => {
      const field = name as keyof Omit<DeviceForm, 'tags'>
      return {
        ...previous,
        [field]: value,
      }
    })
    setFormError(null)
  }

  const addTags = (rawTags: string | string[]) => {
    const pieces = Array.isArray(rawTags) ? rawTags : rawTags.split(/[\s,]+/)
    const normalized = pieces.map((tag) => tag.trim()).filter(Boolean)
    if (!normalized.length) return

    setForm((previous) => {
      const existing = new Set(previous.tags.map((tag) => tag.toLowerCase()))
      const nextTags = [...previous.tags]

      normalized.forEach((tag) => {
        const lowered = tag.toLowerCase()
        if (!existing.has(lowered)) {
          nextTags.push(tag)
          existing.add(lowered)
        }
      })

      return { ...previous, tags: nextTags }
    })
  }

  const removeTag = (tagToRemove: string) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const commitTagInput = () => {
    if (!tagInputValue.trim()) return
    addTags(tagInputValue)
    setTagInputValue('')
  }

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInputValue(event.target.value)
    setFormError(null)
  }

  const handleTagInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab'].includes(event.key)) {
      if (tagInputValue.trim()) {
        event.preventDefault()
        commitTagInput()
      } else if (event.key === 'Enter') {
        event.preventDefault()
      }
      return
    }

    if (event.key === 'Backspace' && !tagInputValue && form.tags.length) {
      event.preventDefault()
      setForm((previous) => ({
        ...previous,
        tags: previous.tags.slice(0, -1),
      }))
    }
  }

  const handleTagInputBlur = () => {
    commitTagInput()
  }

  const handleTagInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text')
    if (!text) return
    addTags(text)
    setTagInputValue('')
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setFormError('Device name is required.')
      return
    }
    setIsRegistering(true)
    setFormError(null)
    try {
      const pendingTag = tagInputValue.trim()
      const rawTags = pendingTag ? [...form.tags, pendingTag] : [...form.tags]
      const tags = Array.from(
        new Set(
          rawTags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        )
      )
      const payload = {
        name: form.name.trim(),
        device_id: form.device_id.trim() || null,
        location: form.location.trim() || null,
        tags,
      }
      const result = await devicesApi.register(payload)
      setRegistration(result)
      toast.success('Device registered successfully.')
      setForm(createEmptyForm())
      setTagInputValue('')
      await loadDevices()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to register device.'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground">Manage registered field devices and their latest telemetry.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleRegister} className="space-y-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5" aria-hidden />
              Register new device
            </CardTitle>
            <CardDescription>Provide a name, optional device identifier, location, and tags.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device name</Label>
              <Input
                id="device-name"
                name="name"
                placeholder="Greenhouse Edge Node"
                value={form.name}
                onChange={handleFieldChange}
                disabled={isRegistering}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID</Label>
              <Input
                id="device-id"
                name="device_id"
                placeholder="Optional ID from hardware"
                value={form.device_id}
                onChange={handleFieldChange}
                disabled={isRegistering}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-location">Location</Label>
              <Input
                id="device-location"
                name="location"
                placeholder="Farm block A"
                value={form.location}
                onChange={handleFieldChange}
                disabled={isRegistering}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-tags">Tags</Label>
              <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      disabled={isRegistering}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </Badge>
                ))}
                <input
                  id="device-tags"
                  value={tagInputValue}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={handleTagInputBlur}
                  onPaste={handleTagInputPaste}
                  placeholder={form.tags.length ? '' : 'Add tag'}
                  className="flex-1 min-w-[6rem] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isRegistering}
                />
              </div>
              <p className="text-xs text-muted-foreground">Press Enter to add a tag.</p>
            </div>
            {formError && (
              <div className="md:col-span-2 text-sm text-destructive">{formError}</div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">New devices receive an API key once. Store it securely.</p>
            <Button type="submit" disabled={isRegistering}>Register device</Button>
          </CardFooter>
        </form>
      </Card>

      {registration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Activity className="h-5 w-5" aria-hidden />
              Device ready: {registration.name}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              This API key is shown only once. Copy it now and store it securely. You will not be able to retrieve it later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-api-key">API key</Label>
              <div className="flex gap-2">
                <Input id="device-api-key" value={registration.api_key} readOnly className="font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(registration.api_key, 'API key')}
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Copy API key</span>
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">Device ID</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{registration.device_id || '—'}</span>
                  {registration.device_id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(registration.device_id ?? '', 'Device ID')}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Copy device ID</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">Location</p>
                <p>{registration.location || '—'}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Registered at {formatDateTimeLocal(registration.created_at)}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRegistration(null)}>Dismiss</Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Registered devices</h2>
          <span className="text-sm text-muted-foreground">{devices.length} device{devices.length === 1 ? '' : 's'}</span>
        </div>
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="space-y-0">
                <CardContent className="space-y-4 py-6">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">No devices registered yet. Register your first device above.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => {
              const tags = formatTags(device.tags)
              const metrics = buildMetrics(device.last_metrics)
              const lastSeen = getLastSeenStatus(device.last_seen)
              return (
                <Card key={device.id} className="h-full">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {device.name}
                          <Badge variant={device.is_active ? 'secondary' : 'outline'} className={cn(device.is_active ? 'bg-emerald-600 text-white hover:bg-emerald-600/90' : '')}>
                            {device.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <CardDescription
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            lastSeen.isOnline ? 'font-semibold text-emerald-600' : 'text-muted-foreground'
                          )}
                        >
                          <Clock3 className="h-3.5 w-3.5" aria-hidden />
                          {lastSeen.isOnline ? lastSeen.label : `Last seen ${lastSeen.label}`}
                        </CardDescription>
                      </div>
                      {device.location && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {device.location}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Device ID</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm break-all">{device.device_id || '—'}</span>
                        {device.device_id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(device.device_id ?? '', 'Device ID')}
                          >
                            <Copy className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Copy device ID</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Created</p>
                      <p>{formatDateTimeLocal(device.created_at)}</p>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Updated</p>
                      <p>{formatDateTimeLocal(device.updated_at)}</p>
                    </div>
                    {tags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {metrics.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Latest metrics</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {metrics.map((metric) => {
                            const Icon = metric.icon
                            return (
                              <div key={metric.key} className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" aria-hidden />
                                </div>
                                <div>
                                  <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                                  <p className="font-medium text-foreground">{metric.value}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                        No metrics reported yet.
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className={cn(lastSeen.isOnline && 'font-semibold text-emerald-600')}>
                      {lastSeen.timestampText}
                    </span>
                    <span>ID #{device.id}</span>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
