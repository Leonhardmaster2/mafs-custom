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

/**
 * Hard cap on total rendered branches per frame.
 * This guarantees bounded render time regardless of zoom level.
 */
const MAX_BRANCHES = 4000

/** Hard cap on recursion depth (safety net — pixel culling stops earlier) */
const ABS_MAX_DEPTH = 30

/** Minimum pixel length to render a branch. Below this it's sub-pixel and invisible. */
const MIN_PX_LENGTH = 3

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
  const [wxMin, wxMax] = xPaneRange
  const [wyMin, wyMax] = yPaneRange

  // Pre-extract an approximate scale factor from the transform.
  // For a typical Mafs view (no rotation), m[0] is scaleX and m[4] is scaleY.
  // We use the average magnitude for a quick pixel-length estimate.
  const pxPerUnit = Math.max(Math.abs(combinedTransform[0]), Math.abs(combinedTransform[4]))

  const animFront = time / 0.3

  const depthPaths = React.useMemo(() => {
    // Use arrays instead of string concatenation (much faster for large counts)
    const groups = new Map<number, number[]>()
    let totalBranches = 0

    // Pre-compute cos/sin of branch angles (reused at every node)
    const cosP = Math.cos(branchAngle)
    const sinP = Math.sin(branchAngle)
    const cosN = Math.cos(-branchAngle)
    const sinN = Math.sin(-branchAngle)

    function recurse(
      px: number, py: number,  // start position
      dx: number, dy: number,  // direction vector (already scaled to length)
      depth: number,
    ) {
      if (totalBranches >= MAX_BRANCHES) return
      if (depth >= ABS_MAX_DEPTH) return
      if (depth > animFront) return

      const ex = px + dx
      const ey = py + dy
      const length = Math.sqrt(dx * dx + dy * dy)

      // Pixel-size culling: use the pre-extracted scale factor
      // instead of transforming both endpoints
      const pxLen = length * pxPerUnit
      if (pxLen < MIN_PX_LENGTH) return

      // Viewport culling with geometric subtree bound.
      // The maximum extent of the full subtree from this branch endpoint is
      // bounded by a geometric series: length * ratio / (1 - ratio).
      // We use this as padding instead of the vague "length * 3".
      const subtreeReach = length * lengthRatio / (1 - lengthRatio) + length
      const bxMin = Math.min(px, ex) - subtreeReach
      const bxMax = Math.max(px, ex) + subtreeReach
      const byMin = Math.min(py, ey) - subtreeReach
      const byMax = Math.max(py, ey) + subtreeReach

      if (bxMax < wxMin || bxMin > wxMax || byMax < wyMin || byMin > wyMax) {
        return
      }

      // Growth animation
      const growFrac = Math.min(1, animFront - depth)
      const aex = px + dx * growFrac
      const aey = py + dy * growFrac

      // Transform to pixel space: vec.transform formula is
      //   result_x = x * m[0] + y * m[1] + m[2]
      //   result_y = x * m[3] + y * m[4] + m[5]
      const m = combinedTransform
      const psx = px * m[0] + py * m[1] + m[2]
      const psy = px * m[3] + py * m[4] + m[5]
      const pex = aex * m[0] + aey * m[1] + m[2]
      const pey = aex * m[3] + aey * m[4] + m[5]

      // Emit to depth group
      let arr = groups.get(depth)
      if (!arr) { arr = []; groups.set(depth, arr) }
      arr.push(psx, psy, pex, pey)
      totalBranches++

      // Recurse children (only after growth completes)
      if (growFrac >= 1) {
        const childLen = length * lengthRatio
        const ndx = dx / length
        const ndy = dy / length
        // Left child: rotate direction by +branchAngle
        const ldx = (ndx * cosP - ndy * sinP) * childLen
        const ldy = (ndx * sinP + ndy * cosP) * childLen
        // Right child: rotate direction by -branchAngle
        const rdx = (ndx * cosN - ndy * sinN) * childLen
        const rdy = (ndx * sinN + ndy * cosN) * childLen

        recurse(ex, ey, ldx, ldy, depth + 1)
        recurse(ex, ey, rdx, rdy, depth + 1)
      }
    }

    // Initial trunk direction
    const trunkDx = Math.cos(startAngle) * trunkLength
    const trunkDy = Math.sin(startAngle) * trunkLength
    recurse(startPos[0], startPos[1], trunkDx, trunkDy, 0)

    // Convert number arrays to SVG path strings (single allocation per depth)
    const pathGroups = new Map<number, string>()
    for (const [depth, coords] of groups.entries()) {
      const parts: string[] = new Array(coords.length / 4)
      for (let i = 0, j = 0; i < coords.length; i += 4, j++) {
        parts[j] = `M${coords[i].toFixed(1)} ${coords[i+1].toFixed(1)}L${coords[i+2].toFixed(1)} ${coords[i+3].toFixed(1)}`
      }
      pathGroups.set(depth, parts.join(""))
    }

    return { paths: pathGroups, totalBranches, maxDepth: Math.max(...groups.keys(), 0) }
  }, [branchAngle, combinedTransform, wxMin, wxMax, wyMin, wyMax, animFront, pxPerUnit])

  return (
    <>
      <Coordinates.Cartesian xAxis="auto" yAxis="auto" />

      {Array.from(depthPaths.paths.entries()).map(([depth, pathD]) => {
        const fraction = Math.min(1, depth / 20)
        const hue = 30 + fraction * 90
        const lightness = 25 + fraction * 30
        const strokeW = Math.max(0.5, 3 - depth * 0.2)

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

      {debug && (
        <g className="mafs-shadow" fontFamily="monospace" fontSize={12}>
          <text
            x={vec.transform([wxMin, wyMax], combinedTransform)[0] + 10}
            y={vec.transform([wxMin, wyMax], combinedTransform)[1] + 20}
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
