import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { usePaneContext } from "../context/PaneContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface AsymptoteProps {
  /** Type of asymptote */
  type: "vertical" | "horizontal" | "oblique"
  /** Value: x-coordinate for vertical, y-coordinate for horizontal. Ignored for oblique. */
  value?: number
  /** Slope for oblique asymptotes */
  slope?: number
  /** Y-intercept for oblique asymptotes */
  intercept?: number
  /** Color. Default: Theme.red */
  color?: string
  /** Stroke style. Default: "dashed" */
  style?: "solid" | "dashed"
  /** Label text (e.g., "x = 2") */
  label?: string
  /** Stroke weight. Default: 2 */
  weight?: number
  /** Opacity. Default: 0.7 */
  opacity?: number
  /** Font size for label. Default: 18 */
  labelSize?: number
}

export function Asymptote({
  type,
  value = 0,
  slope = 1,
  intercept = 0,
  color = Theme.red,
  style = "dashed",
  label,
  weight = 2,
  opacity = 0.7,
  labelSize = 18,
}: AsymptoteProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)
  const {
    xPaneRange: [xMin, xMax],
    yPaneRange: [yMin, yMax],
  } = usePaneContext()

  let p1: vec.Vector2
  let p2: vec.Vector2
  let labelPos: vec.Vector2

  if (type === "vertical") {
    p1 = [value, yMin]
    p2 = [value, yMax]
    // Label near the top
    labelPos = [value + 0.2, yMax * 0.85]
  } else if (type === "horizontal") {
    p1 = [xMin, value]
    p2 = [xMax, value]
    // Label near the right
    labelPos = [xMax * 0.85, value + 0.2]
  } else {
    // Oblique: y = slope * x + intercept
    const y1 = slope * xMin + intercept
    const y2 = slope * xMax + intercept
    p1 = [xMin, y1]
    p2 = [xMax, y2]
    // Label near the right side
    labelPos = [xMax * 0.7, slope * xMax * 0.7 + intercept + 0.3]
  }

  const pxP1 = vec.transform(p1, combinedTransform)
  const pxP2 = vec.transform(p2, combinedTransform)
  const pxLabel = vec.transform(labelPos, combinedTransform)

  return (
    <g>
      <line
        x1={pxP1[0]}
        y1={pxP1[1]}
        x2={pxP2[0]}
        y2={pxP2[1]}
        stroke={color}
        strokeWidth={weight}
        opacity={opacity}
        style={{
          vectorEffect: "non-scaling-stroke",
          strokeDasharray:
            style === "dashed"
              ? "var(--mafs-line-stroke-dash-style)"
              : undefined,
        }}
      />

      {label && (
        <text
          x={pxLabel[0]}
          y={pxLabel[1]}
          fontSize={labelSize}
          textAnchor="start"
          dominantBaseline="auto"
          style={{ fill: color }}
          className="mafs-shadow"
        >
          {label}
        </text>
      )}
    </g>
  )
}

Asymptote.displayName = "Asymptote"
