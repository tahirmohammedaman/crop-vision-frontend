import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Accordion } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import * as React from 'react'

export function LandingPage() {
  const [stats, setStats] = React.useState(() => ({
    imagesToday: Math.floor(300 + Math.random() * 400),
    accuracy: 99.2,
    cropsTracked: 14,
    diseasesDetected: 38,
  }))
  React.useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => ({ ...s, imagesToday: s.imagesToday + Math.floor(Math.random() * 5) }))
    }, 1500)
    return () => clearInterval(id)
  }, [])

  const faq = [
    { id: '1', header: 'How accurate is the model?', content: 'We routinely achieve 90–96% top-1 accuracy on our benchmark datasets and continue improving with community feedback.' },
    { id: '2', header: 'Which crops are supported?', content: 'Common crops like tomato, potato, maize, wheat, rice, and more. The catalog lists all supported crops and diseases.' },
    { id: '3', header: 'Is my data private?', content: 'Uploads are processed securely. You can delete your history anytime from the Profile page.' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:py-16">
      {/* Hero */}
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Detect plant diseases in seconds</h1>
          <p className="text-lg text-muted-foreground">Upload a leaf photo to get instant AI predictions, recommended actions, and links to trusted agronomy resources.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/upload">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/catalog">Browse catalog</Link>
            </Button>
            <Badge variant="secondary" className="h-9 items-center rounded-full px-3">No signup required for demo</Badge>
          </div>
          <div className="grid max-w-md grid-cols-3 gap-3 pt-2 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Images today</div>
              <div className="text-2xl font-semibold tabular-nums">{stats.imagesToday.toLocaleString()}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Top-1 accuracy</div>
              <div className="text-2xl font-semibold">{stats.accuracy}%</div>
              <Progress value={stats.accuracy} className="mt-2" />
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Crops tracked</div>
              <div className="text-2xl font-semibold">{stats.cropsTracked}</div>
            </div>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Quick preview</CardTitle>
            <CardDescription>See how a prediction result looks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-video w-full rounded-md bg-gradient-to-br from-emerald-400/20 via-lime-400/10 to-transparent" />
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Tomato Leaf Mold</div>
                <Badge>98.4%</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Likely disease: affects older leaves; consider pruning and improving airflow.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-md border p-2"><span className="text-muted-foreground">Crop</span><div className="font-medium">Tomato</div></div>
              <div className="rounded-md border p-2"><span className="text-muted-foreground">Top-k</span><div className="font-medium">3</div></div>
              <div className="rounded-md border p-2"><span className="text-muted-foreground">Latency</span><div className="font-medium">230ms</div></div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild size="sm"><Link to="/upload">Try your image</Link></Button>
          </CardFooter>
        </Card>
      </div>

      {/* Features */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Fast and private', desc: 'Process images quickly with secure handling and minimal data retention.' },
          { title: 'Actionable tips', desc: 'Clear recommendations to manage or prevent diseases effectively.' },
          { title: 'Growing catalog', desc: 'Continuously updated list of crops and diseases, curated with experts.' },
          { title: 'Feedback loop', desc: 'Review predictions and submit corrections to improve the model.' },
          { title: 'Accessible UI', desc: 'Keyboard-friendly, screen reader labels, high-contrast theme support.' },
          { title: 'Works anywhere', desc: 'Responsive on mobile and desktop, with light and dark themes.' },
        ].map((f) => (
          <Card key={f.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
          </Card>
        ))}
      </section>

      {/* Testimonials */}
      <section className="grid gap-4 md:grid-cols-2">
        {[
          { name: 'Aisha', role: 'Smallholder Farmer', text: 'The predictions helped me act early and save my tomato crop.' },
          { name: 'Marco', role: 'Agronomist', text: 'Clear UI and solid accuracy. The catalog is a great reference.' },
        ].map((t) => (
          <Card key={t.name}>
            <CardContent className="flex gap-3 p-4">
              <Avatar>
                <AvatarFallback>{t.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
                <p className="mt-2 text-sm">“{t.text}”</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Frequently asked questions</h2>
        <Accordion items={faq} />
      </section>

      {/* CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">Ready to check your plants?</div>
            <div className="text-sm text-muted-foreground">Upload a photo and get an instant assessment.</div>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/upload">Start now</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/stats">View stats</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
