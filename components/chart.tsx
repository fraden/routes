import { FlexibleXYPlot, AreaSeries, YAxis, HorizontalGridLines, LineSeries } from 'react-vis'

const Chart = ({
  coordinates,
  type,
}: {
  coordinates: Array<{ lat: number; lon: number; elevation: number }>
  type: string
}): JSX.Element => {
  let combinedCoordinates
  if (type === 'MultiLineString') {
    combinedCoordinates = [].concat(...coordinates)
  } else {
    combinedCoordinates = coordinates
  }

  const data = combinedCoordinates.map((x, i) => ({ x: i, y: parseInt(x[2], 10) }))
  return (
    <div style={{ height: 120, overflow: 'hidden' }}>
      <FlexibleXYPlot height={150}>
        <HorizontalGridLines />
        <AreaSeries curve="curveLinear" data={data} color="#DDE8CD" />
        <LineSeries data={data} color="#75A134" strokeWidth={1} />
        <YAxis />
      </FlexibleXYPlot>
    </div>
  )
}

export default Chart
