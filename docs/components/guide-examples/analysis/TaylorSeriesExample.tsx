"use client"

import { useState } from "react"
import { Mafs, Coordinates, Plot, TaylorSeries, Debug, useMovablePoint } from "mafs"

export default function TaylorSeriesExample() {
  const [order, setOrder] = useState(3)
  const [debug, setDebug] = useState(false)

  const center = useMovablePoint([0, 0], {
    constrain: (p) => [p[0], Math.sin(p[0])],
  })

  return (
    <>
      <Mafs
        height={400}
        viewBox={{ x: [-5, 5], y: [-3, 3] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <Plot.OfX y={(x) => Math.sin(x)} color="var(--mafs-fg)" opacity={0.3} />
        <TaylorSeries
          fn={(x) => Math.sin(x)}
          center={center.x}
          order={order}
          showError
          showOriginal={false}
        />
        {center.element}
        {debug && <Debug.ViewportInfo />}
        {debug && <Debug.FpsCounter />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-3 text-sm flex-1">
          <span className="font-bold opacity-70">Order</span>
          <span className="w-6 tabular-nums text-center">{order}</span>
          <input
            type="range"
            min={0}
            max={10}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
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
