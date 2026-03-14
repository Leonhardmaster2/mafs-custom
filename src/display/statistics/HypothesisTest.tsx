import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface HypothesisTestProps {
  /** Distribution mean under H0. Default: 0 */
  mean?: number
  /** Standard deviation (or standard error). Default: 1 */
  stdDev?: number
  /** Significance level (alpha). Default: 0.05 */
  alpha?: number
  /** Alternative hypothesis direction */
  alternative: "less" | "greater" | "two-sided"
  /** The observed test statistic (z-score position on the distribution).
   *  If omitted, only the rejection region is shown. */
  testStatistic?: number
  /** Whether to shade the rejection region(s). Default: true */
  showRejectionRegion?: boolean
  /** Whether to shade the p-value area. Default: true */
  showPValue?: boolean
  /** Whether to show dashed vertical lines at critical value(s). Default: true */
  showCriticalValues?: boolean
  /** Whether to show a vertical line and point at the test statistic. Default: true */
  showTestStatistic?: boolean
  /** Color of the distribution curve. Default: Theme.blue */
  curveColor?: string
  /** Color of the rejection region shading. Default: Theme.red */
  rejectionColor?: string
  /** Opacity of rejection region fill. Default: 0.2 */
  rejectionOpacity?: number
  /** Color of the p-value region shading. Default: Theme.yellow */
  pValueColor?: string
  /** Opacity of p-value region fill. Default: 0.25 */
  pValueOpacity?: number
  /** Whether to show the acceptance region. Default: false */
  showAcceptanceRegion?: boolean
  /** Color of the acceptance region. Default: Theme.green */
  acceptanceColor?: string
  /** Opacity of acceptance region fill. Default: 0.08 */
  acceptanceOpacity?: number
  /** Stroke weight for the curve. Default: 3 */
  weight?: number
  /** Font size for labels. Default: 18 */
  labelSize?: number
  /** Whether to show the decision text. Default: false */
  showDecision?: boolean
  /** Whether to show critical value labels. Default: true */
  showCriticalLabels?: boolean
  /** Whether to show the p-value label. Default: true */
  showPValueLabel?: boolean
  /** Domain for rendering. Default: [mean - 4*stdDev, mean + 4*stdDev] */
  domain?: vec.Vector2
}

/** Normal PDF */
function normalPdf(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI))
  const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2)
  return coefficient * Math.exp(exponent)
}

/** Inverse standard normal CDF (Abramowitz & Stegun 26.2.23) */
function invNormCDF(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p === 0.5) return 0
  const sign = p < 0.5 ? -1 : 1
  const pp = p < 0.5 ? p : 1 - p
  const t = Math.sqrt(-2 * Math.log(pp))
  const c0 = 2.515517
  const c1 = 0.802853
  const c2 = 0.010328
  const d1 = 1.432788
  const d2 = 0.189269
  const d3 = 0.001308
  return sign * (t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t))
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const t = 1 / (1 + p * Math.abs(x))
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2)
  return 0.5 * (1 + sign * y)
}

export function HypothesisTest({
  mean = 0,
  stdDev = 1,
  alpha = 0.05,
  alternative,
  testStatistic,
  showRejectionRegion = true,
  showPValue = true,
  showCriticalValues = true,
  showTestStatistic = true,
  curveColor = Theme.blue,
  rejectionColor = Theme.red,
  rejectionOpacity = 0.2,
  pValueColor = Theme.yellow,
  pValueOpacity = 0.25,
  showAcceptanceRegion = false,
  acceptanceColor = Theme.green,
  acceptanceOpacity = 0.08,
  weight = 3,
  labelSize = 18,
  showDecision = false,
  showCriticalLabels = true,
  showPValueLabel = true,
  domain,
}: HypothesisTestProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const domMin = domain ? domain[0] : mean - 4 * stdDev
  const domMax = domain ? domain[1] : mean + 4 * stdDev

  // Compute critical values
  const criticals = React.useMemo(() => {
    if (alternative === "greater") {
      const zCrit = invNormCDF(1 - alpha)
      return { upper: mean + zCrit * stdDev, lower: null }
    } else if (alternative === "less") {
      const zCrit = invNormCDF(alpha)
      return { upper: null, lower: mean + zCrit * stdDev }
    } else {
      const zCrit = invNormCDF(1 - alpha / 2)
      return { upper: mean + zCrit * stdDev, lower: mean - zCrit * stdDev }
    }
  }, [alternative, alpha, mean, stdDev])

  // Sample bell curve
  const numSamples = 300
  const curvePath = React.useMemo(() => {
    const points: vec.Vector2[] = []
    const dx = (domMax - domMin) / numSamples
    for (let i = 0; i <= numSamples; i++) {
      const x = domMin + i * dx
      points.push([x, normalPdf(x, mean, stdDev)])
    }
    return points
  }, [domMin, domMax, mean, stdDev])

  const pxCurve = curvePath.map((p) => vec.transform(p, combinedTransform))
  const curveD =
    `M ${pxCurve[0][0]},${pxCurve[0][1]}` +
    pxCurve.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

  // Helper: build a shaded region path under the curve
  function buildRegionPath(from: number, to: number): string {
    const rFrom = Math.max(from, domMin)
    const rTo = Math.min(to, domMax)
    if (rFrom >= rTo) return ""
    const regionDx = (rTo - rFrom) / 100
    const pts: vec.Vector2[] = [[rFrom, 0]]
    for (let j = 0; j <= 100; j++) {
      const x = rFrom + j * regionDx
      pts.push([x, normalPdf(x, mean, stdDev)])
    }
    pts.push([rTo, 0])
    const pxPts = pts.map((p) => vec.transform(p, combinedTransform))
    return (
      `M ${pxPts[0][0]},${pxPts[0][1]}` +
      pxPts.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
      " Z"
    )
  }

  // Rejection regions
  const rejectionPaths: string[] = []
  if (showRejectionRegion) {
    if (criticals.upper !== null) {
      rejectionPaths.push(buildRegionPath(criticals.upper, domMax))
    }
    if (criticals.lower !== null) {
      rejectionPaths.push(buildRegionPath(domMin, criticals.lower))
    }
  }

  // Acceptance region
  const acceptancePath = showAcceptanceRegion
    ? buildRegionPath(
        criticals.lower ?? domMin,
        criticals.upper ?? domMax,
      )
    : ""

  // P-value region
  const pValuePaths: string[] = []
  if (showPValue && testStatistic !== undefined) {
    const tsX = mean + testStatistic * stdDev
    if (alternative === "greater") {
      pValuePaths.push(buildRegionPath(tsX, domMax))
    } else if (alternative === "less") {
      pValuePaths.push(buildRegionPath(domMin, tsX))
    } else {
      const absTsX = Math.abs(testStatistic) * stdDev
      pValuePaths.push(buildRegionPath(mean + absTsX, domMax))
      pValuePaths.push(buildRegionPath(domMin, mean - absTsX))
    }
  }

  // Compute p-value
  const pValue = React.useMemo(() => {
    if (testStatistic === undefined) return null
    const z = testStatistic
    if (alternative === "greater") return 1 - normCDF(z)
    if (alternative === "less") return normCDF(z)
    return 2 * (1 - normCDF(Math.abs(z)))
  }, [testStatistic, alternative])

  // Decision
  const decision =
    testStatistic !== undefined && pValue !== null
      ? pValue < alpha
        ? "Reject H₀"
        : "Fail to reject H₀"
      : null

  // Critical value line helper
  function renderCriticalLine(xVal: number, labelText: string) {
    const pxTop = vec.transform([xVal, normalPdf(xVal, mean, stdDev)] as vec.Vector2, combinedTransform)
    const pxBot = vec.transform([xVal, 0] as vec.Vector2, combinedTransform)
    const pxLabel = vec.transform([xVal, -0.02] as vec.Vector2, combinedTransform)
    return (
      <g key={`crit-${labelText}`}>
        <line
          x1={pxTop[0]}
          y1={pxTop[1]}
          x2={pxBot[0]}
          y2={pxBot[1]}
          stroke={rejectionColor}
          strokeWidth={2}
          strokeDasharray="6,4"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        {showCriticalLabels && (
          <text
            x={pxLabel[0]}
            y={pxLabel[1] + labelSize}
            fontSize={labelSize * 0.8}
            textAnchor="middle"
            dominantBaseline="auto"
            style={{ fill: rejectionColor }}
            className="mafs-shadow"
          >
            {labelText}
          </text>
        )}
      </g>
    )
  }

  // Test statistic position
  const tsX = testStatistic !== undefined ? mean + testStatistic * stdDev : null

  return (
    <g>
      {/* Acceptance region */}
      {acceptancePath && (
        <path d={acceptancePath} fill={acceptanceColor} fillOpacity={acceptanceOpacity} stroke="none" />
      )}

      {/* Rejection regions */}
      {rejectionPaths.map((d, i) => (
        <path key={`rej-${i}`} d={d} fill={rejectionColor} fillOpacity={rejectionOpacity} stroke="none" />
      ))}

      {/* P-value region */}
      {pValuePaths.map((d, i) => (
        <path key={`pval-${i}`} d={d} fill={pValueColor} fillOpacity={pValueOpacity} stroke="none" />
      ))}

      {/* Bell curve */}
      <path
        d={curveD}
        fill="none"
        stroke={curveColor}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Critical value lines */}
      {showCriticalValues && criticals.upper !== null &&
        renderCriticalLine(criticals.upper, `z = ${((criticals.upper - mean) / stdDev).toFixed(2)}`)}
      {showCriticalValues && criticals.lower !== null &&
        renderCriticalLine(criticals.lower, `z = ${((criticals.lower - mean) / stdDev).toFixed(2)}`)}

      {/* Test statistic marker */}
      {showTestStatistic && tsX !== null && (
        <>
          <line
            x1={vec.transform([tsX, normalPdf(tsX, mean, stdDev)] as vec.Vector2, combinedTransform)[0]}
            y1={vec.transform([tsX, normalPdf(tsX, mean, stdDev)] as vec.Vector2, combinedTransform)[1]}
            x2={vec.transform([tsX, 0] as vec.Vector2, combinedTransform)[0]}
            y2={vec.transform([tsX, 0] as vec.Vector2, combinedTransform)[1]}
            stroke={curveColor}
            strokeWidth={2.5}
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
          <circle
            cx={vec.transform([tsX, normalPdf(tsX, mean, stdDev)] as vec.Vector2, combinedTransform)[0]}
            cy={vec.transform([tsX, normalPdf(tsX, mean, stdDev)] as vec.Vector2, combinedTransform)[1]}
            r={5}
            style={{ fill: curveColor }}
          />
        </>
      )}

      {/* P-value label */}
      {showPValueLabel && pValue !== null && tsX !== null && (
        <text
          x={vec.transform([tsX, -0.05] as vec.Vector2, combinedTransform)[0]}
          y={vec.transform([tsX, -0.05] as vec.Vector2, combinedTransform)[1] + labelSize * 2.2}
          fontSize={labelSize * 0.8}
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ fill: pValueColor }}
          className="mafs-shadow"
        >
          p = {pValue.toFixed(4)}
        </text>
      )}

      {/* Decision label */}
      {showDecision && decision && (
        <text
          x={vec.transform([mean, normalPdf(mean, mean, stdDev) * 1.15] as vec.Vector2, combinedTransform)[0]}
          y={vec.transform([mean, normalPdf(mean, mean, stdDev) * 1.15] as vec.Vector2, combinedTransform)[1] - labelSize}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="auto"
          fontWeight="bold"
          style={{ fill: pValue! < alpha ? rejectionColor : acceptanceColor }}
          className="mafs-shadow"
        >
          {decision}
        </text>
      )}
    </g>
  )
}

HypothesisTest.displayName = "HypothesisTest"
