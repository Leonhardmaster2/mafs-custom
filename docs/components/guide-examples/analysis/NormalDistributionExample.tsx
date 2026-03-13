"use client"

import { Mafs, Coordinates, NormalDistribution } from "mafs"

export default function NormalDistributionExample() {
  return (
    <Mafs height={400} viewBox={{ x: [-4.5, 4.5], y: [-0.05, 0.5] }} pan={false}>
      <Coordinates.Cartesian />
      <NormalDistribution
        mean={0}
        stdDev={1}
        regions={[
          { from: -1, to: 1, color: "var(--mafs-blue)", opacity: 0.2, label: "68.2%" },
          { from: -2, to: 2, color: "var(--mafs-green)", opacity: 0.1, label: "95.4%" },
        ]}
        showStdDevMarkers
        showValues
      />
    </Mafs>
  )
}
