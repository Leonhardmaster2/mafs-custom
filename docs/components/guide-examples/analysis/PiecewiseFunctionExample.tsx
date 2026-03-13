"use client"

import { Mafs, Coordinates, PiecewiseFunction } from "mafs"

export default function PiecewiseFunctionExample() {
  return (
    <Mafs height={400} viewBox={{ x: [-4, 6], y: [-2, 6] }} pan={false}>
      <Coordinates.Cartesian />
      <PiecewiseFunction
        pieces={[
          { fn: (x) => x * x, domain: [-3, 0] },
          { fn: (x) => 2 * x + 1, domain: [0, 2] },
          { fn: () => 5, domain: [2, 5] },
        ]}
        endpointConfig={[
          { value: 0, fromLeft: true, fromRight: false },
          { value: 2, fromLeft: true, fromRight: true },
        ]}
      />
    </Mafs>
  )
}
