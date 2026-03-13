import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface FiveNumberSummary {
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export interface BoxPlotProps {
  /** Raw data array, or a pre-computed five-number summary */
  data: number[] | FiveNumberSummary
  /** Vertical center of the box plot in world units */
  y?: number
  /** Height of the box in world units */
  height?: number
  /** Color for the box and whiskers */
  color?: string
  /** Fill opacity of the box */
  fillOpacity?: number
  /** Stroke weight */
  weight?: number
  /** Whether to show value labels */
  showLabels?: boolean
  /** Font size for labels (pixels) */
  labelSize?: number
  /** Color for labels */
  labelColor?: string
  /** Where to place labels: "below" the box or "above" it */
  labelPosition?: "below" | "above"
  /** Whether to show a number line axis. Defaults to true. */
  showAxis?: boolean
  /** Color for the number line axis */
  axisColor?: string
}

function computeQuartile(sorted: number[], lower: number, upper: number): number {
  const n = upper - lower
  const mid = lower + Math.floor(n / 2)
  if (n % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function computeFiveNumberSummary(data: number[]): FiveNumberSummary {
  const sorted = [...data].sort((a, b) => a - b)
  const n = sorted.length

  const min = sorted[0]
  const max = sorted[n - 1]

  const mid = Math.floor(n / 2)
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

  const q1 = computeQuartile(sorted, 0, mid)
  const q3 = computeQuartile(sorted, n % 2 === 0 ? mid : mid + 1, n)

  return { min, q1, median, q3, max }
}

function isFiveNumberSummary(data: number[] | FiveNumberSummary): data is FiveNumberSummary {
  return !Array.isArray(data) && "min" in data && "q1" in data
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * Given an array of label items with x-positions (in pixel space),
 * compute staggered y-offsets to avoid overlapping.
 * Labels that are too close horizontally get pushed to alternating rows.
 */
function staggerLabels(
  items: { pxX: number; label: string }[],
  fontSize: number,
): { pxX: number; label: string; row: number }[] {
  // Estimate pixel width per character (monospace approx)
  const charWidth = fontSize * 0.55
  const minGap = 8 // minimum px gap between labels

  const result: { pxX: number; label: string; row: number }[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const itemWidth = item.label.length * charWidth

    // Check overlap with all previously placed items in same row
    let row = 0
    let placed = false
    while (!placed) {
      const conflicts = result.filter((r) => r.row === row)
      const hasOverlap = conflicts.some((prev) => {
        const prevWidth = prev.label.length * charWidth
        const dist = Math.abs(item.pxX - prev.pxX)
        return dist < (itemWidth + prevWidth) / 2 + minGap
      })
      if (!hasOverlap) {
        placed = true
      } else {
        row++
      }
    }
    result.push({ ...item, row })
  }

  return result
}

export function BoxPlot({
  data,
  y = 0,
  height = 0.8,
  color = Theme.blue,
  fillOpacity = 0.2,
  weight = 2,
  showLabels = true,
  labelSize = 18,
  labelColor = Theme.foreground,
  labelPosition = "below",
  showAxis = true,
  axisColor,
}: BoxPlotProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const summary = isFiveNumberSummary(data) ? data : computeFiveNumberSummary(data)

  const halfHeight = height / 2
  const yTop = y + halfHeight
  const yBot = y - halfHeight

  // Whisker cap half-height (60% of box half-height)
  const capHalf = halfHeight * 0.6

  // Key world-space points
  const q1Top: vec.Vector2 = [summary.q1, yTop]
  const q1Bot: vec.Vector2 = [summary.q1, yBot]
  const q3Top: vec.Vector2 = [summary.q3, yTop]
  const q3Bot: vec.Vector2 = [summary.q3, yBot]
  const medTop: vec.Vector2 = [summary.median, yTop]
  const medBot: vec.Vector2 = [summary.median, yBot]

  // Whisker lines (horizontal, at center y)
  const minPt: vec.Vector2 = [summary.min, y]
  const maxPt: vec.Vector2 = [summary.max, y]
  const q1Mid: vec.Vector2 = [summary.q1, y]
  const q3Mid: vec.Vector2 = [summary.q3, y]

  // Whisker caps (vertical tick marks)
  const minCapTop: vec.Vector2 = [summary.min, y + capHalf]
  const minCapBot: vec.Vector2 = [summary.min, y - capHalf]
  const maxCapTop: vec.Vector2 = [summary.max, y + capHalf]
  const maxCapBot: vec.Vector2 = [summary.max, y - capHalf]

  // Transform all to pixel space
  const px = {
    q1Top: vec.transform(q1Top, combinedTransform),
    q1Bot: vec.transform(q1Bot, combinedTransform),
    q3Top: vec.transform(q3Top, combinedTransform),
    q3Bot: vec.transform(q3Bot, combinedTransform),
    medTop: vec.transform(medTop, combinedTransform),
    medBot: vec.transform(medBot, combinedTransform),
    min: vec.transform(minPt, combinedTransform),
    max: vec.transform(maxPt, combinedTransform),
    q1Mid: vec.transform(q1Mid, combinedTransform),
    q3Mid: vec.transform(q3Mid, combinedTransform),
    minCapTop: vec.transform(minCapTop, combinedTransform),
    minCapBot: vec.transform(minCapBot, combinedTransform),
    maxCapTop: vec.transform(maxCapTop, combinedTransform),
    maxCapBot: vec.transform(maxCapBot, combinedTransform),
  }

  // Label computation with stagger to avoid overlaps
  const labelItems = [
    { pxX: px.min[0], label: formatNum(summary.min) },
    { pxX: px.q1Mid[0], label: `Q1=${formatNum(summary.q1)}` },
    { pxX: vec.transform([summary.median, 0], combinedTransform)[0], label: `Med=${formatNum(summary.median)}` },
    { pxX: px.q3Mid[0], label: `Q3=${formatNum(summary.q3)}` },
    { pxX: px.max[0], label: formatNum(summary.max) },
  ]

  const staggered = staggerLabels(labelItems, labelSize)
  const rowSpacing = labelSize * 1.3

  // Base label Y position (pixel space)
  const labelAnchorWorld: vec.Vector2 = labelPosition === "below"
    ? [0, yBot - 0.15]
    : [0, yTop + 0.15]
  const labelBaseY = vec.transform(labelAnchorWorld, combinedTransform)[1]

  // For "above", labels go upward (negative offset); for "below", downward
  const labelDir = labelPosition === "below" ? 1 : -1

  return (
    <g>
      {/* Box (Q1 to Q3) */}
      <polygon
        points={[px.q1Top, px.q3Top, px.q3Bot, px.q1Bot]
          .map((p) => `${p[0]},${p[1]}`)
          .join(" ")}
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={weight}
        strokeOpacity={1}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Median line */}
      <line
        x1={px.medTop[0]}
        y1={px.medTop[1]}
        x2={px.medBot[0]}
        y2={px.medBot[1]}
        stroke={color}
        strokeWidth={weight + 1}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Left whisker (min to Q1) */}
      <line
        x1={px.min[0]}
        y1={px.min[1]}
        x2={px.q1Mid[0]}
        y2={px.q1Mid[1]}
        stroke={color}
        strokeWidth={weight}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Right whisker (Q3 to max) */}
      <line
        x1={px.q3Mid[0]}
        y1={px.q3Mid[1]}
        x2={px.max[0]}
        y2={px.max[1]}
        stroke={color}
        strokeWidth={weight}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Min whisker cap */}
      <line
        x1={px.minCapTop[0]}
        y1={px.minCapTop[1]}
        x2={px.minCapBot[0]}
        y2={px.minCapBot[1]}
        stroke={color}
        strokeWidth={weight}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Max whisker cap */}
      <line
        x1={px.maxCapTop[0]}
        y1={px.maxCapTop[1]}
        x2={px.maxCapBot[0]}
        y2={px.maxCapBot[1]}
        stroke={color}
        strokeWidth={weight}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Number line axis */}
      {showAxis &&
        (() => {
          const axisStroke = axisColor || labelColor
          // Compute nice tick step based on data range and pixel space
          const range = summary.max - summary.min
          const pxPerUnit = Math.abs(
            vec.transform([1, 0], combinedTransform)[0] -
            vec.transform([0, 0], combinedTransform)[0]
          )
          // Minimum pixel spacing between ticks (~40px)
          const minTickSpacingPx = 40
          const minStep = minTickSpacingPx / pxPerUnit

          // Pick a "nice" step: 1, 2, 5, 10, 20, 50, 100, ...
          function niceStep(min: number): number {
            const magnitude = Math.pow(10, Math.floor(Math.log10(min)))
            const residual = min / magnitude
            if (residual <= 1) return magnitude
            if (residual <= 2) return 2 * magnitude
            if (residual <= 5) return 5 * magnitude
            return 10 * magnitude
          }

          const step = range <= 0 ? 1 : niceStep(Math.max(minStep, range / 20))

          const tickMin = Math.floor(summary.min / step) * step
          const tickMax = Math.ceil(summary.max / step) * step
          // Extend the axis line slightly beyond the data range
          const axisPadding = step * 0.5
          const axisLeftWorld: vec.Vector2 = [tickMin - axisPadding, y]
          const axisRightWorld: vec.Vector2 = [tickMax + axisPadding, y]
          const axisLeftPx = vec.transform(axisLeftWorld, combinedTransform)
          const axisRightPx = vec.transform(axisRightWorld, combinedTransform)

          // Y position for the axis: below the box
          const axisWorldY = yBot - halfHeight * 0.4
          const axisPx = vec.transform([0, axisWorldY], combinedTransform)
          const axisY = axisPx[1]
          const tickHalfPx = 4

          // Generate ticks at nice intervals
          const ticks: number[] = []
          for (let t = tickMin; t <= tickMax + step * 0.01; t += step) {
            ticks.push(Math.round(t * 1e6) / 1e6)
          }

          return (
            <g>
              {/* Axis line */}
              <line
                x1={axisLeftPx[0]}
                y1={axisY}
                x2={axisRightPx[0]}
                y2={axisY}
                stroke={axisStroke}
                strokeWidth={1}
                opacity={0.5}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              {/* Tick marks and labels */}
              {ticks.map((t) => {
                const tickPx = vec.transform([t, axisWorldY], combinedTransform)
                return (
                  <g key={`tick-${t}`}>
                    <line
                      x1={tickPx[0]}
                      y1={axisY - tickHalfPx}
                      x2={tickPx[0]}
                      y2={axisY + tickHalfPx}
                      stroke={axisStroke}
                      strokeWidth={1}
                      opacity={0.5}
                      style={{ vectorEffect: "non-scaling-stroke" }}
                    />
                    <text
                      x={tickPx[0]}
                      y={axisY + tickHalfPx + 4}
                      fontSize={labelSize * 0.7}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      style={{ fill: axisStroke }}
                      opacity={0.6}
                    >
                      {t}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })()}

      {/* Labels with leader lines */}
      {showLabels &&
        staggered.map((item, i) => {
          const labelY = labelBaseY + item.row * rowSpacing * labelDir

          // Draw a small leader line from the box to the label when staggered
          const tickTopY = labelPosition === "below" ? px.q1Bot[1] : px.q1Top[1]
          const showLeader = item.row > 0

          return (
            <g key={`label-${i}`}>
              {showLeader && (
                <line
                  x1={item.pxX}
                  y1={tickTopY}
                  x2={item.pxX}
                  y2={labelY - labelDir * (labelSize * 0.4)}
                  stroke={labelColor}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                  opacity={0.4}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
              )}
              <text
                x={item.pxX}
                y={labelY}
                fontSize={labelSize}
                textAnchor="middle"
                dominantBaseline={labelPosition === "below" ? "hanging" : "auto"}
                style={{ fill: labelColor }}
                className="mafs-shadow"
              >
                {item.label}
              </text>
            </g>
          )
        })}
    </g>
  )
}

BoxPlot.displayName = "BoxPlot"
