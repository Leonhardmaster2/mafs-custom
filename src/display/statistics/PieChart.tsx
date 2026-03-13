import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface PieChartSlice {
  /** Label for this slice */
  label: string
  /** Numeric value */
  value: number
  /** Color for this slice */
  color?: string
}

export interface PieChartProps {
  /** Array of data slices */
  data: PieChartSlice[]
  /** Center of the pie chart in world coordinates. Default: [0, 0] */
  center?: vec.Vector2
  /** Outer radius in world units. Default: 3 */
  radius?: number
  /** Inner radius for donut chart (0 = full pie). Default: 0 */
  innerRadius?: number
  /** Whether to show labels with percentages. Default: true */
  showLabels?: boolean
  /** Whether to show raw values. Default: false */
  showValues?: boolean
  /** Label position. Default: "outside" */
  labelPosition?: "inside" | "outside" | "callout"
  /** Start angle offset in radians. Default: 0 */
  startAngle?: number
  /** Fill opacity. Default: 0.8 */
  opacity?: number
  /** Font size for labels. Default: 16 */
  labelSize?: number
  /** Stroke weight between slices. Default: 2 */
  weight?: number
  /** Center label for donut charts (e.g., total) */
  centerLabel?: string
}

export function PieChart({
  data,
  center = [0, 0],
  radius = 3,
  innerRadius = 0,
  showLabels = true,
  showValues = false,
  labelPosition = "outside",
  startAngle = 0,
  opacity = 0.8,
  labelSize = 16,
  weight = 2,
  centerLabel,
}: PieChartProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const defaultColors = [
    Theme.blue,
    Theme.red,
    Theme.green,
    Theme.yellow,
    Theme.violet,
    Theme.orange,
    Theme.pink,
    Theme.indigo,
  ]

  const total = React.useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  )

  if (total === 0 || data.length === 0) return null

  // Compute slices
  const slices = React.useMemo(() => {
    let currentAngle = startAngle
    return data.map((slice, i) => {
      const sweepAngle = (slice.value / total) * 2 * Math.PI
      const start = currentAngle
      const end = currentAngle + sweepAngle
      currentAngle = end
      return {
        ...slice,
        startAngle: start,
        endAngle: end,
        sweepAngle,
        color: slice.color ?? defaultColors[i % defaultColors.length],
        percentage: ((slice.value / total) * 100).toFixed(1),
      }
    })
  }, [data, total, startAngle, defaultColors])

  // Build SVG arc path
  function arcPath(
    cx: number,
    cy: number,
    r: number,
    startA: number,
    endA: number,
  ): string {
    const numSegs = Math.max(8, Math.ceil(Math.abs(endA - startA) / 0.1))
    const pts: string[] = []
    for (let i = 0; i <= numSegs; i++) {
      const t = i / numSegs
      const angle = startA + (endA - startA) * t
      const wx = cx + Math.cos(angle) * r
      const wy = cy + Math.sin(angle) * r
      const px = vec.transform([wx, wy] as vec.Vector2, combinedTransform)
      pts.push(`${px[0]},${px[1]}`)
    }
    return pts.join(" L ")
  }

  const pxCenter = vec.transform(center, combinedTransform)

  return (
    <g>
      {slices.map((slice, i) => {
        const isDonut = innerRadius > 0

        // Outer arc points
        const outerPath = arcPath(
          center[0],
          center[1],
          radius,
          slice.startAngle,
          slice.endAngle,
        )

        let d: string
        if (isDonut) {
          // Inner arc (reverse direction)
          const innerPath = arcPath(
            center[0],
            center[1],
            innerRadius,
            slice.endAngle,
            slice.startAngle,
          )
          d = `M ${outerPath} L ${innerPath} Z`
        } else {
          // Pie slice: center → outer arc → center
          d = `M ${pxCenter[0]},${pxCenter[1]} L ${outerPath} Z`
        }

        // Label position
        const midAngle = (slice.startAngle + slice.endAngle) / 2
        let labelR: number
        if (labelPosition === "inside") {
          labelR = isDonut ? (radius + innerRadius) / 2 : radius * 0.6
        } else {
          labelR = radius + radius * 0.15
        }

        const labelWorld: vec.Vector2 = [
          center[0] + Math.cos(midAngle) * labelR,
          center[1] + Math.sin(midAngle) * labelR,
        ]
        const pxLabel = vec.transform(labelWorld, combinedTransform)

        // Callout line
        const calloutStart: vec.Vector2 = [
          center[0] + Math.cos(midAngle) * (radius + 0.05),
          center[1] + Math.sin(midAngle) * (radius + 0.05),
        ]
        const calloutEnd: vec.Vector2 = [
          center[0] + Math.cos(midAngle) * (radius + radius * 0.3),
          center[1] + Math.sin(midAngle) * (radius + radius * 0.3),
        ]
        const pxCalloutStart = vec.transform(calloutStart, combinedTransform)
        const pxCalloutEnd = vec.transform(calloutEnd, combinedTransform)

        // Text anchor based on angle
        const isRight = Math.cos(midAngle) >= 0
        const anchor =
          labelPosition === "inside"
            ? "middle"
            : isRight
              ? "start"
              : "end"

        const labelText = [
          slice.label,
          showValues ? `${slice.value}` : null,
          `${slice.percentage}%`,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <g key={`slice-${i}`}>
            <path
              d={d}
              fill={slice.color}
              fillOpacity={opacity}
              stroke="var(--mafs-bg)"
              strokeWidth={weight}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />

            {showLabels && (
              <>
                {labelPosition === "callout" && (
                  <line
                    x1={pxCalloutStart[0]}
                    y1={pxCalloutStart[1]}
                    x2={pxCalloutEnd[0]}
                    y2={pxCalloutEnd[1]}
                    stroke={slice.color}
                    strokeWidth={1}
                    opacity={0.6}
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                )}
                <text
                  x={
                    labelPosition === "callout"
                      ? pxCalloutEnd[0] + (isRight ? 4 : -4)
                      : pxLabel[0]
                  }
                  y={
                    labelPosition === "callout" ? pxCalloutEnd[1] : pxLabel[1]
                  }
                  fontSize={labelSize * (labelPosition === "inside" ? 0.75 : 0.85)}
                  textAnchor={labelPosition === "callout" ? (isRight ? "start" : "end") : anchor}
                  dominantBaseline="middle"
                  style={{
                    fill:
                      labelPosition === "inside"
                        ? "var(--mafs-bg)"
                        : slice.color,
                  }}
                  className="mafs-shadow"
                >
                  {labelText}
                </text>
              </>
            )}
          </g>
        )
      })}

      {/* Center label for donut */}
      {centerLabel && innerRadius > 0 && (
        <text
          x={pxCenter[0]}
          y={pxCenter[1]}
          fontSize={labelSize * 1.2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: Theme.foreground, fontWeight: "bold" }}
          className="mafs-shadow"
        >
          {centerLabel}
        </text>
      )}
    </g>
  )
}

PieChart.displayName = "PieChart"
