"use client"

import { Mafs, Coordinates, Histogram } from "mafs"

export default function HistogramExample() {
  return (
    <Mafs height={400} viewBox={{ x: [-5, 65], y: [-2, 14] }} pan={false}>
      <Coordinates.Cartesian />
      <Histogram
        data={[2, 5, 8, 12, 7, 3]}
        bins={[0, 10, 20, 30, 40, 50, 60]}
        showFrequencyLabels
      />
    </Mafs>
  )
}
