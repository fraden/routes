import { FlexibleXYPlot, AreaSeries, YAxis, HorizontalGridLines, LineSeries, VerticalBarSeries } from 'react-vis'
import { useMemo } from 'react'

const Chart = ({
  coordinates,
  type,
  currentPointIndex,
}: {
  coordinates: Array<[number, number, number] | { lat: number; lon: number; elevation: number }>
  type: string
  currentPointIndex?: number
}): JSX.Element => {
  const combinedCoordinates = useMemo(() => {
    if (type === 'MultiLineString') {
      return [].concat(...(coordinates as any[])) // Type assertion needed due to mixed array types
    }
    return coordinates
  }, [coordinates, type])

  const data = useMemo(
    () => combinedCoordinates.map((point, i) => ({ x: i, y: parseInt(point[2] as string, 10) })),
    [combinedCoordinates],
  )

  const maxYValue = useMemo(() => {
    if (data.length === 0) return 0
    return Math.max(...data.map(d => d.y))
  }, [data])

  const verticalLineData = useMemo(() => {
    if (typeof currentPointIndex !== 'number' || currentPointIndex < 0 || currentPointIndex >= data.length) {
      return []
    }
    // To make the bar appear as a line, we give it a y0 at the bottom of the chart (or 0)
    // and y at the top (maxYValue). The x value is the currentPointIndex.
    // react-vis VerticalBarSeries expects an array of data points.
    return [{ x: currentPointIndex, y: maxYValue, y0: 0 }]
  }, [currentPointIndex, data, maxYValue])

  return (
    <div style={{ height: 120, overflow: 'hidden' }}>
      <FlexibleXYPlot height={150} yDomain={[0, maxYValue > 0 ? maxYValue * 1.1 : 100]}> {/* Adjust yDomain slightly for padding */}
        <HorizontalGridLines />
        <AreaSeries curve="curveLinear" data={data} color="#DDE8CD" />
        <LineSeries data={data} color="#75A134" strokeWidth={1} />
        {verticalLineData.length > 0 && (
          <VerticalBarSeries data={verticalLineData} color="#FF0000" strokeWidth={1} style={{ stroke: '#FF0000' }} />
        )}
        <YAxis />
      </FlexibleXYPlot>
    </div>
  )
}

export default Chart
