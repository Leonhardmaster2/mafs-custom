import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface BarChartItem {
  /** Category label */
  label: string
  /** Value */
  value: number
}

export interface BarChartGroup {
  /** Group label */
  label: string
  /** Values for each bar in the group */
  values: number[]
  /** Colors for each bar in the group */
  colors?: string[]
}

export interface BarChartProps {
  /** Simple data items */
  data?: BarChartItem[]
  /** Grouped data */
  groups?: BarChartGroup[]
  /** Orientation. Default: "vertical" */
  orientation?: "vertical" | "horizontal"
  /** Relative bar width (0-1). Default: 0.6 */
  barWidth?: number
  /** Gap between bars in world units. Default: 0.3 */
  gap?: number
  /** Whether to show value labels. Default: true */
  showValueLabels?: boolean
  /** Default bar color. Default: Theme.blue */
  color?: string
  /** Fill opacity. Default: 0.7 */
  opacity?: number
  /** Font size for labels. Default: 16 */
  labelSize?: number
  /** Label color. Default: Theme.foreground */
  labelColor?: string
  /** Stroke weight. Default: 1.5 */
  weight?: number
}

export function BarChart({
  data,
  groups,
  orientation = "vertical",
  barWidth = 0.6,
  gap = 0.3,
  showValueLabels = true,
  color = Theme.blue,
  opacity = 0.7,
  labelSize = 16,
  labelColor = Theme.foreground,
  weight = 1.5,
}: BarChartProps) {
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

  // Normalize data to a common format
  const bars = React.useMemo(() => {
    if (data) {
      return data.map((item, i) => ({
        label: item.label,
        values: [item.value],
        colors: [color],
        index: i,
      }))
    }
    if (groups) {
      return groups.map((group, i) => ({
        label: group.label,
        values: group.values,
        colors:
          group.colors ??
          group.values.map((_, j) => defaultColors[j % defaultColors.length]),
        index: i,
      }))
    }
    return []
  }, [data, groups, color, defaultColors])

  if (bars.length === 0) return null

  const isVertical = orientation === "vertical"

  // Each bar group is centered on integer positions: 1, 2, 3, ...
  // This makes viewBox setup intuitive (e.g., x: [0, n+1])
  return (
    <g>
      {bars.map((bar, bi) => {
        const groupCenter = bi + 1 // integer positions: 1, 2, 3, ...
        const numBars = bar.values.length
        const subBarWidth = barWidth / numBars

        return (
          <g key={`bar-group-${bi}`}>
            {bar.values.map((val, vi) => {
              const subOffset =
                numBars > 1
                  ? (vi - (numBars - 1) / 2) * subBarWidth
                  : 0
              const barCenter = groupCenter + subOffset
              const barHalf = subBarWidth / 2

              let bl: vec.Vector2, tl: vec.Vector2, tr: vec.Vector2, br: vec.Vector2

              if (isVertical) {
                bl = [barCenter - barHalf, 0]
                tl = [barCenter - barHalf, val]
                tr = [barCenter + barHalf, val]
                br = [barCenter + barHalf, 0]
              } else {
                bl = [0, barCenter - barHalf]
                tl = [val, barCenter - barHalf]
                tr = [val, barCenter + barHalf]
                br = [0, barCenter + barHalf]
              }

              const pxBl = vec.transform(bl, combinedTransform)
              const pxTl = vec.transform(tl, combinedTransform)
              const pxTr = vec.transform(tr, combinedTransform)
              const pxBr = vec.transform(br, combinedTransform)

              const barColor = bar.colors[vi] ?? color

              // Value label position
              let pxLabelPos: vec.Vector2
              if (isVertical) {
                const labelWorld: vec.Vector2 = [barCenter, val]
                pxLabelPos = vec.transform(labelWorld, combinedTransform)
                pxLabelPos = [pxLabelPos[0], pxLabelPos[1] - 8]
              } else {
                const labelWorld: vec.Vector2 = [val, barCenter]
                pxLabelPos = vec.transform(labelWorld, combinedTransform)
                pxLabelPos = [pxLabelPos[0] + 8, pxLabelPos[1]]
              }

              return (
                <g key={`bar-${bi}-${vi}`}>
                  <polygon
                    points={`${pxBl[0]},${pxBl[1]} ${pxTl[0]},${pxTl[1]} ${pxTr[0]},${pxTr[1]} ${pxBr[0]},${pxBr[1]}`}
                    fill={barColor}
                    fillOpacity={opacity}
                    stroke={barColor}
                    strokeWidth={weight}
                    strokeOpacity={1}
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                  {showValueLabels && (
                    <text
                      x={pxLabelPos[0]}
                      y={pxLabelPos[1]}
                      fontSize={labelSize * 0.85}
                      textAnchor={isVertical ? "middle" : "start"}
                      dominantBaseline={isVertical ? "auto" : "middle"}
                      style={{ fill: labelColor }}
                      className="mafs-shadow"
                    >
                      {val}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Category label — positioned below the axis using pixel offset */}
            {(() => {
              const labelWorld: vec.Vector2 = isVertical
                ? [groupCenter, 0]
                : [0, groupCenter]
              const pxLabel = vec.transform(labelWorld, combinedTransform)
              return (
                <text
                  x={isVertical ? pxLabel[0] : pxLabel[0] - 8}
                  y={isVertical ? pxLabel[1] + labelSize + 2 : pxLabel[1]}
                  fontSize={labelSize * 0.85}
                  textAnchor={isVertical ? "middle" : "end"}
                  dominantBaseline={isVertical ? "auto" : "middle"}
                  style={{ fill: labelColor }}
                  className="mafs-shadow"
                >
                  {bar.label}
                </text>
              )
            })()}
          </g>
        )
      })}
    </g>
  )
}

BarChart.displayName = "BarChart"
