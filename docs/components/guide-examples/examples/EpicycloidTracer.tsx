"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  Mafs,
  Coordinates,
  Circle,
  Line,
  Point,
  Polyline,
  Debug,
  useStopwatch,
  Theme,
  vec,
} from "mafs"

interface Epicycle {
  radius: number
  frequency: number
  phase?: number
}

export default function EpicycloidTracer() {
  const [numHarmonics, setNumHarmonics] = useState(5)
  const [debug, setDebug] = useState(false)

  // Square wave Fourier coefficients (odd harmonics of sine)
  const epicycles: Epicycle[] = useMemo(() => {
    const result: Epicycle[] = []
    for (let i = 0; i < numHarmonics; i++) {
      const n = 2 * i + 1 // 1, 3, 5, 7, ...
      result.push({
        radius: 4 / (n * Math.PI),
        frequency: n,
      })
    }
    return result
  }, [numHarmonics])

  const { time, start } = useStopwatch({ endTime: Infinity })
  useEffect(() => { start() }, [start])

  // Trail accumulation
  const trailRef = useRef<vec.Vector2[]>([])
  const prevTimeRef = useRef(0)

  // Compute epicycle chain
  let center: vec.Vector2 = [0, 0]
  const centers: vec.Vector2[] = [[0, 0]]

  for (const epi of epicycles) {
    const angle = epi.frequency * time + (epi.phase ?? 0)
    const offset: vec.Vector2 = [
      epi.radius * Math.cos(angle),
      epi.radius * Math.sin(angle),
    ]
    center = vec.add(center, offset)
    centers.push(center)
  }

  const tipPosition = center

  // Update trail (only add point if time has advanced)
  if (time > prevTimeRef.current + 0.01) {
    trailRef.current.push(tipPosition)
    if (trailRef.current.length > 2000) {
      trailRef.current = trailRef.current.slice(-1500)
    }
    prevTimeRef.current = time
  }

  // Reset trail when harmonics change
  const prevHarmonicsRef = useRef(numHarmonics)
  if (numHarmonics !== prevHarmonicsRef.current) {
    trailRef.current = []
    prevHarmonicsRef.current = numHarmonics
  }

  const trail = trailRef.current

  return (
    <>
      <Mafs
        height={500}
        viewBox={{ x: [-3, 3], y: [-3, 3] }}
        pan
        zoom={{ min: 0.2, max: 10 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />

        {/* Epicycle circles */}
        {epicycles.map((epi, i) => (
          <Circle
            key={`circle-${i}`}
            center={centers[i]}
            radius={epi.radius}
            color={Theme.blue}
            fillOpacity={0.02}
            strokeOpacity={0.3}
            weight={1}
          />
        ))}

        {/* Radius lines */}
        {epicycles.map((_, i) => (
          <Line.Segment
            key={`radius-${i}`}
            point1={centers[i]}
            point2={centers[i + 1]}
            color={Theme.foreground}
            opacity={0.4}
            weight={1}
          />
        ))}

        {/* Trail */}
        {trail.length > 1 && (
          <Polyline points={trail} color={Theme.pink} weight={2} />
        )}

        {/* Tip point */}
        <Point x={tipPosition[0]} y={tipPosition[1]} color={Theme.pink} />
        {debug && <Debug.ViewportInfo />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-3 text-sm flex-1">
          <span className="font-bold opacity-70">Harmonics</span>
          <span className="w-6 tabular-nums text-center">{numHarmonics}</span>
          <input
            type="range"
            min={1}
            max={15}
            value={numHarmonics}
            onChange={(e) => setNumHarmonics(Number(e.target.value))}
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
