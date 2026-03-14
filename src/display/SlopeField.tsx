import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { usePaneContext } from "../context/PaneContext"
import { useSpanContext } from "../context/SpanContext"
import { roundToNearestPowerOf10, pickClosestToValue } from "../math"
import { Theme } from "./Theme"
import { vec } from "../vec"

const MAX_SEGMENTS = 8000
const MAX_SOLUTION_POINTS = 10000

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
  const { xPaneRange, yPaneRange } = usePaneContext()
  const { xSpan, ySpan } = useSpanContext()

  const [wxMin, wxMax] = xPaneRange
  const [wyMin, wyMax] = yPaneRange

  // Auto-compute step from viewport span so the field adapts to zoom level.
  let step: number
  if (stepProp === "auto") {
    const idealStep = xSpan / 20
    const pow10 = roundToNearestPowerOf10(idealStep)
    const candidates = [pow10 * 1, pow10 * 2, pow10 * 5]
    const [closest] = pickClosestToValue(idealStep, candidates)
    step = closest
  } else {
    step = stepProp
  }

  const segLen = segmentLength ?? step * 0.8

  // Build the slope field as a single batched path over the full visible range.
  // Uses xPaneRange/yPaneRange (continuous bounds) instead of iterating discrete panes.
  const fieldD = React.useMemo(() => {
    const parts: string[] = []
    let count = 0

    const xStart = Math.floor(wxMin / step) * step
    const xEnd = Math.ceil(wxMax / step) * step
    const yStart = Math.floor(wyMin / step) * step
    const yEnd = Math.ceil(wyMax / step) * step

    for (let x = xStart; x <= xEnd; x += step) {
      for (let y = yStart; y <= yEnd; y += step) {
        if (count >= MAX_SEGMENTS) break
        const m = ode(x, y)
        if (!isFinite(m)) continue

        // Direction vector [1, m], normalized, scaled to segLen/2
        const mag = Math.sqrt(1 + m * m)
        const dx = (segLen / 2) * (1 / mag)
        const dy = (segLen / 2) * (m / mag)

        const sx = x - dx
        const sy = y - dy
        const ex = x + dx
        const ey = y + dy

        // Inline transform to pixel space
        const psx = sx * pixelMatrix[0] + sy * pixelMatrix[1] + pixelMatrix[2]
        const psy = sx * pixelMatrix[3] + sy * pixelMatrix[4] + pixelMatrix[5]
        const pex = ex * pixelMatrix[0] + ey * pixelMatrix[1] + pixelMatrix[2]
        const pey = ex * pixelMatrix[3] + ey * pixelMatrix[4] + pixelMatrix[5]

        parts.push(`M${psx.toFixed(1)} ${psy.toFixed(1)}L${pex.toFixed(1)} ${pey.toFixed(1)}`)
        count++
      }
      if (count >= MAX_SEGMENTS) break
    }

    return parts.join("")
  }, [wxMin, wxMax, wyMin, wyMax, step, segLen, ode, pixelMatrix])

  // Solution curves via numerical integration
  const solutionPaths = React.useMemo(() => {
    if (!solutions || solutions.length === 0) return []

    // Viewport-relative clamp: solutions shouldn't extend beyond
    // a generous multiple of the visible area
    const yClamp = ySpan * 10
    const yClampMin = wyMin - yClamp
    const yClampMax = wyMax + yClamp

    return solutions.map((sol) => {
      const [x0, y0] = sol.initialCondition

      // Determine integration domain from the visible viewport
      let domMin: number
      let domMax: number
      if (sol.domain) {
        domMin = sol.domain[0]
        domMax = sol.domain[1]
      } else {
        domMin = wxMin - xSpan * 0.5
        domMax = wxMax + xSpan * 0.5
      }

      // Adapt integration step to viewport: roughly 500 steps per screen width
      let h: number
      if (integrationStepProp === "auto") {
        h = Math.max(xSpan / 500, (domMax - domMin) / MAX_SOLUTION_POINTS)
      } else {
        h = integrationStepProp
      }

      const points: vec.Vector2[] = [[x0, y0]]

      // Integrate forward
      let x = x0
      let y = y0
      let fwdCount = 0
      while (x < domMax && fwdCount < MAX_SOLUTION_POINTS / 2) {
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
        if (!isFinite(y) || y < yClampMin || y > yClampMax) break
        points.push([x, y])
        fwdCount++
      }

      // Integrate backward
      x = x0
      y = y0
      const backPoints: vec.Vector2[] = []
      let bwdCount = 0
      while (x > domMin && bwdCount < MAX_SOLUTION_POINTS / 2) {
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
        if (!isFinite(y) || y < yClampMin || y > yClampMax) break
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
  }, [solutions, ode, integrationMethod, integrationStepProp, wxMin, wxMax, wyMin, wyMax, xSpan, ySpan])

  return (
    <g>
      {/* Slope field */}
      <path
        d={fieldD}
        stroke={color}
        strokeWidth={weight}
        opacity={opacity}
        strokeLinecap="round"
        fill="none"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Solution curves */}
      {solutionPaths.map((sol, i) => {
        if (sol.points.length < 2) return null
        const pxPts = sol.points.map((p) => vec.transform(p, pixelMatrix))
        const d =
          `M ${pxPts[0][0]},${pxPts[0][1]}` +
          pxPts.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

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
