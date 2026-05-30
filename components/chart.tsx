import { useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useHover } from 'context/hover'

type Point = {
  distance: number
  distancePct: number
  elevation: number
  lat: number
  lng: number
}

function haversineKm(coord1: number[], coord2: number[]): number {
  const R = 6371
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((coord1[1] * Math.PI) / 180) * Math.cos((coord2[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildPoints(coordinates: number[][]): Point[] {
  let cumulative = 0
  const points: Point[] = coordinates.map((coord, i) => {
    if (i > 0) cumulative += haversineKm(coordinates[i - 1], coord)
    return {
      distance: Math.round(cumulative * 100) / 100,
      distancePct: 0,
      elevation: Math.round(coord[2] ?? 0),
      lat: coord[1],
      lng: coord[0],
    }
  })
  const totalDist = points[points.length - 1].distance
  return points.map(p => ({
    ...p,
    distancePct: Math.round((p.distance / totalDist) * 1000) / 10,
  }))
}

const STORAGE_KEY = 'chart-xaxis-mode'

type ChartProps = {
  coordinates: number[][]
  type: string
}

const Chart = ({ coordinates, type }: ChartProps): JSX.Element => {
  const { setHoveredPoint } = useHover()
  const [xMode, setXMode] = useState<'km' | 'pct'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as 'km' | 'pct') ?? 'km'
    }
    return 'km'
  })

  let combinedCoords: number[][]
  if (type === 'MultiLineString') {
    combinedCoords = ([] as number[][]).concat(...((coordinates as unknown) as number[][][]))
  } else {
    combinedCoords = coordinates
  }

  const points = buildPoints(combinedCoords)
  const xKey = xMode === 'km' ? 'distance' : 'distancePct'
  const totalDist = points[points.length - 1].distance

  const handleToggle = (mode: 'km' | 'pct') => {
    setXMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  const handleMouseMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      if (state?.activePayload?.[0]) {
        const p: Point = state.activePayload[0].payload
        setHoveredPoint({ lat: p.lat, lng: p.lng, elevation: p.elevation })
      }
    },
    [setHoveredPoint],
  )

  const handleMouseLeave = useCallback(() => setHoveredPoint(null), [setHoveredPoint])

  const elevMin = Math.min(...points.map(p => p.elevation))
  const elevMax = Math.max(...points.map(p => p.elevation))
  const yPad = Math.round((elevMax - elevMin) * 0.1)

  const kmTicks = [0, Math.round(totalDist / 3), Math.round((totalDist * 2) / 3), Math.round(totalDist)]
  const pctTicks = [0, 25, 50, 75, 100]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Höhenprofil</span>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => handleToggle('km')}
            className={`text-xs px-2.5 py-1 rounded-md transition-all ${
              xMode === 'km' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-500'
            }`}
          >
            km
          </button>
          <button
            type="button"
            onClick={() => handleToggle('pct')}
            className={`text-xs px-2.5 py-1 rounded-md transition-all ${
              xMode === 'pct' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-500'
            }`}
          >
            %
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={points}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#75A134" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#75A134" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: '#aaa' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => (xMode === 'km' ? `${v}` : `${v}%`)}
            ticks={xMode === 'km' ? kmTicks : pctTicks}
          />
          <YAxis tick={{ fontSize: 10, fill: '#aaa' }} tickLine={false} axisLine={false} domain={[elevMin - yPad, elevMax + yPad]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p: Point = payload[0].payload
              return (
                <div className="bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
                  {xMode === 'km' ? `${p.distance} km` : `${p.distancePct}%`} · {p.elevation} m
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#75A134"
            strokeWidth={1.5}
            fill="url(#elevGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#75A134', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
