"use client"

import { Mafs, Coordinates, Plot, TangentLine, useMovablePoint } from "mafs"

export default function TangentLineExample() {
  const point = useMovablePoint([2, 4], {
    constrain: (p) => [p[0], p[0] * p[0]],
  })

  return (
    <Mafs height={400} viewBox={{ x: [-2, 5], y: [-1, 10] }}>
      <Coordinates.Cartesian />
      <Plot.OfX y={(x) => x * x} />
      <TangentLine
        fn={(x) => x * x}
        at={point.x}
        showPoint={false}
        showSlope
      />
      {point.element}
    </Mafs>
  )
}
