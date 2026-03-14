"use client"

import { useState } from "react"
import { Mafs, Coordinates, SlopeField, Debug, useMovablePoint, Theme } from "mafs"

const ODES: Record<string, { label: string; fn: (x: number, y: number) => number }> = {
  "x-y": { label: "dy/dx = x − y", fn: (x, y) => x - y },
  "sin-xy": { label: "dy/dx = sin(x·y)", fn: (x, y) => Math.sin(x * y) },
  "x2-y2": { label: "dy/dx = x² − y²", fn: (x, y) => x * x - y * y },
  "y-x": { label: "dy/dx = y − x", fn: (x, y) => y - x },
  "spiral": { label: "dy/dx = −x/y", fn: (x, y) => y === 0 ? 1000 : -x / y },
}

export default function SlopeFieldExample() {
  const [odeKey, setOdeKey] = useState("x-y")
  const [debug, setDebug] = useState(false)
  const ode = ODES[odeKey]

  const point1 = useMovablePoint([0, 1], { color: Theme.blue })
  const point2 = useMovablePoint([2, -1], { color: Theme.red })

  return (
    <>
      <Mafs
        height={450}
        viewBox={{ x: [-5, 5], y: [-5, 5] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <SlopeField
          ode={ode.fn}
          step="auto"
          solutions={[
            { initialCondition: point1.point, color: Theme.blue, weight: 2.5 },
            { initialCondition: point2.point, color: Theme.red, weight: 2.5 },
          ]}
        />
        {point1.element}
        {point2.element}
        {debug && <Debug.ViewportInfo />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold opacity-70">ODE</span>
        <select
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 font-mono"
          value={odeKey}
          onChange={(e) => setOdeKey(e.target.value)}
        >
          {Object.entries(ODES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-red-500"
          />
          <span className="opacity-70">Debug</span>
        </label>
        <span className="text-xs opacity-50">Scroll to zoom · Drag to pan</span>
      </div>
    </>
  )
}
