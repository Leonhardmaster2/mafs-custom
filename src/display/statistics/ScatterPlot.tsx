import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface RegressionConfig {
  /** Regression type. Default: "linear" */
  type?: "linear" | "quadratic" | "exponential" | "none"
  /** Color of the regression line. Default: Theme.red */
  color?: string
  /** Color of the equation and R² text. Default: Theme.foreground */
  labelColor?: string
  /** Whether to show the equation. Default: false */
  showEquation?: boolean
  /** Whether to show the R² value. Default: false */
  showR2?: boolean
  /** Stroke weight. Default: 2 */
  weight?: number
}

export interface ScatterSeries {
  /** Point coordinates */
  points: vec.Vector2[]
  /** Color. Default: Theme.blue */
  color?: string
  /** Label for this series */
  label?: string
}

export interface ScatterPlotProps {
  /** Single set of points */
  points?: vec.Vector2[]
  /** Multiple series */
  series?: ScatterSeries[]
  /** Point color (for single points mode). Default: Theme.blue */
  color?: string
  /** Point radius in world units. Default: 0.12 */
  pointRadius?: number
  /** Regression line config */
  regression?: RegressionConfig
  /** Whether to show mean lines. Default: false */
  showMeanLines?: boolean
  /** Font size for labels. Default: 16 */
  labelSize?: number
}

function linearRegression(pts: vec.Vector2[]): {
  slope: number
  intercept: number
  r2: number
} {
  const n = pts.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (const [x, y] of pts) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
  }

  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: sumY / n, r2: 0 }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // R²
  const meanY = sumY / n
  let ssTot = 0, ssRes = 0
  for (const [x, y] of pts) {
    ssTot += (y - meanY) ** 2
    ssRes += (y - (slope * x + intercept)) ** 2
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { slope, intercept, r2 }
}

function quadraticRegression(pts: vec.Vector2[]): {
  a: number
  b: number
  c: number
  r2: number
} {
  const n = pts.length
  if (n < 3) return { a: 0, b: 0, c: 0, r2: 0 }

  // Normal equations for y = ax² + bx + c
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0
  let sy = 0, sxy = 0, sx2y = 0
  for (const [x, y] of pts) {
    const x2 = x * x
    s0 += 1
    s1 += x
    s2 += x2
    s3 += x * x2
    s4 += x2 * x2
    sy += y
    sxy += x * y
    sx2y += x2 * y
  }

  // Solve 3x3 system using Cramer's rule
  const det =
    s4 * (s2 * s0 - s1 * s1) -
    s3 * (s3 * s0 - s1 * s2) +
    s2 * (s3 * s1 - s2 * s2)

  if (Math.abs(det) < 1e-12) return { a: 0, b: 0, c: sy / n, r2: 0 }

  const a =
    (sx2y * (s2 * s0 - s1 * s1) -
      s3 * (sxy * s0 - s1 * sy) +
      s2 * (sxy * s1 - s2 * sy)) /
    det
  const b =
    (s4 * (sxy * s0 - s1 * sy) -
      sx2y * (s3 * s0 - s1 * s2) +
      s2 * (s3 * sy - sxy * s2)) /
    det
  const c =
    (s4 * (s2 * sy - sxy * s1) -
      s3 * (s3 * sy - sxy * s2) +
      sx2y * (s3 * s1 - s2 * s2)) /
    det

  const meanY = sy / n
  let ssTot = 0, ssRes = 0
  for (const [x, y] of pts) {
    ssTot += (y - meanY) ** 2
    ssRes += (y - (a * x * x + b * x + c)) ** 2
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { a, b, c, r2 }
}

function exponentialRegression(pts: vec.Vector2[]): {
  a: number
  b: number
  r2: number
} {
  // y = a * e^(bx) => ln(y) = ln(a) + bx
  const logPts: vec.Vector2[] = pts
    .filter(([, y]) => y > 0)
    .map(([x, y]) => [x, Math.log(y)])

  if (logPts.length < 2) return { a: 1, b: 0, r2: 0 }

  const { slope: b, intercept: lnA, r2 } = linearRegression(logPts)
  return { a: Math.exp(lnA), b, r2 }
}

export function ScatterPlot({
  points,
  series,
  color = Theme.blue,
  pointRadius = 0.12,
  regression,
  showMeanLines = false,
  labelSize = 16,
}: ScatterPlotProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Normalize to series format
  const allSeries: ScatterSeries[] = React.useMemo(() => {
    if (series) return series
    if (points) return [{ points, color }]
    return []
  }, [series, points, color])

  // All points combined (for regression)
  const allPoints = React.useMemo(
    () => allSeries.flatMap((s) => s.points),
    [allSeries],
  )

  // Regression computation
  const regressionData = React.useMemo(() => {
    if (!regression || regression.type === "none" || allPoints.length < 2) {
      return null
    }

    const type = regression.type ?? "linear"
    const xMin = Math.min(...allPoints.map(([x]) => x))
    const xMax = Math.max(...allPoints.map(([x]) => x))
    const padding = (xMax - xMin) * 0.1
    const domain: vec.Vector2 = [xMin - padding, xMax + padding]

    if (type === "linear") {
      const { slope, intercept, r2 } = linearRegression(allPoints)
      const fn = (x: number) => slope * x + intercept
      const eq =
        `y = ${slope.toFixed(2)}x ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept).toFixed(2)}`
      return { fn, eq, r2, domain }
    }

    if (type === "quadratic") {
      const { a, b, c, r2 } = quadraticRegression(allPoints)
      const fn = (x: number) => a * x * x + b * x + c
      const eq = `y = ${a.toFixed(2)}x² ${b >= 0 ? "+" : "−"} ${Math.abs(b).toFixed(2)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c).toFixed(2)}`
      return { fn, eq, r2, domain }
    }

    if (type === "exponential") {
      const { a, b, r2 } = exponentialRegression(allPoints)
      const fn = (x: number) => a * Math.exp(b * x)
      const eq = `y = ${a.toFixed(2)}e^(${b.toFixed(2)}x)`
      return { fn, eq, r2, domain }
    }

    return null
  }, [regression, allPoints])

  // Mean values
  const means = React.useMemo(() => {
    if (!showMeanLines || allPoints.length === 0) return null
    const sumX = allPoints.reduce((s, [x]) => s + x, 0)
    const sumY = allPoints.reduce((s, [, y]) => s + y, 0)
    return {
      x: sumX / allPoints.length,
      y: sumY / allPoints.length,
    }
  }, [showMeanLines, allPoints])

  // Pixel radius for points
  const pxOrigin = vec.transform([0, 0] as vec.Vector2, combinedTransform)
  const pxRadiusRef = vec.transform([pointRadius, 0] as vec.Vector2, combinedTransform)
  const pxRadius = Math.abs(pxRadiusRef[0] - pxOrigin[0])

  return (
    <g>
      {/* Mean lines */}
      {means && (() => {
        const xLineMin = Math.min(...allPoints.map(([x]) => x)) - 0.5
        const xLineMax = Math.max(...allPoints.map(([x]) => x)) + 0.5
        const yLineMin = Math.min(...allPoints.map(([, y]) => y)) - 0.5
        const yLineMax = Math.max(...allPoints.map(([, y]) => y)) + 0.5

        const pxH1 = vec.transform([xLineMin, means.y] as vec.Vector2, combinedTransform)
        const pxH2 = vec.transform([xLineMax, means.y] as vec.Vector2, combinedTransform)
        const pxV1 = vec.transform([means.x, yLineMin] as vec.Vector2, combinedTransform)
        const pxV2 = vec.transform([means.x, yLineMax] as vec.Vector2, combinedTransform)

        return (
          <>
            <line
              x1={pxH1[0]} y1={pxH1[1]} x2={pxH2[0]} y2={pxH2[1]}
              stroke={Theme.foreground}
              strokeWidth={1}
              strokeDasharray="5,5"
              opacity={0.4}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            <line
              x1={pxV1[0]} y1={pxV1[1]} x2={pxV2[0]} y2={pxV2[1]}
              stroke={Theme.foreground}
              strokeWidth={1}
              strokeDasharray="5,5"
              opacity={0.4}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
          </>
        )
      })()}

      {/* Regression line */}
      {regressionData && (() => {
        const rColor = regression?.color ?? Theme.red
        const rLabelColor = regression?.labelColor ?? Theme.foreground
        const rWeight = regression?.weight ?? 2
        const numSamples = 200
        const [dMin, dMax] = regressionData.domain
        const dx = (dMax - dMin) / numSamples

        const pts: vec.Vector2[] = []
        for (let i = 0; i <= numSamples; i++) {
          const x = dMin + i * dx
          const y = regressionData.fn(x)
          if (isFinite(y)) pts.push([x, y])
        }
        const pxPts = pts.map((p) => vec.transform(p, combinedTransform))
        if (pxPts.length < 2) return null

        const d =
          `M ${pxPts[0][0]},${pxPts[0][1]}` +
          pxPts.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

        // Equation and R² label position
        const labelWorld: vec.Vector2 = [dMax - (dMax - dMin) * 0.05, regressionData.fn(dMax - (dMax - dMin) * 0.05) + 0.3]
        const pxLabel = vec.transform(labelWorld, combinedTransform)

        return (
          <g>
            <path
              d={d}
              fill="none"
              stroke={rColor}
              strokeWidth={rWeight}
              strokeLinecap="round"
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            {regression?.showEquation && (
              <text
                x={pxLabel[0]}
                y={pxLabel[1]}
                fontSize={labelSize}
                textAnchor="end"
                dominantBaseline="auto"
                style={{ fill: rLabelColor }}
                className="mafs-shadow"
              >
                {regressionData.eq}
              </text>
            )}
            {regression?.showR2 && (
              <text
                x={pxLabel[0]}
                y={pxLabel[1] + labelSize * 1.3}
                fontSize={labelSize}
                textAnchor="end"
                dominantBaseline="auto"
                style={{ fill: rLabelColor }}
                opacity={0.85}
                className="mafs-shadow"
              >
                R² = {regressionData.r2.toFixed(4)}
              </text>
            )}
          </g>
        )
      })()}

      {/* Data points */}
      {allSeries.map((s, si) => {
        const seriesColor = s.color ?? color
        return (
          <g key={`series-${si}`}>
            {s.points.map(([x, y], pi) => {
              const px = vec.transform([x, y] as vec.Vector2, combinedTransform)
              return (
                <circle
                  key={`pt-${pi}`}
                  cx={px[0]}
                  cy={px[1]}
                  r={pxRadius}
                  style={{ fill: seriesColor, opacity: 1 }}
                />
              )
            })}
            {/* Series label */}
            {s.label && s.points.length > 0 && (() => {
              const lastPt = s.points[s.points.length - 1]
              const pxLast = vec.transform(lastPt, combinedTransform)
              return (
                <text
                  x={pxLast[0] + pxRadius + 4}
                  y={pxLast[1]}
                  fontSize={labelSize * 0.85}
                  textAnchor="start"
                  dominantBaseline="middle"
                  style={{ fill: seriesColor }}
                  className="mafs-shadow"
                >
                  {s.label}
                </text>
              )
            })()}
          </g>
        )
      })}
    </g>
  )
}

ScatterPlot.displayName = "ScatterPlot"
