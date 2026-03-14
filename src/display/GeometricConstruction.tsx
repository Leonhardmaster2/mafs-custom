import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

/** A step in a geometric construction */
export type ConstructionStep =
  | {
      type: "given-point"
      id: string
      position: vec.Vector2
      label?: string
    }
  | {
      type: "given-segment"
      id: string
      from: string
      to: string
    }
  | {
      type: "compass-arc"
      id: string
      center: string
      through: string
      /** Angular sweep [startAngle, endAngle] in radians. Full circle if omitted. */
      sweep?: vec.Vector2
    }
  | {
      type: "line-through"
      id: string
      point1: string
      point2: string
    }
  | {
      type: "intersection"
      id: string
      of: [string, string]
      /** Which intersection (0 or 1) when objects have two intersections. Default: 0 */
      index?: 0 | 1
      label?: string
    }
  | {
      type: "result-segment"
      from: string
      to: string
    }
  | {
      type: "result-line"
      through1: string
      through2: string
    }

export interface GeometricConstructionProps {
  /** Ordered list of construction steps */
  construction: ConstructionStep[]
  /** Number of steps to reveal. Default: all */
  visibleSteps?: number
  /** Whether to show labels on points. Default: true */
  showLabels?: boolean
  /** Opacity of construction arcs and helper lines. Default: 0.35 */
  constructionOpacity?: number
  /** Color of compass arcs. Default: Theme.blue */
  arcColor?: string
  /** Color of result lines/segments. Default: Theme.red */
  resultColor?: string
  /** Color of given elements. Default: Theme.foreground */
  givenColor?: string
  /** Color of intersection points. Default: Theme.green */
  intersectionColor?: string
  /** Stroke weight for arcs. Default: 1.5 */
  arcWeight?: number
  /** Stroke weight for result lines. Default: 2.5 */
  resultWeight?: number
  /** Point radius in pixels. Default: 5 */
  pointRadius?: number
  /** Font size for point labels. Default: 18 */
  labelSize?: number
}

// --- Intersection solvers ---

function circleCircleIntersection(
  c1: vec.Vector2,
  r1: number,
  c2: vec.Vector2,
  r2: number,
  index: 0 | 1,
): vec.Vector2 | null {
  const d = vec.dist(c1, c2)
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const dir = vec.normalize(vec.sub(c2, c1))
  const mid = vec.add(c1, vec.scale(dir, a))
  const perp = vec.normal(dir)
  const sign = index === 0 ? 1 : -1
  return vec.add(mid, vec.scale(perp, sign * h))
}

function lineCircleIntersection(
  p1: vec.Vector2,
  p2: vec.Vector2,
  center: vec.Vector2,
  radius: number,
  index: 0 | 1,
): vec.Vector2 | null {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const fx = p1[0] - center[0]
  const fy = p1[1] - center[1]
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius
  const disc = b * b - 4 * a * c
  if (disc < 0) return null
  const sqrtDisc = Math.sqrt(disc)
  const t = index === 0 ? (-b - sqrtDisc) / (2 * a) : (-b + sqrtDisc) / (2 * a)
  return [p1[0] + t * dx, p1[1] + t * dy]
}

function lineLineIntersection(
  p1: vec.Vector2,
  p2: vec.Vector2,
  p3: vec.Vector2,
  p4: vec.Vector2,
): vec.Vector2 | null {
  const d1 = vec.sub(p2, p1)
  const d2 = vec.sub(p4, p3)
  const cross = d1[0] * d2[1] - d1[1] * d2[0]
  if (Math.abs(cross) < 1e-10) return null
  const d3 = vec.sub(p3, p1)
  const t = (d3[0] * d2[1] - d3[1] * d2[0]) / cross
  return vec.add(p1, vec.scale(d1, t))
}

// --- Rendering data types ---
interface RenderPoint {
  pos: vec.Vector2
  color: string
  label?: string
}
interface RenderLine {
  p1: vec.Vector2
  p2: vec.Vector2
  color: string
  weight: number
  opacity: number
  dashed: boolean
}
interface RenderArc {
  center: vec.Vector2
  radius: number
  sweep: vec.Vector2 // [startAngle, endAngle]
  color: string
  weight: number
  opacity: number
}

export function GeometricConstruction({
  construction,
  visibleSteps,
  showLabels = true,
  constructionOpacity = 0.35,
  arcColor = Theme.blue,
  resultColor = Theme.red,
  givenColor = Theme.foreground,
  intersectionColor = Theme.green,
  arcWeight = 1.5,
  resultWeight = 2.5,
  pointRadius = 5,
  labelSize = 18,
}: GeometricConstructionProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const numSteps = visibleSteps ?? construction.length

  // Process construction steps
  const renderData = React.useMemo(() => {
    const points = new Map<string, vec.Vector2>()
    const circles = new Map<string, { center: vec.Vector2; radius: number }>()
    const lines = new Map<string, { p1: vec.Vector2; p2: vec.Vector2 }>()

    const renderPoints: RenderPoint[] = []
    const renderLines: RenderLine[] = []
    const renderArcs: RenderArc[] = []

    for (let i = 0; i < Math.min(numSteps, construction.length); i++) {
      const step = construction[i]

      switch (step.type) {
        case "given-point": {
          points.set(step.id, step.position)
          renderPoints.push({
            pos: step.position,
            color: givenColor,
            label: step.label,
          })
          break
        }

        case "given-segment": {
          const from = points.get(step.from)
          const to = points.get(step.to)
          if (!from || !to) break
          lines.set(step.id, { p1: from, p2: to })
          renderLines.push({
            p1: from,
            p2: to,
            color: givenColor,
            weight: 2,
            opacity: 1,
            dashed: false,
          })
          break
        }

        case "compass-arc": {
          const center = points.get(step.center)
          const through = points.get(step.through)
          if (!center || !through) break
          const radius = vec.dist(center, through)
          circles.set(step.id, { center, radius })

          const sweep: vec.Vector2 = step.sweep ?? [0, 2 * Math.PI]
          renderArcs.push({
            center,
            radius,
            sweep,
            color: arcColor,
            weight: arcWeight,
            opacity: constructionOpacity,
          })
          break
        }

        case "line-through": {
          const p1 = points.get(step.point1)
          const p2 = points.get(step.point2)
          if (!p1 || !p2) break
          lines.set(step.id, { p1, p2 })
          // Extend the line beyond the two points
          const dir = vec.sub(p2, p1)
          const ext = vec.scale(vec.normalize(dir), 20)
          renderLines.push({
            p1: vec.sub(p1, ext),
            p2: vec.add(p2, ext),
            color: givenColor,
            weight: 1,
            opacity: constructionOpacity,
            dashed: true,
          })
          break
        }

        case "intersection": {
          const [id1, id2] = step.of
          const idx = step.index ?? 0
          let result: vec.Vector2 | null = null

          const c1 = circles.get(id1)
          const c2 = circles.get(id2)
          const l1 = lines.get(id1)
          const l2 = lines.get(id2)

          if (c1 && c2) {
            result = circleCircleIntersection(c1.center, c1.radius, c2.center, c2.radius, idx)
          } else if (c1 && l2) {
            result = lineCircleIntersection(l2.p1, l2.p2, c1.center, c1.radius, idx)
          } else if (l1 && c2) {
            result = lineCircleIntersection(l1.p1, l1.p2, c2.center, c2.radius, idx)
          } else if (l1 && l2) {
            result = lineLineIntersection(l1.p1, l1.p2, l2.p1, l2.p2)
          }

          if (result) {
            points.set(step.id, result)
            renderPoints.push({
              pos: result,
              color: intersectionColor,
              label: step.label,
            })
          }
          break
        }

        case "result-segment": {
          const from = points.get(step.from)
          const to = points.get(step.to)
          if (!from || !to) break
          renderLines.push({
            p1: from,
            p2: to,
            color: resultColor,
            weight: resultWeight,
            opacity: 1,
            dashed: false,
          })
          break
        }

        case "result-line": {
          const p1 = points.get(step.through1)
          const p2 = points.get(step.through2)
          if (!p1 || !p2) break
          const dir = vec.sub(p2, p1)
          const ext = vec.scale(vec.normalize(dir), 20)
          renderLines.push({
            p1: vec.sub(p1, ext),
            p2: vec.add(p2, ext),
            color: resultColor,
            weight: resultWeight,
            opacity: 1,
            dashed: false,
          })
          break
        }
      }
    }

    return { renderPoints, renderLines, renderArcs }
  }, [
    construction,
    numSteps,
    givenColor,
    arcColor,
    arcWeight,
    constructionOpacity,
    intersectionColor,
    resultColor,
    resultWeight,
  ])

  function toPx(p: vec.Vector2): vec.Vector2 {
    return vec.transform(p, combinedTransform)
  }

  return (
    <g>
      {/* Arcs */}
      {renderData.renderArcs.map((arc, i) => {
        const numSeg = Math.max(32, Math.ceil(Math.abs(arc.sweep[1] - arc.sweep[0]) / 0.05))
        const arcPts: vec.Vector2[] = []
        for (let j = 0; j <= numSeg; j++) {
          const t = j / numSeg
          const angle = arc.sweep[0] + (arc.sweep[1] - arc.sweep[0]) * t
          arcPts.push([
            arc.center[0] + Math.cos(angle) * arc.radius,
            arc.center[1] + Math.sin(angle) * arc.radius,
          ])
        }
        const pxPts = arcPts.map(toPx)
        const d =
          `M ${pxPts[0][0]},${pxPts[0][1]}` +
          pxPts.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

        return (
          <path
            key={`arc-${i}`}
            d={d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.weight}
            opacity={arc.opacity}
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {/* Lines */}
      {renderData.renderLines.map((ln, i) => {
        const px1 = toPx(ln.p1)
        const px2 = toPx(ln.p2)
        return (
          <line
            key={`line-${i}`}
            x1={px1[0]}
            y1={px1[1]}
            x2={px2[0]}
            y2={px2[1]}
            stroke={ln.color}
            strokeWidth={ln.weight}
            opacity={ln.opacity}
            strokeDasharray={ln.dashed ? "6,4" : undefined}
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {/* Points */}
      {renderData.renderPoints.map((pt, i) => {
        const px = toPx(pt.pos)
        return (
          <g key={`point-${i}`}>
            <circle cx={px[0]} cy={px[1]} r={pointRadius} style={{ fill: pt.color }} />
            {showLabels && pt.label && (
              <text
                x={px[0] + pointRadius + 4}
                y={px[1] - pointRadius - 2}
                fontSize={labelSize}
                style={{ fill: pt.color }}
                className="mafs-shadow"
              >
                {pt.label}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

GeometricConstruction.displayName = "GeometricConstruction"
