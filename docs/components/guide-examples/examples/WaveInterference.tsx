"use client"

import { useState } from "react"
import { Mafs, Coordinates, Plot, Debug, useMovablePoint, Text, Theme, useStopwatch } from "mafs"

export default function WaveInterference() {
  const [freq2, setFreq2] = useState(1.2)
  const [debug, setDebug] = useState(false)

  const amp1 = useMovablePoint([-5, 1.5], {
    constrain: "vertical",
    color: Theme.blue,
  })
  const amp2 = useMovablePoint([5, 1], {
    constrain: "vertical",
    color: Theme.red,
  })

  const { time } = useStopwatch({ endTime: Infinity })

  const wave1 = (x: number) => amp1.y * Math.sin(x - time)
  const wave2 = (x: number) => amp2.y * Math.sin(freq2 * x - freq2 * time)
  const sum = (x: number) => wave1(x) + wave2(x)

  return (
    <>
      <Mafs
        height={400}
        viewBox={{ x: [-6, 6], y: [-4, 4] }}
        pan
        zoom={{ min: 0.2, max: 10 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />

        {/* Individual waves (faded) */}
        <Plot.OfX y={wave1} color={Theme.blue} opacity={0.35} weight={1.5} />
        <Plot.OfX y={wave2} color={Theme.red} opacity={0.35} weight={1.5} />

        {/* Superposition (bold) */}
        <Plot.OfX y={sum} color={Theme.foreground} weight={3} />

        {/* Amplitude control labels */}
        <Text x={-5} y={amp1.y + 0.4} size={14} color={Theme.blue}>
          A₁ = {amp1.y.toFixed(1)}
        </Text>
        <Text x={5} y={amp2.y + 0.4} size={14} color={Theme.red}>
          A₂ = {amp2.y.toFixed(1)}
        </Text>

        {amp1.element}
        {amp2.element}
        {debug && <Debug.ViewportInfo />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-3 text-sm flex-1">
          <span className="font-bold opacity-70">ω₂</span>
          <span className="w-8 tabular-nums">{freq2.toFixed(1)}</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={freq2}
            onChange={(e) => setFreq2(Number(e.target.value))}
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
