import { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp'
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker' // eslint-disable-line
import { useRouter } from 'next/router'
import extent from 'turf-extent'
import type { Routes } from 'types'

mapboxgl.workerClass = MapboxWorker
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

type MapBoxProps = {
  routes: Routes
  mergedGeoJson?: { type: string; features: any[] }
  initialLat?: number
  initialLng?: number
  hoveredPoint?: { lat: number; lng: number } | null
}

const DEFAULT_LNG = 10.275971
const DEFAULT_LAT = 49.468342
const DEFAULT_ZOOM = 6

const MapBox = ({
  routes,
  mergedGeoJson: mergedGeoJsonProp,
  initialLng = DEFAULT_LNG,
  initialLat = DEFAULT_LAT,
  hoveredPoint,
}: MapBoxProps): JSX.Element => {
  const mergedGeoJson = mergedGeoJsonProp ?? {
    type: 'FeatureCollection',
    features: routes.flatMap(route =>
      route.geoJson.features.map((f: any) => ({
        ...f,
        properties: { ...f.properties, slug: route.slug, color: route.color },
      })),
    ),
  }
  const [stateMap, setStateMap] = useState<any>(null)
  const mapContainer = useRef<any>()
  const hoverMarkerRef = useRef<any>(null)
  const router = useRouter()
  const queryRoute = router.query.slug as string | undefined

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [initialLng, initialLat],
      zoom: DEFAULT_ZOOM,
    })

    map.addControl(new mapboxgl.NavigationControl())
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
    )
    map.addControl(new mapboxgl.FullscreenControl())

    map.on('load', () => {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      })

      const { layers } = map.getStyle()
      const labelLayerId = layers.find(layer => layer.type === 'symbol' && layer.layout['text-field']).id
      map.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId,
      )

      // Single merged source — replaces 311 individual sources
      map.addSource('all-routes', { type: 'geojson', data: mergedGeoJson })

      map.addLayer({
        id: 'all-routes-line',
        type: 'line',
        source: 'all-routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 4 },
      })
      map.addLayer({
        id: 'all-routes-fill',
        type: 'fill',
        source: 'all-routes',
        paint: { 'fill-color': 'transparent', 'fill-outline-color': 'transparent' },
      })

      // Start/end dot sources (empty by default, populated on detail page)
      map.addSource('active-start', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'active-start',
        type: 'circle',
        source: 'active-start',
        paint: { 'circle-color': '#87CF3E', 'circle-radius': 5, 'circle-opacity': 1 },
      })

      map.addSource('active-end', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'active-end',
        type: 'circle',
        source: 'active-end',
        paint: { 'circle-color': 'red', 'circle-radius': 5, 'circle-opacity': 1 },
      })

      map.on('click', 'all-routes-fill', e => {
        const { slug } = e.features[0].properties
        const route = routes.find(r => r.slug === slug)
        if (route) {
          const bbox = extent(route.geoJson)
          map.fitBounds(bbox, { padding: 20 })
        }
        router.push(`/${slug}`)
      })

      map.on('mouseenter', 'all-routes-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('all-routes-line', 'line-width', 6)
      })

      map.on('mouseleave', 'all-routes-fill', () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('all-routes-line', 'line-width', 4)
      })

      setStateMap(map)
    })

    return () => map.remove()
  }, [])

  // Filter to active route or show all
  useEffect(() => {
    if (!stateMap) return

    if (queryRoute) {
      const route = routes.find(r => r.slug === queryRoute)
      stateMap.setFilter('all-routes-line', ['==', ['get', 'slug'], queryRoute])
      stateMap.setFilter('all-routes-fill', ['==', ['get', 'slug'], queryRoute])

      if (route) {
        const bbox = extent(route.geoJson)
        stateMap.fitBounds(bbox, { padding: 20 })

        const coords = route.geoJson.features[0].geometry.coordinates
        const startCoord = Array.isArray(coords[0][0]) ? coords[0][0] : coords[0]
        const lastSegment = Array.isArray(coords[coords.length - 1][0]) ? coords[coords.length - 1] : coords
        const endCoord = lastSegment[lastSegment.length - 1]

        stateMap.getSource('active-start').setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: startCoord }, properties: {} }],
        })
        stateMap.getSource('active-end').setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: endCoord }, properties: {} }],
        })
      }
    } else {
      stateMap.setFilter('all-routes-line', null)
      stateMap.setFilter('all-routes-fill', null)
      stateMap.getSource('active-start').setData({ type: 'FeatureCollection', features: [] })
      stateMap.getSource('active-end').setData({ type: 'FeatureCollection', features: [] })
      stateMap.flyTo({ center: [DEFAULT_LNG, DEFAULT_LAT], essential: true, zoom: DEFAULT_ZOOM })
    }
  }, [queryRoute, stateMap])

  // Hover marker — orange dot synced to chart position
  useEffect(() => {
    if (!stateMap) return
    if (!hoveredPoint) {
      hoverMarkerRef.current?.remove()
      return
    }
    if (!hoverMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'hover-marker'
      hoverMarkerRef.current = new mapboxgl.Marker(el)
    }
    hoverMarkerRef.current.setLngLat([hoveredPoint.lng, hoveredPoint.lat]).addTo(stateMap)
  }, [hoveredPoint, stateMap])

  return <div className="absolute inset-0" ref={mapContainer} />
}

export default MapBox
