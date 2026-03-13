import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface TangentLineProps {
  /** The function to compute the tangent of */
  fn: (x: number) => number
  /** The x-value where the tangent touches the curve */
  at: number
  /** How far the tangent line extends in world units. Default: 6 */
  length?: number
  /** Color of the tangent line. Default: Theme.red */
  color?: string
  /** Whether to show a point at the tangent point. Default: true */
  showPoint?: boolean
  /** Color of the tangent point. Default: Theme.blue */
  pointColor?: string
  /** Whether to show the slope value. Default: false */
  showSlope?: boolean
  /** Custom slope label (overrides auto-computed). */
  slopeLabel?: string
  /** Step size for numerical derivative. Default: 0.0001 */
  dx?: number
  /** Stroke weight. Default: 2 */
  weight?: number
  /** Stroke style. Default: "solid" */
  style?: "solid" | "dashed"
  /** Opacity. Default: 1 */
  opacity?: number
  /** Font size for slope label in pixels. Default: 18 */
  labelSize?: number
}

export function TangentLine({
  fn,
  at,
  length = 6,
  color = Theme.red,
  showPoint = true,
  pointColor = Theme.blue,
  showSlope = false,
  slopeLabel,
  dx = 0.0001,
  weight = 2,
  style = "solid",
  opacity = 1,
  labelSize = 18,
}: TangentLineProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Compute the point on the curve
  const y = fn(at)

  // Numerical derivative using central difference
  const slope = (fn(at + dx) - fn(at - dx)) / (2 * dx)

  // Compute tangent line endpoints
  const halfLen = length / 2
  // Direction vector along the tangent (normalized, then scaled)
  const dir: vec.Vector2 = [1, slope]
  const dirNorm = vec.withMag(dir, halfLen)

  const p1: vec.Vector2 = [at - dirNorm[0], y - dirNorm[1]]
  const p2: vec.Vector2 = [at + dirNorm[0], y + dirNorm[1]]

  const pxP1 = vec.transform(p1, combinedTransform)
  const pxP2 = vec.transform(p2, combinedTransform)
  const pxPoint = vec.transform([at, y] as vec.Vector2, combinedTransform)

  // Slope display
  const slopeText = slopeLabel ?? `m = ${Math.round(slope * 100) / 100}`

  // Position slope label slightly above the tangent point
  const labelOffset: vec.Vector2 = [at + 0.3, y + 0.5]
  const pxLabelPos = vec.transform(labelOffset, combinedTransform)

  return (
    <g>
      {/* Tangent line */}
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

      {/* Point on curve */}
      {showPoint && (
        <circle
          cx={pxPoint[0]}
          cy={pxPoint[1]}
          r={6}
          style={{ fill: pointColor, opacity: 1 }}
        />
      )}

      {/* Slope label */}
      {showSlope && (
        <text
          x={pxLabelPos[0]}
          y={pxLabelPos[1]}
          fontSize={labelSize}
          textAnchor="start"
          dominantBaseline="auto"
          style={{ fill: color }}
          className="mafs-shadow"
        >
          {slopeText}
        </text>
      )}
    </g>
  )
}

TangentLine.displayName = "TangentLine"
