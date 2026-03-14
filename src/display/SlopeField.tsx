import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { usePaneContext } from "../context/PaneContext"
import { useSpanContext } from "../context/SpanContext"
import { roundToNearestPowerOf10, pickClosestToValue } from "../math"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface SolutionCurveConfig {
  /** Initial condition [x0, y0] */
  initialCondition: vec.Vector2
  /** Color of the solution curve. Default: Theme.blue */
  color?: string
  /** Stroke weight. Default: 2.5 */
  weight?: number
  /** Domain for integration [xMin, xMax]. Default: derived from pane bounds */
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
  /** Integration step size for solution curves. Default: 0.02 */
  integrationStep?: number
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
  integrationStep = 0.02,
}: SlopeFieldProps) {
  const { viewTransform: pixelMatrix } = useTransformContext()
  const { xPanes, yPanes } = usePaneContext()
  const { xSpan } = useSpanContext()

  // Auto-compute step from viewport span so the field adapts to zoom level.
  // Uses the same rounding logic as Coordinates.Cartesian's auto mode:
  // divide the visible span to get roughly 20 segments across the viewport.
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

  // Build the slope field as a single batched path
  let fieldD = ""

  for (const [xMin, xMax] of xPanes) {
    for (const [yMin, yMax] of yPanes) {
      for (let x = Math.floor(xMin / step) * step; x <= Math.ceil(xMax); x += step) {
        for (let y = Math.floor(yMin / step) * step; y <= Math.ceil(yMax); y += step) {
          const m = ode(x, y)
          if (!isFinite(m)) continue

          // Direction vector [1, m], normalized, scaled to segLen/2
          const mag = Math.sqrt(1 + m * m)
          const dx = (segLen / 2) * (1 / mag)
          const dy = (segLen / 2) * (m / mag)

          const start: vec.Vector2 = [x - dx, y - dy]
          const end: vec.Vector2 = [x + dx, y + dy]

          const pxStart = vec.transform(start, pixelMatrix)
          const pxEnd = vec.transform(end, pixelMatrix)

          fieldD += `M ${pxStart[0]} ${pxStart[1]} L ${pxEnd[0]} ${pxEnd[1]} `
        }
      }
    }
  }

  // Solution curves via numerical integration
  const solutionPaths = React.useMemo(() => {
    if (!solutions || solutions.length === 0) return []

    return solutions.map((sol) => {
      const [x0, y0] = sol.initialCondition

      // Determine integration domain
      let domMin = -10
      let domMax = 10
      if (sol.domain) {
        domMin = sol.domain[0]
        domMax = sol.domain[1]
      } else {
        for (const [xMin, xMax] of xPanes) {
          domMin = Math.min(domMin, xMin)
          domMax = Math.max(domMax, xMax)
        }
      }

      // Adapt integration step to zoom: finer when zoomed in
      const h = integrationStep === 0.02 ? Math.min(0.02, step / 25) : integrationStep
      const points: vec.Vector2[] = [[x0, y0]]

      // Integrate forward
      let x = x0
      let y = y0
      while (x < domMax) {
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
        if (!isFinite(y) || Math.abs(y) > 100) break
        points.push([x, y])
      }

      // Integrate backward
      x = x0
      y = y0
      const backPoints: vec.Vector2[] = []
      while (x > domMin) {
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
        if (!isFinite(y) || Math.abs(y) > 100) break
        backPoints.unshift([x, y])
      }

      return {
        points: [...backPoints, ...points],
        color: sol.color ?? Theme.blue,
        weight: sol.weight ?? 2.5,
        style: sol.style ?? "solid",
      }
    })
  }, [solutions, ode, integrationMethod, integrationStep, xPanes])

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
