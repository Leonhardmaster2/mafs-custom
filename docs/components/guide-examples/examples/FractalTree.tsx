"use client"

import * as React from "react"
import {
  Mafs,
  Coordinates,
  Debug,
  useMovablePoint,
  useStopwatch,
  Theme,
  vec,
  useTransformContext,
  usePaneContext,
} from "mafs"

const MAX_BRANCHES = 12000
const ABS_MAX_DEPTH = 30
const MIN_PX_LENGTH = 1

function FractalTreeInner({ debug }: { debug: boolean }) {
  const trunkLength = 2.0
  const lengthRatio = 0.72
  const startPos: vec.Vector2 = [0, -3]
  const startAngle = Math.PI / 2

  const angleControl = useMovablePoint([1.5, 2], {
    constrain: "horizontal",
    color: Theme.green,
  })
  const branchAngle = Math.max(0.1, Math.min(1.2, angleControl.x * 0.35))

  const { time, start } = useStopwatch({ endTime: Infinity })
  React.useEffect(() => { start() }, [start])

  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const { xPaneRange, yPaneRange } = usePaneContext()
  // Add very generous padding (100% of pane range on each side) so branches
  // near viewport edges are never culled prematurely.
  const paneW = xPaneRange[1] - xPaneRange[0]
  const paneH = yPaneRange[1] - yPaneRange[0]
  const pad = Math.max(paneW, paneH)
  const wxMin = xPaneRange[0] - pad
  const wxMax = xPaneRange[1] + pad
  const wyMin = yPaneRange[0] - pad
  const wyMax = yPaneRange[1] + pad

  // Scale factor for quick pixel-length estimate
  const pxPerUnit = Math.max(Math.abs(combinedTransform[0]), Math.abs(combinedTransform[4]))

  const animFront = time / 0.3

  // Matrix elements for inline transform (matches vec.transform formula)
  const m0 = combinedTransform[0]
  const m1 = combinedTransform[1]
  const m2 = combinedTransform[2]
  const m3 = combinedTransform[3]
  const m4 = combinedTransform[4]
  const m5 = combinedTransform[5]

  const depthPaths = React.useMemo(() => {
    const groups = new Map<number, number[]>()
    let totalBranches = 0

    // Use the simple, proven angle-based approach (not direction-vector rotation).
    // This is the same algorithm as the original working tree.
    function recurse(
      px: number, py: number,
      angle: number,
      length: number,
      depth: number,
    ) {
      if (totalBranches >= MAX_BRANCHES) return
      if (depth >= ABS_MAX_DEPTH) return
      if (depth > animFront) return

      // Pixel-size culling
      if (length * pxPerUnit < MIN_PX_LENGTH) return

      // Compute endpoint
      const dx = Math.cos(angle) * length
      const dy = Math.sin(angle) * length
      const ex = px + dx
      const ey = py + dy

      // Viewport culling: the full subtree from this branch can extend at most
      // sum(length * ratio^k, k=0..inf) = length / (1 - ratio) in any direction
      const reach = length / (1 - lengthRatio)
      const bxMin = Math.min(px, ex) - reach
      const bxMax = Math.max(px, ex) + reach
      const byMin = Math.min(py, ey) - reach
      const byMax = Math.max(py, ey) + reach

      if (bxMax < wxMin || bxMin > wxMax || byMax < wyMin || byMin > wyMax) {
        return
      }

      // Growth animation
      const growFrac = Math.min(1, animFront - depth)
      const aex = px + dx * growFrac
      const aey = py + dy * growFrac

      // Inline transform to pixel space
      const psx = px * m0 + py * m1 + m2
      const psy = px * m3 + py * m4 + m5
      const pex = aex * m0 + aey * m1 + m2
      const pey = aex * m3 + aey * m4 + m5

      // Emit to depth group
      let arr = groups.get(depth)
      if (!arr) { arr = []; groups.set(depth, arr) }
      arr.push(psx, psy, pex, pey)
      totalBranches++

      // Recurse into both children symmetrically
      if (growFrac >= 1) {
        const childLen = length * lengthRatio
        recurse(ex, ey, angle + branchAngle, childLen, depth + 1)
        recurse(ex, ey, angle - branchAngle, childLen, depth + 1)
      }
    }

    recurse(startPos[0], startPos[1], startAngle, trunkLength, 0)

    // Convert number arrays to SVG path strings
    const pathGroups = new Map<number, string>()
    for (const [depth, coords] of groups.entries()) {
      const parts: string[] = new Array(coords.length / 4)
      for (let i = 0, j = 0; i < coords.length; i += 4, j++) {
        parts[j] = `M${coords[i].toFixed(1)} ${coords[i+1].toFixed(1)}L${coords[i+2].toFixed(1)} ${coords[i+3].toFixed(1)}`
      }
      pathGroups.set(depth, parts.join(""))
    }

    return { paths: pathGroups, totalBranches, maxDepth: Math.max(0, ...groups.keys()) }
  }, [branchAngle, m0, m1, m2, m3, m4, m5, wxMin, wxMax, wyMin, wyMax, animFront, pxPerUnit])

  return (
    <>
      <Coordinates.Cartesian xAxis="auto" yAxis="auto" />

      {Array.from(depthPaths.paths.entries()).map(([depth, pathD]) => {
        const fraction = Math.min(1, depth / 15)
        const hue = 30 + fraction * 90
        const lightness = 25 + fraction * 30
        const strokeW = Math.max(0.5, 3 - depth * 0.25)

        return (
          <path
            key={`d${depth}`}
            d={pathD}
            stroke={`hsl(${hue},60%,${lightness}%)`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            fill="none"
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {angleControl.element}
      {debug && <Debug.ViewportInfo />}
      {debug && <Debug.FpsCounter />}

      {debug && (
        <g className="mafs-shadow" fontFamily="monospace" fontSize={12}>
          <text
            x={vec.transform([xPaneRange[0], yPaneRange[1]], combinedTransform)[0] + 10}
            y={vec.transform([xPaneRange[0], yPaneRange[1]], combinedTransform)[1] + 20}
            fill="var(--mafs-fg)"
          >
            branches: {depthPaths.totalBranches}/{MAX_BRANCHES} | depth: {depthPaths.maxDepth}
          </text>
        </g>
      )}
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
        zoom={{ min: 0.001, max: 10000 }}
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
        <span className="text-xs opacity-50 ml-auto">
          Infinite zoom · Drag green point for angle · Scroll to zoom · Drag to pan
        </span>
      </div>
    </>
  )
}
