"use client"

import { Mafs, Coordinates, ScatterPlot } from "mafs"

export default function ScatterPlotExample() {
  return (
    <Mafs height={400} viewBox={{ x: [-1, 12], y: [-2, 22] }}>
      <Coordinates.Cartesian />
      <ScatterPlot
        points={[
          [0.5, 1.2],
          [1, 2.3],
          [1.5, 2.8],
          [2, 4.1],
          [2.5, 3.9],
          [3, 5.8],
          [3.5, 6.5],
          [4, 8.2],
          [4.5, 7.9],
          [5, 10.1],
          [5.5, 9.4],
          [6, 11.5],
          [6.5, 12.3],
          [7, 13.8],
          [7.5, 13.1],
          [8, 15.2],
          [8.5, 16.0],
          [9, 17.1],
          [9.5, 17.8],
          [10, 19.5],
        ]}
        regression={{
          type: "linear",
          showEquation: true,
          showR2: true,
        }}
        labelSize={18}
      />
    </Mafs>
  )
}
