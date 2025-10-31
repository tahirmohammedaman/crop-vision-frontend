import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatDateLocal } from '@/lib/utils'

export function StatsPage() {
  const days = Array.from({ length: 7 }).map((_, i) => ({
    date: formatDateLocal(new Date(Date.now() - (6 - i) * 864e5)),
    count: Math.floor(50 + Math.random() * 120),
  }))
  const total = days.reduce((a, b) => a + b.count, 0)
  const byDisease = [
    { label: 'Leaf Mold', count: 124 },
    { label: 'Late Blight', count: 98 },
    { label: 'Healthy', count: 76 },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Stats</h1>
        <p className="text-sm text-muted-foreground">Overview of recent activity. Data is mocked.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly images</CardTitle>
          <CardDescription>Total {total} in last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {days.map((d) => (
            <div key={d.date} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 text-sm">
              <div className="text-muted-foreground">{d.date}</div>
              <Progress value={(d.count / Math.max(...days.map((x) => x.count))) * 100} />
              <div className="tabular-nums">{d.count}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top diseases</CardTitle>
          <CardDescription>Distribution this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {byDisease.map((b) => {
            const pct = Math.round((b.count / byDisease.reduce((a, c) => a + c.count, 0)) * 100)
            return (
              <div key={b.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <div className="font-medium">{b.label}</div>
                  <Progress value={pct} className="mt-1" />
                </div>
                <div className="tabular-nums">{pct}%</div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
