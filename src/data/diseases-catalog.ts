import catalog from '../../catalog-data/diseases_catalog.json'

export type DiseaseCatalogEntry = {
  label: string
  plant: string
  disease_name: string
}

const entries = catalog.plant_disease_catalog as DiseaseCatalogEntry[]

export const diseaseLabels = entries
  .map((entry) => entry.label)
  .sort((a, b) => a.localeCompare(b))
