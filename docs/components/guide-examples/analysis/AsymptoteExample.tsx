"use client"

import { Mafs, Coordinates, Plot, Asymptote } from "mafs"

export default function AsymptoteExample() {
  const fn = (x: number) => 1 / (x - 2) + 1

  return (
    <Mafs height={400} viewBox={{ x: [-5, 5], y: [-5, 5] }} pan zoom={{ min: 0.001, max: 10000 }}>
      <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
      <Plot.OfX y={fn} />
      <Asymptote type="vertical" value={2} label="x = 2" />
      <Asymptote type="horizontal" value={1} label="y = 1" />
    </Mafs>
  )
}
