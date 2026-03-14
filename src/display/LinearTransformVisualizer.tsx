import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface LinearTransformVisualizerProps {
  /** The 2x2 transformation matrix as [[a, b], [c, d]].
   *  Column 1 = [a, c] is where e1 maps, column 2 = [b, d] is where e2 maps. */
  matrix: [[number, number], [number, number]]
  /** Animation interpolation 0..1 (0 = identity, 1 = full transform). Default: 1 */
  t?: number
  /** Whether to show a deformed grid. Default: true */
  showGrid?: boolean
  /** Number of grid lines in each direction (-n to +n). Default: 5 */
  gridLines?: number
  /** Whether to show the original (pre-transform) basis vectors. Default: true */
  showOriginalBasis?: boolean
  /** Whether to show the transformed basis vectors. Default: true */
  showTransformedBasis?: boolean
  /** Whether to show the unit square / transformed parallelogram. Default: true */
  showUnitShape?: boolean
  /** Whether to show eigenvectors if they are real. Default: false */
  showEigenvectors?: boolean
  /** Whether to show the determinant value label. Default: false */
  showDeterminant?: boolean
  /** Color for the first basis vector (e1). Default: Theme.red */
  basisColor1?: string
  /** Color for the second basis vector (e2). Default: Theme.blue */
  basisColor2?: string
  /** Color for the grid lines. Default: Theme.foreground */
  gridColor?: string
  /** Opacity of the original (pre-transform) elements. Default: 0.3 */
  originalOpacity?: number
  /** Opacity of transformed grid lines. Default: 0.2 */
  gridOpacity?: number
  /** Color for eigenvector lines. Default: Theme.green */
  eigenColor?: string
  /** Stroke weight for basis vectors. Default: 2.5 */
  weight?: number
  /** Font size for labels. Default: 18 */
  labelSize?: number
}

export function LinearTransformVisualizer({
  matrix,
  t = 1,
  showGrid = true,
  gridLines = 5,
  showOriginalBasis = true,
  showTransformedBasis = true,
  showUnitShape = true,
  showEigenvectors = false,
  showDeterminant = false,
  basisColor1 = Theme.red,
  basisColor2 = Theme.blue,
  gridColor = Theme.foreground,
  originalOpacity = 0.3,
  gridOpacity = 0.2,
  eigenColor = Theme.green,
  weight = 2.5,
  labelSize = 18,
}: LinearTransformVisualizerProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Interpolated matrix: (1-t)*I + t*M
  const mt: [[number, number], [number, number]] = [
    [(1 - t) + t * matrix[0][0], t * matrix[0][1]],
    [t * matrix[1][0], (1 - t) + t * matrix[1][1]],
  ]

  // Apply 2x2 matrix to a world-space vector
  function applyMatrix(v: vec.Vector2): vec.Vector2 {
    return [mt[0][0] * v[0] + mt[0][1] * v[1], mt[1][0] * v[0] + mt[1][1] * v[1]]
  }

  // Transform to pixel space
  function toPx(v: vec.Vector2): vec.Vector2 {
    return vec.transform(v, combinedTransform)
  }

  // Build grid lines
  const gridPathD = React.useMemo(() => {
    if (!showGrid) return ""
    let d = ""
    const n = gridLines
    const ext = n + 0.5
    for (let k = -n; k <= n; k++) {
      // Vertical line: x=k from y=-ext to y=ext
      const v1 = applyMatrix([k, -ext])
      const v2 = applyMatrix([k, ext])
      const p1 = toPx(v1)
      const p2 = toPx(v2)
      d += `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} `
      // Horizontal line: y=k from x=-ext to x=ext
      const h1 = applyMatrix([-ext, k])
      const h2 = applyMatrix([ext, k])
      const p3 = toPx(h1)
      const p4 = toPx(h2)
      d += `M ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} `
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrid, gridLines, mt, combinedTransform])

  // Unit shape corners
  const unitCorners: vec.Vector2[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const transformedCorners = unitCorners.map(applyMatrix)
  const pxCorners = transformedCorners.map(toPx)
  const unitShapeD =
    `M ${pxCorners[0][0]},${pxCorners[0][1]}` +
    pxCorners.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
    " Z"

  // Original unit shape
  const pxOrigCorners = unitCorners.map(toPx)
  const origShapeD =
    `M ${pxOrigCorners[0][0]},${pxOrigCorners[0][1]}` +
    pxOrigCorners.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("") +
    " Z"

  // Basis vectors
  const origin = toPx([0, 0])
  const e1Transformed = toPx(applyMatrix([1, 0]))
  const e2Transformed = toPx(applyMatrix([0, 1]))
  const e1Original = toPx([1, 0])
  const e2Original = toPx([0, 1])

  // Arrow helper
  function renderArrow(from: vec.Vector2, to: vec.Vector2, color: string, arrowOpacity: number) {
    const dir = vec.sub(to, from)
    const len = vec.mag(dir)
    if (len < 1) return null
    const norm = vec.normalize(dir)
    const arrowSize = Math.min(10, len * 0.3)
    const left = vec.add(to, vec.rotate(vec.scale(norm, -arrowSize), Math.PI * 5 / 6))
    const right = vec.add(to, vec.rotate(vec.scale(norm, -arrowSize), -Math.PI * 5 / 6))
    return (
      <g>
        <line
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          stroke={color}
          strokeWidth={weight}
          opacity={arrowOpacity}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        <polygon
          points={`${to[0]},${to[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`}
          fill={color}
          opacity={arrowOpacity}
        />
      </g>
    )
  }

  // Eigenvectors (analytical 2x2 solution)
  const eigenData = React.useMemo(() => {
    if (!showEigenvectors) return null
    const M = matrix
    const trace = M[0][0] + M[1][1]
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]
    const disc = trace * trace - 4 * det
    if (disc < 0) return null // complex eigenvalues

    const lambda1 = (trace + Math.sqrt(disc)) / 2
    const lambda2 = (trace - Math.sqrt(disc)) / 2
    const eigenvectors: vec.Vector2[] = []

    for (const lambda of [lambda1, lambda2]) {
      // Solve (M - lambda*I) * v = 0
      const a = M[0][0] - lambda
      const b = M[0][1]
      if (Math.abs(b) > 1e-10) {
        eigenvectors.push(vec.normalize([-b, a]))
      } else if (Math.abs(a) > 1e-10) {
        eigenvectors.push([0, 1])
      } else {
        eigenvectors.push([1, 0])
      }
    }

    return { eigenvalues: [lambda1, lambda2], eigenvectors }
  }, [showEigenvectors, matrix])

  // Determinant
  const detValue = mt[0][0] * mt[1][1] - mt[0][1] * mt[1][0]

  return (
    <g>
      {/* Transformed grid */}
      {showGrid && gridPathD && (
        <path
          d={gridPathD}
          stroke={gridColor}
          strokeWidth={1}
          opacity={gridOpacity}
          fill="none"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}

      {/* Original unit shape (faded) */}
      {showUnitShape && (
        <path
          d={origShapeD}
          fill={gridColor}
          fillOpacity={0.05 * originalOpacity / 0.3}
          stroke={gridColor}
          strokeWidth={1}
          opacity={originalOpacity}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}

      {/* Transformed unit shape */}
      {showUnitShape && (
        <path
          d={unitShapeD}
          fill={Theme.indigo}
          fillOpacity={0.12}
          stroke={Theme.indigo}
          strokeWidth={1.5}
          opacity={0.8}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}

      {/* Eigenvector lines */}
      {eigenData &&
        eigenData.eigenvectors.map((ev, i) => {
          const ext = 10
          const p1 = toPx(vec.scale(ev, -ext))
          const p2 = toPx(vec.scale(ev, ext))
          return (
            <line
              key={`eigen-${i}`}
              x1={p1[0]}
              y1={p1[1]}
              x2={p2[0]}
              y2={p2[1]}
              stroke={eigenColor}
              strokeWidth={1.5}
              strokeDasharray="6,4"
              opacity={0.6}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
          )
        })}

      {/* Original basis vectors (faded) */}
      {showOriginalBasis && (
        <>
          {renderArrow(origin, e1Original, basisColor1, originalOpacity)}
          {renderArrow(origin, e2Original, basisColor2, originalOpacity)}
        </>
      )}

      {/* Transformed basis vectors */}
      {showTransformedBasis && (
        <>
          {renderArrow(origin, e1Transformed, basisColor1, 1)}
          {renderArrow(origin, e2Transformed, basisColor2, 1)}
        </>
      )}

      {/* Basis labels */}
      {showTransformedBasis && (
        <>
          <text
            x={e1Transformed[0]}
            y={e1Transformed[1] - 10}
            fontSize={labelSize * 0.85}
            textAnchor="middle"
            style={{ fill: basisColor1 }}
            className="mafs-shadow"
          >
            e₁
          </text>
          <text
            x={e2Transformed[0]}
            y={e2Transformed[1] - 10}
            fontSize={labelSize * 0.85}
            textAnchor="middle"
            style={{ fill: basisColor2 }}
            className="mafs-shadow"
          >
            e₂
          </text>
        </>
      )}

      {/* Determinant label */}
      {showDeterminant && (
        <text
          x={toPx(applyMatrix([0.5, 0.5]))[0]}
          y={toPx(applyMatrix([0.5, 0.5]))[1]}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: Theme.indigo }}
          className="mafs-shadow"
        >
          det = {detValue.toFixed(2)}
        </text>
      )}

      {/* Eigenvalue labels */}
      {eigenData && showEigenvectors &&
        eigenData.eigenvectors.map((ev, i) => {
          const pos = toPx(vec.scale(ev, 2.5))
          return (
            <text
              key={`eigen-label-${i}`}
              x={pos[0]}
              y={pos[1] - 8}
              fontSize={labelSize * 0.75}
              textAnchor="middle"
              style={{ fill: eigenColor }}
              className="mafs-shadow"
            >
              λ = {eigenData.eigenvalues[i].toFixed(2)}
            </text>
          )
        })}
    </g>
  )
}

LinearTransformVisualizer.displayName = "LinearTransformVisualizer"
