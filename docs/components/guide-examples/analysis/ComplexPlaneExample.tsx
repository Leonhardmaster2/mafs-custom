"use client"

import { Mafs, Coordinates, ComplexPlane } from "mafs"

export default function ComplexPlaneExample() {
  return (
    <Mafs height={400} viewBox={{ x: [-5, 5], y: [-4, 5] }} pan={false}>
      <Coordinates.Cartesian />
      <ComplexPlane
        points={[
          { z: [3, 2], label: "3 + 2i", color: "var(--mafs-blue)" },
          { z: [-1, 4], label: "-1 + 4i", color: "var(--mafs-red)" },
        ]}
        showConjugate
        showModulus
        showArgument
      />
    </Mafs>
  )
}
