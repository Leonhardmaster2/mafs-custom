import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface NormalRegion {
  /** Left bound of the shaded region */
  from: number
  /** Right bound of the shaded region */
  to: number
  /** Fill color. Default: Theme.blue */
  color?: string
  /** Fill opacity. Default: 0.15 */
  opacity?: number
  /** Label text (e.g., "68.2%") */
  label?: string
}

export interface NormalDistributionProps {
  /** Mean (μ). Default: 0 */
  mean?: number
  /** Standard deviation (σ). Default: 1 */
  stdDev?: number
  /** Domain for the curve [min, max]. Default: [μ-4σ, μ+4σ] */
  domain?: vec.Vector2
  /** Color of the curve. Default: Theme.blue */
  color?: string
  /** Single shaded region (shorthand) */
  shade?: NormalRegion
  /** Multiple shaded regions */
  regions?: NormalRegion[]
  /** Whether to show a vertical line at the mean. Default: true */
  showMeanLine?: boolean
  /** Whether to show markers at μ±σ, μ±2σ, μ±3σ. Default: false */
  showStdDevMarkers?: boolean
  /** Whether to show z-score labels on std dev markers. Default: false */
  showValues?: boolean
  /** Stroke weight. Default: 3 */
  weight?: number
  /** Opacity. Default: 1 */
  opacity?: number
  /** Font size for labels. Default: 20 */
  labelSize?: number
}

/** Normal PDF: (1/(σ√(2π))) * e^(-(x-μ)²/(2σ²)) */
function normalPdf(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI))
  const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2)
  return coefficient * Math.exp(exponent)
}

export function NormalDistribution({
  mean = 0,
  stdDev = 1,
  domain,
  color = Theme.blue,
  shade,
  regions = [],
  showMeanLine = true,
  showStdDevMarkers = false,
  showValues = false,
  weight = 3,
  opacity = 1,
  labelSize = 20,
}: NormalDistributionProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const domMin = domain ? domain[0] : mean - 4 * stdDev
  const domMax = domain ? domain[1] : mean + 4 * stdDev

  // Combine shade shorthand with regions array
  const allRegions = React.useMemo(() => {
    const r = [...regions]
    if (shade) r.push(shade)
    return r
  }, [shade, regions])

  // Sample the bell curve
  const numSamples = 300
  const curvePath = React.useMemo(() => {
    const points: vec.Vector2[] = []
    const dx = (domMax - domMin) / numSamples
    for (let i = 0; i <= numSamples; i++) {
      const x = domMin + i * dx
      points.push([x, normalPdf(x, mean, stdDev)])
    }
    return points
  }, [domMin, domMax, mean, stdDev, numSamples])

  // Transform curve to pixel space
  const pxCurve = curvePath.map((p) => vec.transform(p, combinedTransform))
  const curveD =
    `M ${pxCurve[0][0]},${pxCurve[0][1]}` +
    pxCurve.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

  // Mean line
  const peakY = normalPdf(mean, mean, stdDev)
  const pxMeanTop = vec.transform([mean, peakY * 1.05] as vec.Vector2, combinedTransform)
  const pxMeanBot = vec.transform([mean, 0] as vec.Vector2, combinedTransform)

  // Std dev markers
  const stdDevMarks = showStdDevMarkers
    ? [-3, -2, -1, 1, 2, 3].map((n) => mean + n * stdDev)
    : []

  return (
    <g>
      {/* Shaded regions */}
      {allRegions.map((region, i) => {
        const regColor = region.color ?? color
        const regOpacity = region.opacity ?? 0.15
        const rFrom = Math.max(region.from, domMin)
        const rTo = Math.min(region.to, domMax)

        // Sample region area
        const regionDx = (rTo - rFrom) / 100
        const regionPts: vec.Vector2[] = [[rFrom, 0]]
        for (let j = 0; j <= 100; j++) {
          const x = rFrom + j * regionDx
          regionPts.push([x, normalPdf(x, mean, stdDev)])
        }
        regionPts.push([rTo, 0])

        const pxRegion = regionPts.map((p) => vec.transform(p, combinedTransform))
        const regionD =
          `M ${pxRegion[0][0]},${pxRegion[0][1]}` +
          pxRegion.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
          " Z"

        // Label position: centered above the region
        const labelX = (rFrom + rTo) / 2
        const labelY = normalPdf(labelX, mean, stdDev) * 0.5
        const pxLabel = vec.transform([labelX, labelY] as vec.Vector2, combinedTransform)

        return (
          <g key={`region-${i}`}>
            <path
              d={regionD}
              fill={regColor}
              fillOpacity={regOpacity}
              stroke="none"
            />
            {region.label && (
              <text
                x={pxLabel[0]}
                y={pxLabel[1]}
                fontSize={labelSize}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: regColor }}
                className="mafs-shadow"
              >
                {region.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Bell curve */}
      <path
        d={curveD}
        fill="none"
        stroke={color}
        strokeWidth={weight}
        opacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Mean line */}
      {showMeanLine && (
        <line
          x1={pxMeanTop[0]}
          y1={pxMeanTop[1]}
          x2={pxMeanBot[0]}
          y2={pxMeanBot[1]}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="var(--mafs-line-stroke-dash-style)"
          opacity={0.6}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}

      {/* Standard deviation markers */}
      {stdDevMarks.map((x) => {
        const y = normalPdf(x, mean, stdDev)
        const pxTop = vec.transform([x, y] as vec.Vector2, combinedTransform)
        const pxBot = vec.transform([x, 0] as vec.Vector2, combinedTransform)
        const zScore = Math.round((x - mean) / stdDev)

        return (
          <g key={`stddev-${zScore}`}>
            <line
              x1={pxTop[0]}
              y1={pxTop[1]}
              x2={pxBot[0]}
              y2={pxBot[1]}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3,4"
              opacity={0.4}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            {showValues && (
              <text
                x={pxTop[0]}
                y={pxTop[1] - 8}
                fontSize={labelSize * 0.8}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{ fill: color, pointerEvents: "none" }}
                opacity={0.8}
                className="mafs-shadow"
              >
                {zScore > 0 ? `+${zScore}σ` : `${zScore}σ`}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

NormalDistribution.displayName = "NormalDistribution"
