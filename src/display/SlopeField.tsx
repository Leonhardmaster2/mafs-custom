import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { useCoordinateContext } from "../context/CoordinateContext"
import { roundToNearestPowerOf10, pickClosestToValue } from "../math"
import { Theme } from "./Theme"
import { vec } from "../vec"

const MAX_SEGMENTS = 8000
const MAX_SOLUTION_POINTS = 20000
// Target segment length in pixels — segments always appear this size on screen
const TARGET_PX_LENGTH = 25

export interface SolutionCurveConfig {
  /** Initial condition [x0, y0] */
  initialCondition: vec.Vector2
  /** Color of the solution curve. Default: Theme.blue */
  color?: string
  /** Stroke weight. Default: 2.5 */
  weight?: number
  /** Domain for integration [xMin, xMax]. Default: derived from visible bounds */
  domain?: vec.Vector2
  /** Stroke style. Default: "solid" */
  style?: "solid" | "dashed"
}

export interface SlopeFieldProps {
  /** The ODE: dy/dx = f(x, y) */
  ode: (x: number, y: number) => number
  /**
   * Grid spacing in world units. Default: "auto".
   * When "auto", the step adapts to the current zoom level so more detail
   * appears as you zoom in and less as you zoom out.
   */
  step?: number | "auto"
  /** Length of each slope segment in world units. Default: step * 0.8 */
  segmentLength?: number
  /** Color of slope segments. Default: Theme.foreground */
  color?: string
  /** Opacity of slope segments. Default: 0.6 */
  opacity?: number
  /** Stroke weight for slope segments. Default: 1.5 */
  weight?: number
  /** Solution curves to overlay */
  solutions?: SolutionCurveConfig[]
  /** Numerical integration method for solution curves. Default: "rk4" */
  integrationMethod?: "euler" | "rk4"
  /** Integration step size for solution curves. Default: "auto" */
  integrationStep?: number | "auto"
}

export function SlopeField({
  ode,
  step: stepProp = "auto",
  segmentLength,
  color = Theme.foreground,
  opacity = 0.6,
  weight = 1.5,
  solutions,
  integrationMethod = "rk4",
  integrationStep: integrationStepProp = "auto",
}: SlopeFieldProps) {
  const { viewTransform: pixelMatrix } = useTransformContext()
  const coords = useCoordinateContext()

  // Use actual visible coordinate bounds consistently for both grid spacing
  // and grid bounds — prevents mismatch between step size and covered area.
  const viewXMin = coords.xMin
  const viewXMax = coords.xMax
  const viewYMin = coords.yMin
  const viewYMax = coords.yMax
  const viewWidth = viewXMax - viewXMin

  // Auto-compute step from the ACTUAL visible width (not xSpan from SpanContext)
  // to always get ~20 segments across the viewport regardless of zoom.
  let step: number
  if (stepProp === "auto") {
    const idealStep = viewWidth / 20
    const pow10 = roundToNearestPowerOf10(idealStep)
    const candidates = [pow10 * 1, pow10 * 2, pow10 * 5]
    const [closest] = pickClosestToValue(idealStep, candidates)
    step = closest
  } else {
    step = stepProp
  }

  // Pixel scale factors from the view transform matrix
  const pxPerUnitX = Math.abs(pixelMatrix[0])
  const pxPerUnitY = Math.abs(pixelMatrix[4])

  // Grid bounds: extend slightly beyond visible area so edges aren't bare
  const gridXMin = viewXMin - step * 2
  const gridXMax = viewXMax + step * 2
  const gridYMin = viewYMin - step * 2
  const gridYMax = viewYMax + step * 2

  // Build the slope field as a single batched path in PIXEL-SPACE coordinates.
  // Each segment has a fixed pixel length (TARGET_PX_LENGTH) regardless of zoom,
  // ensuring consistent visual appearance at all zoom levels. The ODE is evaluated
  // at world-space grid points, then the direction vector is projected to pixel
  // space and normalized to the target pixel length.
  const fieldD = React.useMemo(() => {
    const parts: string[] = []
    let count = 0

    // segLen override: if user provided segmentLength, convert to pixel length
    const pxLen = segmentLength
      ? segmentLength * Math.max(pxPerUnitX, pxPerUnitY)
      : TARGET_PX_LENGTH
    const halfPx = pxLen / 2

    const xStart = Math.floor(gridXMin / step) * step
    const xEnd = Math.ceil(gridXMax / step) * step
    const yStart = Math.floor(gridYMin / step) * step
    const yEnd = Math.ceil(gridYMax / step) * step

    // Pixel-space offset for the view transform translation
    const tx = pixelMatrix[2]
    const ty = pixelMatrix[5]

    for (let x = xStart; x <= xEnd; x += step) {
      for (let y = yStart; y <= yEnd; y += step) {
        if (count >= MAX_SEGMENTS) break
        const m = ode(x, y)
        if (!isFinite(m)) continue

        // Center of this segment in pixel space
        const cx = x * pixelMatrix[0] + tx
        const cy = y * pixelMatrix[4] + ty

        // Direction vector in pixel space: world [1, m] → pixel [pxPerUnitX, m * pxPerUnitY]
        // (pxPerUnitY is negative because y-axis is flipped, but we use the absolute value
        //  and negate later since SVG y grows downward)
        const pdx = pxPerUnitX
        const pdy = -m * pxPerUnitY  // negative: world-up = screen-down
        const pmag = Math.sqrt(pdx * pdx + pdy * pdy)

        // Normalize to target pixel length
        const ndx = (pdx / pmag) * halfPx
        const ndy = (pdy / pmag) * halfPx

        const sx = cx - ndx
        const sy = cy - ndy
        const ex = cx + ndx
        const ey = cy + ndy

        parts.push(`M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`)
        count++
      }
      if (count >= MAX_SEGMENTS) break
    }

    return parts.join("")
  }, [gridXMin, gridXMax, gridYMin, gridYMax, step, segmentLength, ode, pixelMatrix, pxPerUnitX, pxPerUnitY])

  // Solution curves via numerical integration.
  //
  // CRITICAL: The integration must be completely independent of the viewport.
  // The curve is integrated ONCE from the exact world-space initial condition
  // with a FIXED step size and FIXED domain. Only the initial condition, ODE,
  // and integration method trigger recomputation — never zoom/pan.
  //
  // This prevents trajectory divergence: for unstable ODEs like dy/dx = x - y,
  // even tiny changes in step size h produce wildly different curves. If we
  // recomputed on every zoom change, the user would see the curve "fan out"
  // into multiple diverging lines.
  //
  // The polyline is in world-space and rendered via CSS transform, so
  // zoom/pan only affects projection — the integration result is stable.
  const solutionPaths = React.useMemo(() => {
    if (!solutions || solutions.length === 0) return []

    return solutions.map((sol) => {
      const [x0, y0] = sol.initialCondition

      // Fixed integration domain — large enough to cover any reasonable zoom.
      // Default ±10000 covers zooming out to very wide ranges.
      // These are CONSTANTS, not derived from the viewport.
      const domMin = sol.domain ? sol.domain[0] : -10000
      const domMax = sol.domain ? sol.domain[1] : 10000
      const domainWidth = domMax - domMin

      // Fixed step size — deterministic, never changes with zoom.
      // For "auto", we compute h to produce exactly MAX_SOLUTION_POINTS/2
      // steps across the domain, giving ~10000 points in each direction.
      // This gives h ≈ 2.0 for ±10000 domain (20000 / 10000 = 2.0),
      // which is coarse but produces a smooth enough polyline at that scale.
      const maxSteps = MAX_SOLUTION_POINTS / 2
      const h = integrationStepProp === "auto"
        ? domainWidth / (maxSteps * 2)
        : integrationStepProp

      // Fixed y-clamp — stop if curve escapes to absurd values
      const yClampAbs = 1e8
      const points: vec.Vector2[] = [[x0, y0]]

      // Integrate forward
      let x = x0
      let y = y0
      let fwdCount = 0
      while (x < domMax && fwdCount < maxSteps) {
        if (integrationMethod === "rk4") {
          const k1 = h * ode(x, y)
          const k2 = h * ode(x + h / 2, y + k1 / 2)
          const k3 = h * ode(x + h / 2, y + k2 / 2)
          const k4 = h * ode(x + h, y + k3)
          y = y + (k1 + 2 * k2 + 2 * k3 + k4) / 6
        } else {
          y = y + h * ode(x, y)
        }
        x += h
        if (!isFinite(y) || Math.abs(y) > yClampAbs) break
        points.push([x, y])
        fwdCount++
      }

      // Integrate backward
      x = x0
      y = y0
      const backPoints: vec.Vector2[] = []
      let bwdCount = 0
      while (x > domMin && bwdCount < maxSteps) {
        if (integrationMethod === "rk4") {
          const k1 = -h * ode(x, y)
          const k2 = -h * ode(x - h / 2, y + k1 / 2)
          const k3 = -h * ode(x - h / 2, y + k2 / 2)
          const k4 = -h * ode(x - h, y + k3)
          y = y + (k1 + 2 * k2 + 2 * k3 + k4) / 6
        } else {
          y = y - h * ode(x, y)
        }
        x -= h
        if (!isFinite(y) || Math.abs(y) > yClampAbs) break
        backPoints.unshift([x, y])
        bwdCount++
      }

      return {
        points: [...backPoints, ...points],
        color: sol.color ?? Theme.blue,
        weight: sol.weight ?? 2.5,
        style: sol.style ?? "solid",
      }
    })
    // ONLY recompute when the actual integration inputs change.
    // Viewport changes (zoom/pan) must NEVER appear in this dependency list.
  }, [solutions, ode, integrationMethod, integrationStepProp])

  return (
    <g>
      {/* Slope field — pixel-space path with fixed visual size */}
      <path
        d={fieldD}
        stroke={color}
        strokeWidth={weight}
        opacity={opacity}
        strokeLinecap="round"
        fill="none"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Solution curves — rendered as world-space polylines transformed via CSS */}
      {solutionPaths.map((sol, i) => {
        if (sol.points.length < 2) return null
        const d =
          `M ${sol.points[0][0]},${sol.points[0][1]}` +
          sol.points.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

        return (
          <path
            key={`solution-${i}`}
            d={d}
            fill="none"
            stroke={sol.color}
            strokeWidth={sol.weight}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              vectorEffect: "non-scaling-stroke",
              transform: "var(--mafs-view-transform)",
              strokeDasharray:
                sol.style === "dashed" ? "var(--mafs-line-stroke-dash-style)" : undefined,
            }}
          />
        )
      })}
    </g>
  )
}

SlopeField.displayName = "SlopeField"
