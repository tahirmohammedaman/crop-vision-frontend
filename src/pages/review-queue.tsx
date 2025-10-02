import * as React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Item = {
  id: string
  prediction_id: string
  reporter: string
  notes?: string
  submitted_at: string
}

export function ReviewQueuePage() {
  const [items, setItems] = React.useState<Item[]>(() =>
    Array.from({ length: 5 }).map((_, i) => ({
      id: `fb_${i + 1}`,
      prediction_id: `pred_${i + 10}`,
      reporter: ['Aisha', 'Marco', 'Zara', 'Evan', 'Nora'][i],
      notes: ['Likely early blight', 'Wrong crop', 'Confidence too low', undefined, 'Label mismatch'][i],
      submitted_at: new Date(Date.now() - i * 18e5).toISOString(),
    })),
  )

  function act(id: string, action: 'approve' | 'reject') {
    setItems((list) => list.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Review Queue</h1>
        <p className="text-sm text-muted-foreground">Approve or reject feedback. Data is mocked.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feedback {it.id}</CardTitle>
              <CardDescription>Prediction: {it.prediction_id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Reporter:</span> <span className="font-medium">{it.reporter}</span></div>
              <div><span className="text-muted-foreground">Submitted:</span> {new Date(it.submitted_at).toLocaleString()}</div>
              <div>
                <span className="text-muted-foreground">Notes:</span>{' '}
                {it.notes ? <span>{it.notes}</span> : <span className="italic text-muted-foreground">None</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <Badge variant="secondary">apply_correction: off</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" onClick={() => act(it.id, 'approve')}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => act(it.id, 'reject')}>Reject</Button>
            </CardFooter>
          </Card>
        ))}
        {items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No pending items. Great job!</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
