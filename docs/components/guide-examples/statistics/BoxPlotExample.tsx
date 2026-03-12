"use client"

import { Mafs, BoxPlot } from "mafs"

export default function BoxPlotExample() {
  return (
    <Mafs
      height={250}
      viewBox={{ x: [0, 12], y: [-2, 2] }}
      pan={false}
    >
      <BoxPlot
        data={[2, 3, 4, 4, 5, 5, 5, 6, 7, 8, 9, 10]}
        y={0.5}
        height={0.8}
        labelPosition="above"
      />
    </Mafs>
  )
}
