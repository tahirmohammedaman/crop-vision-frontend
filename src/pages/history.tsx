import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Item = {
  id: string
  created_at: string
  crop: string
  predicted: string
  confidence: number
  tags: string[]
  status: 'completed' | 'pending'
}

export function HistoryPage() {
  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<Item[]>(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      id: `pred_${i + 1}`,
      created_at: new Date(Date.now() - i * 36e5).toISOString(),
      crop: ['Tomato', 'Potato', 'Maize'][i % 3],
      predicted: ['Leaf Mold', 'Healthy', 'Late Blight'][i % 3],
      confidence: Math.round((0.7 + Math.random() * 0.29) * 100),
      tags: ['field-a', 'north', 'lowlight'].slice(0, (i % 3) + 1),
      status: i % 4 === 0 ? 'pending' : 'completed',
    })),
  )

  const filtered = items.filter((it) => (query ? `${it.crop} ${it.predicted}`.toLowerCase().includes(query.toLowerCase()) : true))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">Recent predictions with quick filters. Data is mocked.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search by crop or disease name</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" aria-label="Search" />
          <Button variant="outline" onClick={() => setQuery('')}>Clear</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>Showing {filtered.length} of {items.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Predicted</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>{r.crop}</TableCell>
                  <TableCell>{r.predicted}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.confidence}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">{r.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize" variant={r.status === 'completed' ? 'default' : 'secondary'}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Tip: refine with filters to find specific results.</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
