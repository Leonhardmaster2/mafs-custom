import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface PiecewisePiece {
  /** The function for this piece */
  fn: (x: number) => number
  /** Domain [min, max] for this piece */
  domain: vec.Vector2
  /** Color for this piece */
  color?: string
}

export interface EndpointConfig {
  /** The x-value of the boundary */
  value: number
  /** Whether the left piece includes this point (filled circle on left piece). Default: true */
  fromLeft?: boolean
  /** Whether the right piece includes this point (filled circle on right piece). Default: false */
  fromRight?: boolean
}

export interface PiecewiseFunctionProps {
  /** Array of function pieces */
  pieces: PiecewisePiece[]
  /** Whether to show endpoint circles at domain boundaries. Default: true */
  showEndpoints?: boolean
  /** Configuration for boundary endpoints */
  endpointConfig?: EndpointConfig[]
  /** Stroke weight. Default: 2.5 */
  weight?: number
  /** Default color for all pieces. Default: Theme.blue */
  color?: string
  /** Endpoint circle radius in pixels. Default: 5 */
  endpointRadius?: number
}

export function PiecewiseFunction({
  pieces,
  showEndpoints = true,
  endpointConfig = [],
  weight = 2.5,
  color = Theme.blue,
  endpointRadius = 5,
}: PiecewiseFunctionProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  // Build a lookup for endpoint configs
  const configMap = React.useMemo(() => {
    const map = new Map<number, EndpointConfig>()
    for (const cfg of endpointConfig) {
      map.set(cfg.value, cfg)
    }
    return map
  }, [endpointConfig])

  return (
    <g>
      {/* Render each piece as a path */}
      {pieces.map((piece, i) => {
        const pieceColor = piece.color ?? color
        const [domMin, domMax] = piece.domain
        const numSamples = Math.max(100, Math.ceil((domMax - domMin) * 50))
        const dx = (domMax - domMin) / numSamples

        // Sample the function
        const points: vec.Vector2[] = []
        for (let j = 0; j <= numSamples; j++) {
          const x = domMin + j * dx
          const y = piece.fn(x)
          if (isFinite(y)) {
            points.push([x, y])
          }
        }

        if (points.length < 2) return null

        // Transform to pixel space
        const pxPoints = points.map((p) => vec.transform(p, combinedTransform))
        const d =
          `M ${pxPoints[0][0]},${pxPoints[0][1]}` +
          pxPoints.slice(1).map((p) => ` L ${p[0]},${p[1]}`).join("")

        return (
          <path
            key={`piece-${i}`}
            d={d}
            fill="none"
            stroke={pieceColor}
            strokeWidth={weight}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ vectorEffect: "non-scaling-stroke" }}
          />
        )
      })}

      {/* Render endpoints */}
      {showEndpoints &&
        pieces.map((piece, i) => {
          const pieceColor = piece.color ?? color
          const [domMin, domMax] = piece.domain
          const endpoints: React.ReactNode[] = []

          // Left endpoint of this piece
          const leftConfig = configMap.get(domMin)
          // If there's a config, use fromRight (this piece is on the right of the boundary)
          // If no config, check if this is the first piece's left bound — default to filled
          const leftFilled = leftConfig
            ? (leftConfig.fromRight ?? false)
            : i === 0

          const pxLeft = vec.transform(
            [domMin, piece.fn(domMin)] as vec.Vector2,
            combinedTransform,
          )
          if (isFinite(piece.fn(domMin))) {
            endpoints.push(
              <circle
                key={`ep-left-${i}`}
                cx={pxLeft[0]}
                cy={pxLeft[1]}
                r={endpointRadius}
                fill={leftFilled ? pieceColor : "var(--mafs-bg)"}
                stroke={pieceColor}
                strokeWidth={2}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />,
            )
          }

          // Right endpoint of this piece
          const rightConfig = configMap.get(domMax)
          // If there's a config, use fromLeft (this piece is on the left of the boundary)
          // If no config, check if this is the last piece — default to filled
          const rightFilled = rightConfig
            ? (rightConfig.fromLeft ?? true)
            : i === pieces.length - 1

          const pxRight = vec.transform(
            [domMax, piece.fn(domMax)] as vec.Vector2,
            combinedTransform,
          )
          if (isFinite(piece.fn(domMax))) {
            endpoints.push(
              <circle
                key={`ep-right-${i}`}
                cx={pxRight[0]}
                cy={pxRight[1]}
                r={endpointRadius}
                fill={rightFilled ? pieceColor : "var(--mafs-bg)"}
                stroke={pieceColor}
                strokeWidth={2}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />,
            )
          }

          return <g key={`endpoints-${i}`}>{endpoints}</g>
        })}
    </g>
  )
}

PiecewiseFunction.displayName = "PiecewiseFunction"
