"use client"

import { useState } from "react"
import {
  Mafs,
  Coordinates,
  Plot,
  Debug,
  useMovablePoint,
  Theme,
} from "mafs"

const FIELDS: Record<
  string,
  {
    label: string
    fn: (p: [number, number], cx: number, cy: number) => [number, number]
  }
> = {
  sink: {
    label: "Sink (converging)",
    fn: ([x, y], cx, cy) => [-(x - cx), -(y - cy)],
  },
  source: {
    label: "Source (diverging)",
    fn: ([x, y], cx, cy) => [x - cx, y - cy],
  },
  vortex: {
    label: "Vortex (rotating)",
    fn: ([x, y], cx, cy) => [-(y - cy), x - cx],
  },
  saddle: {
    label: "Saddle point",
    fn: ([x, y], cx, cy) => [x - cx, -(y - cy)],
  },
  spiral: {
    label: "Spiral sink",
    fn: ([x, y], cx, cy) => {
      const dx = x - cx
      const dy = y - cy
      return [-(dx + dy), dx - dy]
    },
  },
  shear: {
    label: "Shear flow",
    fn: ([x, y], _cx, cy) => [y - cy, 0],
  },
}

export default function VectorFieldShowcase() {
  const [fieldKey, setFieldKey] = useState("spiral")
  const [debug, setDebug] = useState(false)
  const field = FIELDS[fieldKey]

  const center = useMovablePoint([0, 0], { color: Theme.yellow })

  return (
    <>
      <Mafs
        height={500}
        viewBox={{ x: [-5, 5], y: [-5, 5] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <Plot.VectorField
          xy={(p) => field.fn(p as [number, number], center.x, center.y)}
          step={0.5}
          xyOpacity={([x, y]) => {
            const dx = x - center.x
            const dy = y - center.y
            const r = Math.sqrt(dx * dx + dy * dy)
            return Math.min(1, r / 4)
          }}
          color={Theme.blue}
        />
        {center.element}
        {debug && <Debug.ViewportInfo />}
        {debug && <Debug.FpsCounter />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold opacity-70">Field</span>
        <select
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 font-mono"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
        >
          {Object.entries(FIELDS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
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
        <span className="text-xs opacity-50">
          Drag yellow point · Scroll to zoom · Drag to pan
        </span>
      </div>
    </>
  )
}
