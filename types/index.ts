type geoJson = {
  type: string
  features: Array<{
    properties: {
      name: string
      links: Array<{ href: string }>
    }
    geometry: {
      coordinates: Array<any>
      type: string
    }
  }>
}

export type Route = {
  slug: string
  distance: number
  elevation: number
  geoJson: geoJson
  gpxGeoJson: geoJson
  rating?: number
  description?: string
  location?: string
  color: string
  swimrun?: boolean
  date: string
}

export type Routes = Array<Route>
