"use client"

import { Mafs, Coordinates, BarChart } from "mafs"

export default function BarChartExample() {
  return (
    <Mafs height={400} viewBox={{ x: [0, 6], y: [-1, 18] }} pan={false}>
      <Coordinates.Cartesian
        xAxis={{ labels: false, axis: false }}
        yAxis={{ lines: 5 }}
      />
      <BarChart
        data={[
          { label: "Mon", value: 12 },
          { label: "Tue", value: 8 },
          { label: "Wed", value: 15 },
          { label: "Thu", value: 10 },
          { label: "Fri", value: 14 },
        ]}
      />
    </Mafs>
  )
}
