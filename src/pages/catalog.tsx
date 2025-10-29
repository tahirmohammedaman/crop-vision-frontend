import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { groupDiseasesByPlant, SeverityLevel, DiseaseCatalogItem } from '@/data/diseases'
import { cn } from '@/lib/utils'

const severityStyles: Record<SeverityLevel, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100',
  low: 'bg-sky-200 text-sky-900 dark:bg-sky-400/20 dark:text-sky-100',
  none: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100',
  unknown: 'bg-muted text-muted-foreground',
}

const severityLabel = (item: DiseaseCatalogItem) => {
  if (item.isHealthy) return 'Healthy'
  if (item.severity === 'unknown') return 'Severity unknown'
  return `${item.severity.charAt(0).toUpperCase()}${item.severity.slice(1)} severity`
}

const placeholderClass =
  'flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground'

export function CatalogPage() {
  const [query, setQuery] = React.useState('')
  const groups = React.useMemo(() => groupDiseasesByPlant(query), [query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Disease Catalog</h1>
        <p className="text-sm text-muted-foreground">Structured by host crop with curated details from the reference dataset.</p>
      </div>

      <Card className="border-muted/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">Search catalog</CardTitle>
          <CardDescription className="text-xs">Filter by disease name, host plant, or catalog label.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 pt-0">
          <Input
            placeholder="Search disease catalog"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 max-w-sm border-muted"
            aria-label="Search diseases"
          />
        </CardContent>
      </Card>

      {groups.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No diseases match your search.</CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <section key={group.plant} className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{group.plant}</h2>
              <p className="text-xs text-muted-foreground">{group.diseases.length} {group.diseases.length === 1 ? 'entry' : 'entries'}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.diseases.map((item) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={`${item.diseaseName} example`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className={placeholderClass}>Image</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="text-sm font-medium leading-tight">
                      <Link to={`/diseases/${encodeURIComponent(item.id)}`} className="hover:underline">
                        {item.diseaseName}
                      </Link>
                    </div>
                    <Badge className={cn('w-fit px-2 py-1 text-xs capitalize', severityStyles[item.severity])}>{severityLabel(item)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
