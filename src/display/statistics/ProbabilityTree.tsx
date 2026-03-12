import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

/**
 * A single branch in a probability tree.
 */
export interface ProbabilityBranch {
  /** Label for this outcome (e.g., "Red", "Blue") */
  label: string
  /** Probability of this branch (e.g., 0.6 or "3/5") */
  probability: string | number
  /** Optional nested children for multi-stage experiments */
  children?: ProbabilityBranch[]
  /** Color for this specific branch line (optional, falls back to branchColor) */
  color?: string
}

export interface ProbabilityTreeProps {
  /** Tree data: array of branches from the root */
  data: ProbabilityBranch[]
  /** X position of the root node in world space */
  x?: number
  /** Y position of the root node in world space */
  y?: number
  /** Horizontal spacing between depth levels in world units */
  hSpacing?: number
  /** Vertical spacing between sibling nodes in world units */
  vSpacing?: number
  /** Radius of node dots (in pixels) */
  nodeRadius?: number
  /** Color for branches and nodes */
  branchColor?: string
  /** Color for probability labels on branches */
  labelColor?: string
  /** Font size for labels (in pixels) */
  labelSize?: number
  /** Whether to show a root node dot */
  showRoot?: boolean
  /**
   * Marble animation state. Pass this to show an animated marble
   * traveling through the tree. See useProbabilityMarble().
   */
  marble?: MarbleState | null
}

/** Represents a marble's current animated position */
export interface MarbleState {
  /** World-space position of the marble */
  position: vec.Vector2
  /** The path of edge indices the marble has taken / is taking */
  path: number[]
  /** Whether animation is currently running */
  active: boolean
  /** Color of the marble */
  color: string
  /** Radius of the marble in pixels */
  radius: number
}

/**
 * Arguments for useProbabilityMarble hook.
 */
export interface UseProbabilityMarbleArgs {
  /** Same tree data passed to ProbabilityTree */
  data: ProbabilityBranch[]
  /** Root x position (must match ProbabilityTree) */
  x?: number
  /** Root y position (must match ProbabilityTree) */
  y?: number
  /** Horizontal spacing (must match ProbabilityTree) */
  hSpacing?: number
  /** Vertical spacing (must match ProbabilityTree) */
  vSpacing?: number
  /** Duration per branch segment in seconds */
  speed?: number
  /** Color of the marble */
  color?: string
  /** Radius of the marble in pixels */
  radius?: number
}

export interface ProbabilityMarbleControls {
  /** Current marble state to pass to ProbabilityTree */
  marble: MarbleState | null
  /** Start a new random simulation */
  play: () => void
  /** Reset marble to start */
  reset: () => void
  /** Whether the marble is currently animating */
  isPlaying: boolean
  /** The path of branch labels taken in the last run */
  resultPath: string[]
}

interface FlatNode {
  worldPos: vec.Vector2
  label: string
  isLeaf: boolean
  depth: number
}

interface FlatEdge {
  from: vec.Vector2
  to: vec.Vector2
  probability: string | number
  color?: string
  /** Numeric probability value for simulation */
  numericProb: number
  /** Depth of the "from" node */
  depth: number
  /** Index among siblings at this branch point */
  siblingIndex: number
  /** Parent edge index (-1 for root children) */
  parentEdgeIndex: number
  /** Label at the "to" node */
  label: string
}

function countLeaves(branches: ProbabilityBranch[]): number {
  let total = 0
  for (const b of branches) {
    if (b.children && b.children.length > 0) {
      total += countLeaves(b.children)
    } else {
      total += 1
    }
  }
  return total
}

function parseProbability(p: string | number): number {
  if (typeof p === "number") return p
  // Handle fraction strings like "3/5"
  const match = p.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (match) return parseFloat(match[1]) / parseFloat(match[2])
  return parseFloat(p) || 0
}

function layoutTree(
  parentPos: vec.Vector2,
  branches: ProbabilityBranch[],
  depth: number,
  yStart: number,
  hSpacing: number,
  vSpacing: number,
  nodes: FlatNode[],
  edges: FlatEdge[],
  parentEdgeIndex: number,
): void {
  const x = parentPos[0] + hSpacing
  let leafOffset = 0

  for (let si = 0; si < branches.length; si++) {
    const branch = branches[si]
    const branchLeaves =
      branch.children && branch.children.length > 0 ? countLeaves(branch.children) : 1

    const slotCenter = yStart + (leafOffset + branchLeaves / 2) * vSpacing
    const nodePos: vec.Vector2 = [x, slotCenter]

    const isLeaf = !branch.children || branch.children.length === 0
    nodes.push({ worldPos: nodePos, label: branch.label, isLeaf, depth })

    const edgeIndex = edges.length
    edges.push({
      from: parentPos,
      to: nodePos,
      probability: branch.probability,
      color: branch.color,
      numericProb: parseProbability(branch.probability),
      depth,
      siblingIndex: si,
      parentEdgeIndex,
      label: branch.label,
    })

    if (branch.children && branch.children.length > 0) {
      layoutTree(
        nodePos,
        branch.children,
        depth + 1,
        yStart + leafOffset * vSpacing,
        hSpacing,
        vSpacing,
        nodes,
        edges,
        edgeIndex,
      )
    }

    leafOffset += branchLeaves
  }
}

/**
 * Hook that manages marble animation state for a ProbabilityTree.
 * Uses weighted random selection to pick branches based on actual probabilities.
 */
export function useProbabilityMarble({
  data,
  x = 0,
  y = 0,
  hSpacing = 2.5,
  vSpacing = 1.2,
  speed = 1.0,
  color = Theme.pink,
  radius = 8,
}: UseProbabilityMarbleArgs): ProbabilityMarbleControls {
  const [marble, setMarble] = React.useState<MarbleState | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [resultPath, setResultPath] = React.useState<string[]>([])
  const animRef = React.useRef<number>(-1)
  const startTimeRef = React.useRef<number>(0)

  // Compute layout once
  const layout = React.useMemo(() => {
    const totalLeaves = countLeaves(data)
    const rootPos: vec.Vector2 = [x, y]
    const nodes: FlatNode[] = []
    const edges: FlatEdge[] = []
    const yStart = y - (totalLeaves * vSpacing) / 2 + vSpacing / 2
    layoutTree(rootPos, data, 0, yStart, hSpacing, vSpacing, nodes, edges, -1)
    return { rootPos, nodes, edges }
  }, [data, x, y, hSpacing, vSpacing])

  const reset = React.useCallback(() => {
    cancelAnimationFrame(animRef.current)
    setMarble(null)
    setIsPlaying(false)
    setResultPath([])
  }, [])

  const play = React.useCallback(() => {
    cancelAnimationFrame(animRef.current)

    // Pick a random path through the tree using weighted probability
    const chosenEdgeIndices: number[] = []
    const chosenLabels: string[] = []
    let parentEdgeIdx = -1

    while (true) {
      // Find all children of this parent
      const siblings = layout.edges.filter((e) => e.parentEdgeIndex === parentEdgeIdx)
      if (siblings.length === 0) break

      // Weighted random selection
      const rand = Math.random()
      let cumulative = 0
      let chosen = siblings[0]
      for (const sib of siblings) {
        cumulative += sib.numericProb
        if (rand <= cumulative) {
          chosen = sib
          break
        }
      }

      const edgeIdx = layout.edges.indexOf(chosen)
      chosenEdgeIndices.push(edgeIdx)
      chosenLabels.push(chosen.label)
      parentEdgeIdx = edgeIdx
    }

    setResultPath(chosenLabels)

    // Build waypoints: root -> each chosen node
    const waypoints: vec.Vector2[] = [layout.rootPos]
    for (const ei of chosenEdgeIndices) {
      waypoints.push(layout.edges[ei].to)
    }

    const segmentDuration = speed * 1000 // ms per segment
    const totalDuration = (waypoints.length - 1) * segmentDuration

    setIsPlaying(true)
    startTimeRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / totalDuration, 1)

      // Determine which segment we're on
      const totalSegments = waypoints.length - 1
      const segmentFloat = progress * totalSegments
      const segmentIdx = Math.min(Math.floor(segmentFloat), totalSegments - 1)
      const segmentT = segmentFloat - segmentIdx

      // Ease function (smooth step)
      const eased = segmentT * segmentT * (3 - 2 * segmentT)

      const from = waypoints[segmentIdx]
      const to = waypoints[segmentIdx + 1]
      const position = vec.lerp(from, to, eased)

      setMarble({
        position,
        path: chosenEdgeIndices.slice(0, segmentIdx + 1),
        active: progress < 1,
        color,
        radius,
      })

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setIsPlaying(false)
      }
    }

    animRef.current = requestAnimationFrame(tick)
  }, [layout, speed, color, radius])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return { marble, play, reset, isPlaying, resultPath }
}

export function ProbabilityTree({
  data,
  x = 0,
  y = 0,
  hSpacing = 2.5,
  vSpacing = 1.2,
  nodeRadius = 5,
  branchColor = Theme.foreground,
  labelColor = Theme.foreground,
  labelSize = 22,
  showRoot = true,
  marble = null,
}: ProbabilityTreeProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Compute layout
  const totalLeaves = countLeaves(data)
  const rootPos: vec.Vector2 = [x, y]

  const nodes: FlatNode[] = []
  const edges: FlatEdge[] = []

  const yStart = y - (totalLeaves * vSpacing) / 2 + vSpacing / 2
  layoutTree(rootPos, data, 0, yStart, hSpacing, vSpacing, nodes, edges, -1)

  const rootPx = vec.transform(rootPos, combinedTransform)

  // Set of edges in the marble's path (for highlighting)
  const marblePath = new Set(marble?.path ?? [])

  return (
    <g>
      {/* Edges (branches) */}
      {edges.map((edge, i) => {
        const fromPx = vec.transform(edge.from, combinedTransform)
        const toPx = vec.transform(edge.to, combinedTransform)
        const midPx = vec.midpoint(fromPx, toPx)

        // Offset label to the side of the branch (perpendicular)
        const dir = vec.sub(toPx, fromPx)
        const norm = vec.normalize(vec.normal(dir))
        const labelOffset = vec.scale(norm, 16)
        const labelPos = vec.add(midPx, labelOffset)

        const isOnPath = marblePath.has(i)
        const edgeColor = edge.color || branchColor
        const edgeOpacity = marble && marble.active && !isOnPath ? 0.25 : 1

        return (
          <g key={`edge-${i}`}>
            <line
              x1={fromPx[0]}
              y1={fromPx[1]}
              x2={toPx[0]}
              y2={toPx[1]}
              stroke={isOnPath ? (edge.color || Theme.pink) : edgeColor}
              strokeWidth={isOnPath ? 3 : 2}
              opacity={edgeOpacity}
              style={{ vectorEffect: "non-scaling-stroke", transition: "opacity 0.3s" }}
            />
            <text
              x={labelPos[0]}
              y={labelPos[1]}
              fontSize={labelSize * 0.8}
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={edgeOpacity}
              style={{ fill: labelColor, transition: "opacity 0.3s" }}
              className="mafs-shadow"
            >
              {typeof edge.probability === "number"
                ? edge.probability % 1 === 0
                  ? edge.probability
                  : edge.probability.toFixed(2)
                : edge.probability}
            </text>
          </g>
        )
      })}

      {/* Root node */}
      {showRoot && (
        <circle cx={rootPx[0]} cy={rootPx[1]} r={nodeRadius} style={{ fill: branchColor }} />
      )}

      {/* Child nodes with labels */}
      {nodes.map((node, i) => {
        const px = vec.transform(node.worldPos, combinedTransform)

        // Check if this node is on the marble path
        const nodeOnPath = marble?.path?.some((ei) => {
          const e = edges[ei]
          return e.to[0] === node.worldPos[0] && e.to[1] === node.worldPos[1]
        })
        const nodeOpacity = marble && marble.active && !nodeOnPath ? 0.25 : 1

        return (
          <g key={`node-${i}`}>
            <circle
              cx={px[0]}
              cy={px[1]}
              r={nodeRadius}
              style={{
                fill: nodeOnPath ? Theme.pink : branchColor,
                transition: "opacity 0.3s, fill 0.3s",
              }}
              opacity={nodeOpacity}
            />
            {node.isLeaf && (
              <text
                x={px[0] + 12}
                y={px[1]}
                fontSize={labelSize}
                dominantBaseline="middle"
                textAnchor="start"
                opacity={nodeOpacity}
                style={{ fill: labelColor, transition: "opacity 0.3s" }}
                className="mafs-shadow"
              >
                {node.label}
              </text>
            )}
            {!node.isLeaf && (
              <text
                x={px[0]}
                y={px[1] - nodeRadius - 8}
                fontSize={labelSize * 0.85}
                dominantBaseline="auto"
                textAnchor="middle"
                opacity={nodeOpacity}
                style={{ fill: labelColor, transition: "opacity 0.3s" }}
                className="mafs-shadow"
              >
                {node.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Animated marble */}
      {marble && (
        (() => {
          const marblePx = vec.transform(marble.position, combinedTransform)
          return (
            <>
              {/* Glow effect */}
              <circle
                cx={marblePx[0]}
                cy={marblePx[1]}
                r={marble.radius + 4}
                fill={marble.color}
                opacity={0.3}
              />
              {/* Marble */}
              <circle
                cx={marblePx[0]}
                cy={marblePx[1]}
                r={marble.radius}
                fill={marble.color}
                stroke="white"
                strokeWidth={1.5}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            </>
          )
        })()
      )}
    </g>
  )
}

ProbabilityTree.displayName = "ProbabilityTree"
