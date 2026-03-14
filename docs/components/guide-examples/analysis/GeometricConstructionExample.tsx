"use client"

import { useState } from "react"
import { Mafs, Coordinates, GeometricConstruction, Debug, type ConstructionStep } from "mafs"

export default function GeometricConstructionExample() {
  const [steps, setSteps] = useState(8)
  const [debug, setDebug] = useState(false)

  // Perpendicular bisector of segment AB
  const construction: ConstructionStep[] = [
    { type: "given-point", id: "A", position: [-2, 0], label: "A" },
    { type: "given-point", id: "B", position: [2, 0], label: "B" },
    { type: "given-segment", id: "AB", from: "A", to: "B" },
    // Compass arc centered at A, through B
    { type: "compass-arc", id: "arcA", center: "A", through: "B", sweep: [-Math.PI / 3, Math.PI / 3] },
    // Compass arc centered at B, through A
    { type: "compass-arc", id: "arcB", center: "B", through: "A", sweep: [Math.PI * 2 / 3, Math.PI * 4 / 3] },
    // Intersections of the two arcs
    { type: "intersection", id: "P", of: ["arcA", "arcB"], index: 0, label: "P" },
    { type: "intersection", id: "Q", of: ["arcA", "arcB"], index: 1, label: "Q" },
    // Result: perpendicular bisector through P and Q
    { type: "result-line", through1: "P", through2: "Q" },
  ]

  return (
    <>
      <Mafs
        height={450}
        viewBox={{ x: [-5, 5], y: [-4, 4] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <GeometricConstruction
          construction={construction}
          visibleSteps={steps}
        />
        {debug && <Debug.ViewportInfo />}
        {debug && <Debug.FpsCounter />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-3 text-sm flex-1">
          <span className="font-bold opacity-70">Steps</span>
          <span className="w-12 tabular-nums">{steps} / {construction.length}</span>
          <input
            type="range"
            min={1}
            max={construction.length}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-red-500"
          />
          <span className="opacity-70">Debug</span>
        </label>
      </div>
    </>
  )
}
