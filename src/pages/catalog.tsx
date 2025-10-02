import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'

type Crop = { id: string; name: string }
type Disease = { id: string; crop_id: string; name: string; severity: 'low' | 'medium' | 'high' }

export function CatalogPage() {
  const [q, setQ] = React.useState('')
  const crops: Crop[] = [
    { id: 'c1', name: 'Tomato' },
    { id: 'c2', name: 'Potato' },
    { id: 'c3', name: 'Maize' },
  ]
  const diseases: Disease[] = [
    { id: 'd1', crop_id: 'c1', name: 'Leaf Mold', severity: 'medium' },
    { id: 'd2', crop_id: 'c1', name: 'Septoria Leaf Spot', severity: 'low' },
    { id: 'd3', crop_id: 'c2', name: 'Late Blight', severity: 'high' },
    { id: 'd4', crop_id: 'c3', name: 'Northern Leaf Blight', severity: 'medium' },
  ]

  const filtered = diseases.filter((d) => (q ? d.name.toLowerCase().includes(q.toLowerCase()) : true))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <p className="text-sm text-muted-foreground">Browse crops and diseases. Data is mocked.</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>Find a disease by name</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input placeholder="e.g. Leaf Blight" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{d.name}</CardTitle>
              <CardDescription>Crop: {crops.find((c) => c.id === d.crop_id)?.name ?? 'Unknown'}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={d.severity === 'high' ? 'default' : 'secondary'} className="capitalize">{d.severity} severity</Badge>
              <Link className="text-sm font-medium underline underline-offset-4" to={`/diseases/${d.id}`}>Details</Link>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No items match your search.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
