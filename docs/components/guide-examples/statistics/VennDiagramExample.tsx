"use client"

import { useState } from "react"
import { Mafs, VennDiagram } from "mafs"

export default function VennDiagramExample() {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  return (
    <div>
      <Mafs height={350} viewBox={{ x: [-4, 4], y: [-3, 3] }} pan={false}>
        <VennDiagram
          sets={[
            { label: "A", exclusive: 8 },
            { label: "B", exclusive: 5 },
          ]}
          intersections={[{ sets: [0, 1], value: 3 }]}
          center={[0, 0]}
          radius={1.8}
          showUniversal={true}
          highlightedRegion={highlighted}
          onRegionClick={setHighlighted}
        />
      </Mafs>
      {highlighted && (
        <p style={{ fontSize: 14, marginTop: 8, color: "var(--mafs-fg, #666)" }}>
          Selected: <strong>{highlighted.replace("-", " ").replace(/(\d+)/, (_, n) => {
            const idx = parseInt(n)
            return highlighted.startsWith("exclusive") ? ["A", "B"][idx] : `A ∩ B`
          })}</strong>
        </p>
      )}
    </div>
  )
}
