import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface TaylorSeriesProps {
  /** The function to approximate */
  fn: (x: number) => number
  /** The center of expansion (a). Default: 0 (Maclaurin series) */
  center?: number
  /** Maximum order of the polynomial to display */
  order: number
  /** Whether to show the original function curve. Default: true */
  showOriginal?: boolean
  /** Whether to show the error region between f(x) and T_n(x). Default: false */
  showError?: boolean
  /** Domain for rendering [xMin, xMax]. Default: derived from center ± 5 */
  domain?: vec.Vector2
  /** Color of the original function. Default: Theme.foreground */
  originalColor?: string
  /** Color of the Taylor approximation. Default: Theme.blue */
  approximationColor?: string
  /** Color of the error shading. Default: Theme.red */
  errorColor?: string
  /** Fill opacity of the error shading. Default: 0.15 */
  errorOpacity?: number
  /** Whether to show the "n = order" label. Default: true */
  showOrderLabel?: boolean
  /** Whether to show a point at the expansion center. Default: true */
  showCenter?: boolean
  /** Color of the center point. Default: Theme.green */
  centerColor?: string
  /** Step size for numerical derivatives. Default: 0.0001 */
  dx?: number
  /** Number of sample points for rendering. Default: 300 */
  numSamples?: number
  /** Stroke weight. Default: 2.5 */
  weight?: number
  /** Font size for the order label in pixels. Default: 18 */
  labelSize?: number
  /** Optional array of analytical derivatives [f'(center), f''(center), ...].
   *  If provided, these are used instead of numerical computation. */
  derivatives?: number[]
}

/**
 * Compute the kth derivative of fn at x using central differences.
 * For k=0: fn(x)
 * For k=1: (fn(x+h) - fn(x-h)) / (2h)
 * For higher k: binomial coefficient formula for central differences.
 */
function numericalDerivative(fn: (x: number) => number, x: number, k: number, h: number): number {
  if (k === 0) return fn(x)

  // Use the central difference formula with binomial coefficients:
  // f^(k)(x) ≈ (1/h^k) * sum_{i=0}^{k} (-1)^i * C(k,i) * f(x + (k/2 - i)*h)
  let sum = 0
  for (let i = 0; i <= k; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const coeff = binomial(k, i)
    const xi = x + (k / 2 - i) * h
    sum += sign * coeff * fn(xi)
  }
  return sum / Math.pow(h, k)
}

function binomial(n: number, k: number): number {
  if (k === 0 || k === n) return 1
  if (k === 1 || k === n - 1) return n
  let result = 1
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1)
  }
  return Math.round(result)
}

function factorial(n: number): number {
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

export function TaylorSeries({
  fn,
  center = 0,
  order,
  showOriginal = true,
  showError = false,
  domain,
  originalColor = Theme.foreground,
  approximationColor = Theme.blue,
  errorColor = Theme.red,
  errorOpacity = 0.15,
  showOrderLabel = true,
  showCenter = true,
  centerColor = Theme.green,
  dx = 0.0001,
  numSamples = 300,
  weight = 2.5,
  labelSize = 18,
  derivatives,
}: TaylorSeriesProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const domMin = domain ? domain[0] : center - 5
  const domMax = domain ? domain[1] : center + 5

  // Compute Taylor coefficients: c_k = f^(k)(center) / k!
  const coefficients = React.useMemo(() => {
    const coeffs: number[] = []
    for (let k = 0; k <= order; k++) {
      if (derivatives && k > 0 && k <= derivatives.length) {
        coeffs.push(derivatives[k - 1] / factorial(k))
      } else {
        coeffs.push(numericalDerivative(fn, center, k, dx) / factorial(k))
      }
    }
    return coeffs
  }, [fn, center, order, dx, derivatives])

  // Taylor polynomial evaluation
  const taylor = React.useCallback(
    (x: number) => {
      let sum = 0
      let power = 1
      const diff = x - center
      for (let k = 0; k <= order; k++) {
        sum += coefficients[k] * power
        power *= diff
      }
      return sum
    },
    [coefficients, center, order],
  )

  // Sample curves
  const sampleDx = (domMax - domMin) / numSamples

  const originalPath = React.useMemo(() => {
    const pts: vec.Vector2[] = []
    for (let i = 0; i <= numSamples; i++) {
      const x = domMin + i * sampleDx
      const y = fn(x)
      if (isFinite(y)) pts.push([x, y])
    }
    return pts
  }, [fn, domMin, domMax, sampleDx, numSamples])

  const taylorPath = React.useMemo(() => {
    const pts: vec.Vector2[] = []
    for (let i = 0; i <= numSamples; i++) {
      const x = domMin + i * sampleDx
      const y = taylor(x)
      if (isFinite(y)) pts.push([x, y])
    }
    return pts
  }, [taylor, domMin, domMax, sampleDx, numSamples])

  // Build SVG path strings
  function buildPathD(pts: vec.Vector2[]): string {
    if (pts.length === 0) return ""
    const pxPts = pts.map((p) => vec.transform(p, combinedTransform))
    return (
      `M ${pxPts[0][0]},${pxPts[0][1]}` +
      pxPts.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")
    )
  }

  // Error region path (closed)
  const errorD = React.useMemo(() => {
    if (!showError) return ""
    const n = Math.min(numSamples, 200)
    const step = (domMax - domMin) / n
    const topPts: vec.Vector2[] = []
    const botPts: vec.Vector2[] = []
    for (let i = 0; i <= n; i++) {
      const x = domMin + i * step
      const yOrig = fn(x)
      const yTaylor = taylor(x)
      if (isFinite(yOrig) && isFinite(yTaylor)) {
        topPts.push([x, yTaylor])
        botPts.push([x, yOrig])
      }
    }
    if (topPts.length === 0) return ""
    const pxTop = topPts.map((p) => vec.transform(p, combinedTransform))
    const pxBot = botPts.map((p) => vec.transform(p, combinedTransform))
    return (
      `M ${pxTop[0][0]},${pxTop[0][1]}` +
      pxTop.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
      pxBot
        .reverse()
        .map((p) => ` L ${p[0]},${p[1]}`)
        .join("") +
      " Z"
    )
  }, [showError, fn, taylor, domMin, domMax, numSamples, combinedTransform])

  // Center point pixel position
  const centerY = fn(center)
  const pxCenter = vec.transform([center, centerY] as vec.Vector2, combinedTransform)

  // Label position
  const pxLabel = vec.transform(
    [center + 0.3, centerY + 0.5] as vec.Vector2,
    combinedTransform,
  )

  return (
    <g>
      {/* Error region */}
      {showError && errorD && (
        <path d={errorD} fill={errorColor} fillOpacity={errorOpacity} stroke="none" />
      )}

      {/* Original function */}
      {showOriginal && (
        <path
          d={buildPathD(originalPath)}
          fill="none"
          stroke={originalColor}
          strokeWidth={weight}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}

      {/* Taylor approximation */}
      <path
        d={buildPathD(taylorPath)}
        fill="none"
        stroke={approximationColor}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Center point */}
      {showCenter && isFinite(centerY) && (
        <circle cx={pxCenter[0]} cy={pxCenter[1]} r={6} style={{ fill: centerColor }} />
      )}

      {/* Order label */}
      {showOrderLabel && (
        <text
          x={pxLabel[0]}
          y={pxLabel[1]}
          fontSize={labelSize}
          textAnchor="start"
          dominantBaseline="auto"
          style={{ fill: approximationColor }}
          className="mafs-shadow"
        >
          n = {order}
        </text>
      )}
    </g>
  )
}

TaylorSeries.displayName = "TaylorSeries"
