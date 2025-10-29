import rawCatalog from '../../catalog-data/diseases_catalog.json' assert { type: 'json' }

type RawDisease = {
  label?: string
  plant?: string
  disease_name?: string
  causal_agent?: string
  pathogen_scientific_name?: string
  severity?: string
  description?: string
  affected_parts?: unknown
  symptoms?: unknown
  recommendations?: unknown
  prevention?: unknown
  common_confusion?: unknown
}

export type SeverityLevel = 'none' | 'low' | 'medium' | 'high' | 'unknown'

export interface DiseaseCatalogItem {
  id: string
  label: string
  plant: string
  diseaseName: string
  rawDiseaseName: string
  severity: SeverityLevel
  description: string
  causalAgent: string
  pathogenScientificName: string
  affectedParts: string[]
  symptoms: string[]
  recommendations: string[]
  prevention: string[]
  commonConfusion: string[]
  isHealthy: boolean
  imageUrl?: string
}

const severityOrder: Record<string, SeverityLevel> = {
  none: 'none',
  low: 'low',
  medium: 'medium',
  high: 'high',
}

const imageModules = import.meta.glob('../../catalog-data/*.{jpg,jpeg,JPG,JPEG,png,PNG}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const imageLookup = new Map<string, string>()
for (const [path, url] of Object.entries(imageModules)) {
  const fileNameWithExt = path.split('/').pop() ?? path
  const baseName = fileNameWithExt.replace(/\.[^/.]+$/, '')
  if (!imageLookup.has(baseName)) {
    imageLookup.set(baseName, url)
  }
}

const rawEntries: RawDisease[] = Array.isArray((rawCatalog as { plant_disease_catalog?: RawDisease[] })?.plant_disease_catalog)
  ? ((rawCatalog as { plant_disease_catalog: RawDisease[] }).plant_disease_catalog ?? [])
  : []

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => item.length > 0)
}

const toSeverity = (value?: string): SeverityLevel => {
  if (!value) return 'unknown'
  const normalized = value.toLowerCase() as SeverityLevel
  return severityOrder[normalized] ?? 'unknown'
}

const humanizeDiseaseName = (value?: string) => {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

const sanitizedCatalog: DiseaseCatalogItem[] = rawEntries
  .filter((entry): entry is Required<Pick<RawDisease, 'label' | 'plant' | 'disease_name'>> & RawDisease => {
    return Boolean(entry && entry.label && entry.plant && entry.disease_name)
  })
  .map((entry) => {
    const severity = toSeverity(entry.severity)
    const diseaseName = humanizeDiseaseName(entry.disease_name)
    const isHealthy =
      severity === 'none' || diseaseName.toLowerCase().includes('healthy') || entry.disease_name?.toLowerCase().includes('healthy')

    return {
      id: entry.label!,
      label: entry.label!,
      plant: entry.plant!,
      diseaseName,
      rawDiseaseName: entry.disease_name!,
      severity,
      description: entry.description?.trim() ?? 'No description provided.',
      causalAgent: entry.causal_agent?.trim() ?? 'Unknown',
      pathogenScientificName: entry.pathogen_scientific_name?.trim() ?? 'Unknown',
      affectedParts: toStringArray(entry.affected_parts),
      symptoms: toStringArray(entry.symptoms),
      recommendations: toStringArray(entry.recommendations),
      prevention: toStringArray(entry.prevention),
      commonConfusion: toStringArray(entry.common_confusion),
      isHealthy,
      imageUrl: imageLookup.get(entry.label!),
    }
  })

export const diseaseCatalog = sanitizedCatalog

const diseaseCatalogMap = new Map(diseaseCatalog.map((entry) => [entry.id, entry]))

export const getDiseaseById = (id: string | undefined | null) => {
  if (!id) return undefined
  return diseaseCatalogMap.get(id)
}

const severityScore: Record<SeverityLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
  unknown: -1,
}

const sortWithinPlant = (items: DiseaseCatalogItem[]) => {
  return [...items].sort((a, b) => {
    if (a.isHealthy !== b.isHealthy) {
      return a.isHealthy ? -1 : 1
    }
    const scoreDiff = severityScore[b.severity] - severityScore[a.severity]
    if (scoreDiff !== 0) return scoreDiff
    return a.diseaseName.localeCompare(b.diseaseName)
  })
}

export interface GroupedDiseases {
  plant: string
  diseases: DiseaseCatalogItem[]
}

export const groupDiseasesByPlant = (searchTerm: string): GroupedDiseases[] => {
  const term = searchTerm.trim().toLowerCase()
  const filtered = term
    ? diseaseCatalog.filter((entry) =>
      entry.diseaseName.toLowerCase().includes(term) || entry.label.toLowerCase().includes(term) || entry.plant.toLowerCase().includes(term),
    )
    : diseaseCatalog

  const groups = new Map<string, DiseaseCatalogItem[]>()
  for (const entry of filtered) {
    const list = groups.get(entry.plant) ?? []
    list.push(entry)
    groups.set(entry.plant, list)
  }

  return Array.from(groups.entries())
    .map<GroupedDiseases>(([plant, entries]) => ({
      plant,
      diseases: sortWithinPlant(entries),
    }))
    .sort((a, b) => a.plant.localeCompare(b.plant))
}