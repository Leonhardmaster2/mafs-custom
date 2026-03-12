"use client"

import { Mafs, StemAndLeaf } from "mafs"

export default function StemAndLeafExample() {
  return (
    <Mafs height={350} viewBox={{ x: [-4, 4], y: [-4, 4] }}>
      <StemAndLeaf
        data={[12, 15, 21, 23, 26, 27, 31, 34, 35, 38, 42, 45, 48]}
        x={-2}
        y={3}
      />
    </Mafs>
  )
}
