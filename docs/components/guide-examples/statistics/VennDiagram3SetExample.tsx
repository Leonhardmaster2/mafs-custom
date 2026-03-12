"use client"

import { useState } from "react"
import { Mafs, VennDiagram } from "mafs"

export default function VennDiagram3SetExample() {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  return (
    <div>
      <Mafs height={420} viewBox={{ x: [-4.5, 4.5], y: [-3.5, 3.5] }} pan={false}>
        <VennDiagram
          sets={[
            { label: "Physics", exclusive: 12 },
            { label: "Math", exclusive: 15 },
            { label: "CS", exclusive: 10 },
          ]}
          intersections={[
            { sets: [0, 1], value: 7 },
            { sets: [0, 2], value: 4 },
            { sets: [1, 2], value: 8 },
            { sets: [0, 1, 2], value: 3 },
          ]}
          center={[0, 0]}
          radius={2}
          showUniversal={true}
          universalLabel="Students"
          complementValue={6}
          highlightedRegion={highlighted}
          onRegionClick={setHighlighted}
          labelSize={20}
        />
      </Mafs>
    </div>
  )
}
