"use client"

import { useState } from "react"
import { Mafs, Coordinates, LinearTransformVisualizer, Debug, useMovablePoint, Theme } from "mafs"

export default function LinearTransform() {
  const [tValue, setTValue] = useState(1)
  const [debug, setDebug] = useState(false)

  const e1Tip = useMovablePoint([2, 1], { color: Theme.red })
  const e2Tip = useMovablePoint([-0.5, 1.5], { color: Theme.blue })

  const matrix: [[number, number], [number, number]] = [
    [e1Tip.x, e2Tip.x],
    [e1Tip.y, e2Tip.y],
  ]

  return (
    <>
      <Mafs
        height={400}
        viewBox={{ x: [-5, 5], y: [-5, 5] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <LinearTransformVisualizer
          matrix={matrix}
          t={tValue}
          showEigenvectors
          showDeterminant
        />
        {e1Tip.element}
        {e2Tip.element}
        {debug && <Debug.ViewportInfo />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-3 text-sm flex-1">
          <span className="font-bold opacity-70">t</span>
          <span className="w-8 tabular-nums">{tValue.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={tValue}
            onChange={(e) => setTValue(Number(e.target.value))}
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
