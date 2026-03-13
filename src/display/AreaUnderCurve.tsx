import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface RiemannSumsConfig {
  /** Number of rectangles */
  n: number
  /** Type of Riemann sum. Default: "left" */
  type?: "left" | "right" | "midpoint" | "trapezoid"
  /** Color of the rectangles. Default: Theme.green */
  color?: string
  /** Fill opacity. Default: 0.3 */
  opacity?: number
  /** Whether to show outlines on rectangles. Default: true */
  showOutlines?: boolean
}

export interface AreaUnderCurveProps {
  /** The function y = fn(x) */
  fn: (x: number) => number
  /** Left bound of the area */
  from: number
  /** Right bound of the area */
  to: number
  /** Fill color for the shaded area. Default: Theme.blue */
  color?: string
  /** Fill opacity. Default: 0.2 */
  opacity?: number
  /** Whether to show vertical bound lines. Default: true */
  showBounds?: boolean
  /** Color for the bound lines. Default: Theme.red */
  boundColor?: string
  /** Riemann sum rectangles configuration */
  riemannSums?: RiemannSumsConfig
  /** Label text (e.g., "∫₀³ x² dx = 9") */
  label?: string
  /** Font size for label. Default: 20 */
  labelSize?: number
  /** Stroke weight for bounds. Default: 2 */
  weight?: number
  /** Show comparison labels for exact area (numerical) vs Riemann estimate. Default: false */
  showAreaComparison?: boolean
}

export function AreaUnderCurve({
  fn,
  from,
  to,
  color = Theme.blue,
  opacity = 0.2,
  showBounds = true,
  boundColor = Theme.red,
  riemannSums,
  label,
  labelSize = 20,
  weight = 2,
  showAreaComparison = false,
}: AreaUnderCurveProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Sample the function for the filled area
  const numSamples = 200
  const dx = (to - from) / numSamples

  const areaPath = React.useMemo(() => {
    const pts: vec.Vector2[] = []
    // Start at bottom-left
    pts.push([from, 0])
    // Trace the curve
    for (let i = 0; i <= numSamples; i++) {
      const x = from + i * dx
      pts.push([x, fn(x)])
    }
    // Close at bottom-right
    pts.push([to, 0])
    return pts
  }, [fn, from, to, dx, numSamples])

  // Transform area path to pixel space
  const pxAreaPath = areaPath.map((p) => vec.transform(p, combinedTransform))
  const areaD =
    `M ${pxAreaPath[0][0]},${pxAreaPath[0][1]}` +
    pxAreaPath.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
    " Z"

  // Bound lines
  const pxFromTop = vec.transform([from, fn(from)] as vec.Vector2, combinedTransform)
  const pxFromBot = vec.transform([from, 0] as vec.Vector2, combinedTransform)
  const pxToTop = vec.transform([to, fn(to)] as vec.Vector2, combinedTransform)
  const pxToBot = vec.transform([to, 0] as vec.Vector2, combinedTransform)

  // Riemann sum rectangles
  const riemannRects = React.useMemo(() => {
    if (!riemannSums) return []

    const { n, type = "left" } = riemannSums
    const rectWidth = (to - from) / n
    const rects: { x: number; width: number; height: number; y: number }[] = []

    for (let i = 0; i < n; i++) {
      const xLeft = from + i * rectWidth
      const xRight = xLeft + rectWidth

      let h: number
      if (type === "left") {
        h = fn(xLeft)
      } else if (type === "right") {
        h = fn(xRight)
      } else if (type === "midpoint") {
        h = fn((xLeft + xRight) / 2)
      } else {
        // Trapezoid — we'll render as a trapezoid shape
        h = 0 // handled separately
      }

      if (type === "trapezoid") {
        rects.push({ x: xLeft, width: rectWidth, height: fn(xLeft), y: fn(xRight) })
      } else {
        rects.push({ x: xLeft, width: rectWidth, height: h, y: h })
      }
    }

    return rects
  }, [riemannSums, fn, from, to])

  const rColor = riemannSums?.color ?? Theme.green
  const rOpacity = riemannSums?.opacity ?? 0.3
  const rOutlines = riemannSums?.showOutlines ?? true
  const rType = riemannSums?.type ?? "left"

  // Compute exact area (high-precision trapezoidal rule) and Riemann estimate
  const areaValues = React.useMemo(() => {
    if (!showAreaComparison) return null

    // Exact area via trapezoidal rule with many steps
    const steps = 2000
    const exactDx = (to - from) / steps
    let exactSum = 0
    for (let i = 0; i < steps; i++) {
      const x0 = from + i * exactDx
      const x1 = x0 + exactDx
      exactSum += (fn(x0) + fn(x1)) / 2 * exactDx
    }

    // Riemann estimate
    let estimate = 0
    if (riemannSums) {
      const { n, type = "left" } = riemannSums
      const rectW = (to - from) / n
      for (let i = 0; i < n; i++) {
        const xL = from + i * rectW
        const xR = xL + rectW
        if (type === "left") estimate += fn(xL) * rectW
        else if (type === "right") estimate += fn(xR) * rectW
        else if (type === "midpoint") estimate += fn((xL + xR) / 2) * rectW
        else estimate += (fn(xL) + fn(xR)) / 2 * rectW
      }
    }

    return { exact: exactSum, estimate }
  }, [showAreaComparison, fn, from, to, riemannSums])

  // Label position: centered above the shaded area
  const labelX = (from + to) / 2
  const labelY = React.useMemo(() => {
    let maxY = 0
    for (let i = 0; i <= 20; i++) {
      const x = from + (to - from) * (i / 20)
      maxY = Math.max(maxY, fn(x))
    }
    return maxY + 0.5
  }, [fn, from, to])
  const pxLabelPos = vec.transform([labelX, labelY] as vec.Vector2, combinedTransform)

  return (
    <g>
      {/* Shaded area under curve */}
      <path
        d={areaD}
        fill={color}
        fillOpacity={opacity}
        stroke="none"
      />

      {/* Riemann sum rectangles */}
      {riemannRects.map((rect, i) => {
        if (rType === "trapezoid") {
          // Draw trapezoid
          const bl: vec.Vector2 = [rect.x, 0]
          const tl: vec.Vector2 = [rect.x, rect.height] // left height = fn(xLeft)
          const tr: vec.Vector2 = [rect.x + rect.width, rect.y] // right height = fn(xRight)
          const br: vec.Vector2 = [rect.x + rect.width, 0]

          const pxBl = vec.transform(bl, combinedTransform)
          const pxTl = vec.transform(tl, combinedTransform)
          const pxTr = vec.transform(tr, combinedTransform)
          const pxBr = vec.transform(br, combinedTransform)

          return (
            <polygon
              key={`riemann-${i}`}
              points={`${pxBl[0]},${pxBl[1]} ${pxTl[0]},${pxTl[1]} ${pxTr[0]},${pxTr[1]} ${pxBr[0]},${pxBr[1]}`}
              fill={rColor}
              fillOpacity={rOpacity}
              stroke={rOutlines ? rColor : "none"}
              strokeWidth={rOutlines ? 1 : 0}
              strokeOpacity={0.8}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
          )
        }

        // Regular rectangle
        const bl: vec.Vector2 = [rect.x, 0]
        const tl: vec.Vector2 = [rect.x, rect.height]
        const tr: vec.Vector2 = [rect.x + rect.width, rect.height]
        const br: vec.Vector2 = [rect.x + rect.width, 0]

        const pxBl = vec.transform(bl, combinedTransform)
        const pxTl = vec.transform(tl, combinedTransform)
        const pxTr = vec.transform(tr, combinedTransform)
        const pxBr = vec.transform(br, combinedTransform)

        return (
          <polygon
            key={`riemann-${i}`}
            points={`${pxBl[0]},${pxBl[1]} ${pxTl[0]},${pxTl[1]} ${pxTr[0]},${pxTr[1]} ${pxBr[0]},${pxBr[1]}`}
            fill={rColor}
            fillOpacity={rOpacity}
            stroke={rOutlines ? rColor : "none"}
            strokeWidth={rOutlines ? 1 : 0}
            strokeOpacity={0.8}
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {/* Bound lines */}
      {showBounds && (
        <>
          <line
            x1={pxFromTop[0]}
            y1={pxFromTop[1]}
            x2={pxFromBot[0]}
            y2={pxFromBot[1]}
            stroke={boundColor}
            strokeWidth={weight}
            strokeDasharray="var(--mafs-line-stroke-dash-style)"
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
          <line
            x1={pxToTop[0]}
            y1={pxToTop[1]}
            x2={pxToBot[0]}
            y2={pxToBot[1]}
            stroke={boundColor}
            strokeWidth={weight}
            strokeDasharray="var(--mafs-line-stroke-dash-style)"
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        </>
      )}

      {/* Label */}
      {label && (
        <text
          x={pxLabelPos[0]}
          y={pxLabelPos[1]}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ fill: color }}
          className="mafs-shadow"
        >
          {label}
        </text>
      )}

      {/* Area comparison labels */}
      {areaValues && (
        <g>
          <text
            x={pxLabelPos[0]}
            y={pxLabelPos[1] + (label ? labelSize * 1.3 : 0)}
            fontSize={labelSize * 0.85}
            textAnchor="middle"
            dominantBaseline="auto"
            style={{ fill: color }}
            className="mafs-shadow"
          >
            Exact: {areaValues.exact.toFixed(3)}
          </text>
          {riemannSums && (
            <text
              x={pxLabelPos[0]}
              y={pxLabelPos[1] + (label ? labelSize * 1.3 : 0) + labelSize * 1.1}
              fontSize={labelSize * 0.85}
              textAnchor="middle"
              dominantBaseline="auto"
              style={{ fill: rColor }}
              className="mafs-shadow"
            >
              Estimate: {areaValues.estimate.toFixed(3)}
            </text>
          )}
        </g>
      )}
    </g>
  )
}

AreaUnderCurve.displayName = "AreaUnderCurve"
