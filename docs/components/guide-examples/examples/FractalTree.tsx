"use client"

import * as React from "react"
import { Mafs, Coordinates, Debug, useMovablePoint, useStopwatch, Theme, vec, useTransformContext } from "mafs"

interface Branch {
  start: vec.Vector2
  end: vec.Vector2
  depth: number
}

function FractalTreeInner({ debug }: { debug: boolean }) {
  const maxDepth = 10
  const trunkLength = 2.0
  const lengthRatio = 0.72
  const startPos: vec.Vector2 = [0, -3]
  const startAngle = Math.PI / 2

  // Branching angle controlled by movable point
  const angleControl = useMovablePoint([1.5, 2], {
    constrain: "horizontal",
    color: Theme.green,
  })
  const branchAngle = Math.max(0.1, Math.min(1.2, angleControl.x * 0.35))

  const { time, start } = useStopwatch({ endTime: maxDepth * 0.3 })
  React.useEffect(() => { start() }, [start])

  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Generate all branches
  const branches = React.useMemo(() => {
    const segs: Branch[] = []
    function generate(
      pos: vec.Vector2,
      angle: number,
      length: number,
      depth: number,
    ) {
      const direction: vec.Vector2 = [
        Math.cos(angle) * length,
        Math.sin(angle) * length,
      ]
      const end = vec.add(pos, direction)
      segs.push({ start: pos, end, depth })

      if (depth < maxDepth) {
        generate(end, angle + branchAngle, length * lengthRatio, depth + 1)
        generate(end, angle - branchAngle, length * lengthRatio, depth + 1)
      }
    }
    generate(startPos, startAngle, trunkLength, 0)
    return segs
  }, [branchAngle])

  // Group branches by depth for coloring, with animation
  const depthGroups = React.useMemo(() => {
    const groups: Map<number, string> = new Map()
    for (let d = 0; d <= maxDepth; d++) {
      const depthTime = d * 0.3
      if (time < depthTime) continue

      let pathD = ""
      for (const b of branches) {
        if (b.depth !== d) continue

        const growFraction = Math.min(1, (time - depthTime) / 0.3)
        const animEnd: vec.Vector2 = vec.lerp(b.start, b.end, growFraction)

        const pxStart = vec.transform(b.start, combinedTransform)
        const pxEnd = vec.transform(animEnd, combinedTransform)
        pathD += `M ${pxStart[0]} ${pxStart[1]} L ${pxEnd[0]} ${pxEnd[1]} `
      }

      if (pathD) {
        groups.set(d, pathD)
      }
    }
    return groups
  }, [branches, time, combinedTransform])

  return (
    <>
      <Coordinates.Cartesian xAxis="auto" yAxis="auto" />

      {Array.from(depthGroups.entries()).map(([depth, pathD]) => {
        const fraction = depth / maxDepth
        const hue = 30 + fraction * 90
        const lightness = 25 + fraction * 30
        const strokeW = Math.max(0.5, 3 - depth * 0.25)

        return (
          <path
            key={`depth-${depth}`}
            d={pathD}
            stroke={`hsl(${hue}, 60%, ${lightness}%)`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            fill="none"
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {angleControl.element}
      {debug && <Debug.ViewportInfo />}
    </>
  )
}

export default function FractalTree() {
  const [debug, setDebug] = React.useState(false)

  return (
    <>
      <Mafs
        height={500}
        viewBox={{ x: [-5, 5], y: [-4, 5] }}
        pan
        zoom={{ min: 0.1, max: 20 }}
        debug={debug}
      >
        <FractalTreeInner debug={debug} />
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-red-500"
          />
          <span className="opacity-70">Debug</span>
        </label>
        <span className="text-xs opacity-50 ml-auto">Drag green point to change angle · Scroll to zoom · Drag to pan</span>
      </div>
    </>
  )
}
