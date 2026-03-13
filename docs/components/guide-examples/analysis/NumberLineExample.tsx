"use client"

import { Mafs, NumberLine } from "mafs"

export default function NumberLineExample() {
  return (
    <Mafs height={140} viewBox={{ x: [-7, 7], y: [-1, 1] }} pan={false}>
      <NumberLine
        range={[-6, 6]}
        ticks={{ step: 1, labels: true }}
        intervals={[
          {
            start: -3,
            end: 4,
            startInclusive: false,
            endInclusive: true,
            color: "var(--mafs-blue)",
            label: "(-3, 4]",
          },
        ]}
        points={[{ value: 0, label: "0", color: "var(--mafs-red)" }]}
      />
    </Mafs>
  )
}
