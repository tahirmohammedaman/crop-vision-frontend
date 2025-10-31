import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTimeLocal } from '@/lib/utils'

export function ModelInfoPage() {
  const model = {
    name: 'EfficientNet-B3 PlantDisease',
    version: '1.7.2',
    classes_count: 61,
    top_k: 3,
    checksum: 'sha256:abcd…1234',
    created_at: new Date(Date.now() - 7 * 864e5).toISOString(),
    notes: 'Trained on extended dataset with augmented tomato leaf images. Improved robustness to low-light conditions.',
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Model Info</h1>
        <p className="text-sm text-muted-foreground">Current model metadata. Data is mocked.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{model.name}</CardTitle>
          <CardDescription>Version {model.version}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div><span className="text-muted-foreground">Classes:</span> <span className="font-medium">{model.classes_count}</span></div>
          <div><span className="text-muted-foreground">Top-k:</span> <span className="font-medium">{model.top_k}</span></div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Checksum:</span> <span className="font-medium">{model.checksum}</span></div>
          <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{formatDateTimeLocal(model.created_at)}</span></div>
          <div className="sm:col-span-2">
            <div className="font-medium">Notes</div>
            <p className="text-muted-foreground">{model.notes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
