import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface AngleProps {
  /** The vertex of the angle */
  vertex: vec.Vector2
  /** First ray endpoint (defines one side of the angle) */
  from: vec.Vector2
  /** Second ray endpoint (defines the other side of the angle) */
  to: vec.Vector2
  /** Radius of the arc in world units. Default: 0.5 */
  radius?: number
  /** Label text (e.g., "60°" or "π/3") */
  label?: string
  /** Color of the arc. Default: Theme.blue */
  color?: string
  /** Whether to render a small square for right angles. Default: false */
  showRightAngle?: boolean
  /** Whether to fill the sector. Default: false */
  filled?: boolean
  /** Fill opacity when filled. Default: 0.1 */
  fillOpacity?: number
  /** Stroke weight. Default: 2 */
  weight?: number
  /** Font size for the label in pixels. Default: 20 */
  labelSize?: number
}

export function Angle({
  vertex,
  from,
  to,
  radius = 0.5,
  label,
  color = Theme.blue,
  showRightAngle = false,
  filled = false,
  fillOpacity = 0.1,
  weight = 2,
  labelSize = 20,
}: AngleProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Compute angles from vertex to each point
  const fromDir = vec.sub(from, vertex)
  const toDir = vec.sub(to, vertex)

  const startAngle = Math.atan2(fromDir[1], fromDir[0])
  const endAngle = Math.atan2(toDir[1], toDir[0])

  // Compute the sweep angle (always go counterclockwise from start to end)
  let sweep = endAngle - startAngle
  if (sweep < 0) sweep += 2 * Math.PI
  if (sweep > 2 * Math.PI) sweep -= 2 * Math.PI

  const isRightAngle =
    showRightAngle || (Math.abs(sweep - Math.PI / 2) < 0.01)

  // For right angle, draw a small square
  if (isRightAngle && showRightAngle) {
    const side = radius * 0.6
    // Two points along each ray at distance `side` from vertex
    const dir1 = vec.withMag(fromDir, side)
    const dir2 = vec.withMag(toDir, side)

    const p1: vec.Vector2 = vec.add(vertex, dir1)
    const p2: vec.Vector2 = vec.add(vertex, vec.add(dir1, dir2))
    const p3: vec.Vector2 = vec.add(vertex, dir2)

    const pxVertex = vec.transform(vertex, combinedTransform)
    const pxP1 = vec.transform(p1, combinedTransform)
    const pxP2 = vec.transform(p2, combinedTransform)
    const pxP3 = vec.transform(p3, combinedTransform)

    return (
      <g>
        {filled && (
          <polygon
            points={`${pxVertex[0]},${pxVertex[1]} ${pxP1[0]},${pxP1[1]} ${pxP2[0]},${pxP2[1]} ${pxP3[0]},${pxP3[1]}`}
            fill={color}
            fillOpacity={fillOpacity}
            stroke="none"
          />
        )}
        <polyline
          points={`${pxP1[0]},${pxP1[1]} ${pxP2[0]},${pxP2[1]} ${pxP3[0]},${pxP3[1]}`}
          fill="none"
          stroke={color}
          strokeWidth={weight}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        {label && (() => {
          const midAngle = startAngle + sweep / 2
          const labelDist = radius * 1.4
          const labelWorld: vec.Vector2 = [
            vertex[0] + Math.cos(midAngle) * labelDist,
            vertex[1] + Math.sin(midAngle) * labelDist,
          ]
          const pxLabel = vec.transform(labelWorld, combinedTransform)
          return (
            <text
              x={pxLabel[0]}
              y={pxLabel[1]}
              fontSize={labelSize}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: color }}
              className="mafs-shadow"
            >
              {label}
            </text>
          )
        })()}
      </g>
    )
  }

  // Draw arc using SVG path
  // Sample points along the arc for the path
  const numSegments = Math.max(16, Math.ceil(sweep / 0.1))
  const arcPoints: vec.Vector2[] = []
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments
    const angle = startAngle + sweep * t
    arcPoints.push([
      vertex[0] + Math.cos(angle) * radius,
      vertex[1] + Math.sin(angle) * radius,
    ])
  }

  const pxArcPoints = arcPoints.map((p) => vec.transform(p, combinedTransform))
  const pxVertex = vec.transform(vertex, combinedTransform)

  // Build SVG path
  let d = `M ${pxArcPoints[0][0]},${pxArcPoints[0][1]}`
  for (let i = 1; i < pxArcPoints.length; i++) {
    d += ` L ${pxArcPoints[i][0]},${pxArcPoints[i][1]}`
  }

  // For filled sector, close through vertex
  const fillD = `M ${pxVertex[0]},${pxVertex[1]} L ${pxArcPoints[0][0]},${pxArcPoints[0][1]}` +
    pxArcPoints.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
    " Z"

  // Label position: at the midpoint of the arc, offset outward
  const midAngle = startAngle + sweep / 2
  const labelDist = radius + radius * 0.4
  const labelWorld: vec.Vector2 = [
    vertex[0] + Math.cos(midAngle) * labelDist,
    vertex[1] + Math.sin(midAngle) * labelDist,
  ]
  const pxLabel = vec.transform(labelWorld, combinedTransform)

  return (
    <g>
      {/* Filled sector */}
      {filled && (
        <path
          d={fillD}
          fill={color}
          fillOpacity={fillOpacity}
          stroke="none"
        />
      )}

      {/* Arc stroke */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={weight}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Label */}
      {label && (
        <text
          x={pxLabel[0]}
          y={pxLabel[1]}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: color }}
          className="mafs-shadow"
        >
          {label}
        </text>
      )}
    </g>
  )
}

Angle.displayName = "Angle"
