import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ImageUp, X } from 'lucide-react'

export function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [tagsInput, setTagsInput] = React.useState<string>('')
  const [tags, setTags] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<number>(0)
  const [result, setResult] = React.useState<{
    image_url?: string
    predicted_disease_name?: string
    confidence?: number
    tags?: string[]
    top_k?: { label: string; confidence: number }[]
    disease_detail?: { description?: string | null; recommendations?: string | null } | null
  } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  if (!file) return
    setProgress(1)
    setResult(null)
    // simulate upload progress
    const start = Date.now()
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(99, p + Math.ceil(Math.random() * 12))
        return next
      })
    }, 200)
    // mock completion
    setTimeout(() => {
      clearInterval(timer)
      setProgress(100)
      const mockTopK = [
        { label: 'Tomato Leaf Mold', confidence: 0.984 },
        { label: 'Tomato Septoria Leaf Spot', confidence: 0.012 },
        { label: 'Healthy', confidence: 0.004 },
      ]
      setResult({
        image_url: URL.createObjectURL(file),
        predicted_disease_name: mockTopK[0].label,
        confidence: mockTopK[0].confidence,
        tags,
        top_k: mockTopK,
        disease_detail: {
          description: 'Fungal disease causing yellow spots and velvety olive-green mold on leaves.',
          recommendations: 'Prune affected leaves, improve airflow, avoid overhead watering, consider fungicide if severe.',
        },
      })
    }, 1400 + Math.random() * 800)
  }

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault()
      const val = tagsInput.trim().replace(/,$/, '')
      if (!val) return
      if (!tags.includes(val)) setTags((t) => [...t, val])
      setTagsInput('')
    } else if (e.key === 'Backspace' && !tagsInput) {
      setTags((t) => t.slice(0, -1))
    }
  }
  const removeTag = (t: string) => setTags((arr) => arr.filter((x) => x !== t))

  return (
    <div className={`grid gap-6 ${result ? 'lg:grid-cols-2' : 'justify-items-center'}`}>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Upload image</CardTitle>
          <CardDescription>Choose a plant image and optionally add tags</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (document.getElementById('image') as HTMLInputElement)?.click()}
                onClick={() => (document.getElementById('image') as HTMLInputElement)?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Choose or drop an image"
              >
                <ImageUp className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <div className="text-sm"><span className="font-medium">Click to select</span> or drag and drop</div>
                <div className="text-xs text-muted-foreground">PNG, JPG up to ~10MB</div>
                {file && <div className="mt-1 text-xs text-muted-foreground">Selected: <span className="font-medium">{file.name}</span></div>}
              </div>
              <Input id="image" type="file" accept="image/*" className="hidden" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} aria-label="Choose image" />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border p-2 focus-within:ring-2 focus-within:ring-ring">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} className="rounded-full p-0.5 text-muted-foreground hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Add tags"
                  aria-label="Add tag"
                />
              </div>
              <div className="text-xs text-muted-foreground">Use Enter or comma to add tags. Backspace removes last tag.</div>
            </div>

            {progress>0 && (
              <div className="space-y-1">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground" aria-live="polite">{progress < 100 ? `Uploading… ${progress}%` : 'Processing complete'}</div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">Submit</Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction</CardTitle>
            <CardDescription>Model result and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.image_url && (
              <div className="flex items-center justify-center">
                <img src={result.image_url} alt="Uploaded plant" className="max-h-80 max-w-full rounded object-contain" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{result.predicted_disease_name ?? 'Unknown'}</div>
              <Badge>{Math.round((result.confidence ?? 0)*100)}%</Badge>
            </div>
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.tags.map((t)=> <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            )}
            <div>
              <div className="font-medium">Top results</div>
              <ul className="mt-1 space-y-1 text-sm">
                {result.top_k?.map((k)=> (
                  <li key={k.label} className="flex items-center justify-between">
                    <span>{k.label}</span>
                    <span className="tabular-nums">{Math.round(k.confidence*100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium">Disease description</div>
              {result.disease_detail ? (
                <div className="text-sm space-y-1">
                  <div>{result.disease_detail.description || 'No description provided.'}</div>
                  <div className="text-muted-foreground">{result.disease_detail.recommendations || 'No recommendations provided.'}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No disease details provided.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
