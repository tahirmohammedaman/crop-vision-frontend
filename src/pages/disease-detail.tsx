import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DiseaseDetailPage() {
  const { id } = useParams()
  const info = {
    id,
    name: 'Tomato Leaf Mold',
    crop: 'Tomato',
    severity: 'medium',
    symptoms: [
      'Yellowish spots on upper leaf surfaces',
      'Olive-green to gray velvety mold on undersides',
      'Leaves curl and drop in severe cases',
    ],
    description:
      'Leaf mold is caused by the fungus Passalora fulva. It thrives in humid conditions and overcrowded foliage.',
    recommendations:
      'Prune lower leaves, avoid overhead irrigation, increase airflow, rotate crops, and use fungicides when necessary.',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Disease Detail</h1>
        <p className="text-sm text-muted-foreground">Data is mocked for preview.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{info.name}</CardTitle>
          <CardDescription>Crop: {info.crop}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Severity:</span>
            <Badge variant={info.severity === 'high' ? 'default' : 'secondary'} className="capitalize">{info.severity}</Badge>
          </div>
          <div>
            <div className="font-medium">Symptoms</div>
            <ul className="list-disc pl-6 text-sm">
              {info.symptoms.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium">Description</div>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
          <div>
            <div className="font-medium">Recommendations</div>
            <p className="text-sm text-muted-foreground">{info.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
