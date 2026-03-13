import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface ComplexPoint {
  /** Complex number as [real, imaginary] */
  z: vec.Vector2
  /** Label (e.g., "3 + 2i") */
  label?: string
  /** Color. Default: Theme.blue */
  color?: string
}

export interface ComplexPlaneProps {
  /** Points to display on the complex plane */
  points: ComplexPoint[]
  /** Whether to show conjugate points (mirrored across real axis). Default: false */
  showConjugate?: boolean
  /** Whether to show modulus circles (|z|). Default: false */
  showModulus?: boolean
  /** Whether to show argument arcs (angle from positive real axis). Default: false */
  showArgument?: boolean
  /** Font size for labels. Default: 18 */
  labelSize?: number
  /** Point radius in pixels. Default: 6 */
  pointRadius?: number
  /** Argument arc radius in world units. Default: 0.5 */
  argRadius?: number
}

export function ComplexPlane({
  points,
  showConjugate = false,
  showModulus = false,
  showArgument = false,
  labelSize = 18,
  pointRadius = 6,
  argRadius = 0.5,
}: ComplexPlaneProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  return (
    <g>
      {points.map((pt, i) => {
        const [re, im] = pt.z
        const ptColor = pt.color ?? Theme.blue

        const pxPoint = vec.transform([re, im] as vec.Vector2, combinedTransform)
        const pxOrigin = vec.transform([0, 0] as vec.Vector2, combinedTransform)

        // Modulus circle
        const modulus = Math.sqrt(re * re + im * im)

        // Argument angle
        const argument = Math.atan2(im, re)

        return (
          <g key={`cpt-${i}`}>
            {/* Modulus circle */}
            {showModulus && modulus > 0.01 && (() => {
              // Draw circle centered at origin with radius = modulus
              const numSegs = 64
              const circlePts: string[] = []
              for (let j = 0; j <= numSegs; j++) {
                const angle = (j / numSegs) * 2 * Math.PI
                const wx = Math.cos(angle) * modulus
                const wy = Math.sin(angle) * modulus
                const px = vec.transform([wx, wy] as vec.Vector2, combinedTransform)
                circlePts.push(`${px[0]},${px[1]}`)
              }
              return (
                <polyline
                  points={circlePts.join(" ")}
                  fill="none"
                  stroke={ptColor}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                  opacity={0.3}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
              )
            })()}

            {/* Argument arc */}
            {showArgument && modulus > 0.01 && (() => {
              const numSegs = Math.max(8, Math.ceil(Math.abs(argument) / 0.1))
              const arcPts: string[] = []
              const startA = 0
              const endA = argument

              for (let j = 0; j <= numSegs; j++) {
                const t = j / numSegs
                const angle = startA + (endA - startA) * t
                const wx = Math.cos(angle) * argRadius
                const wy = Math.sin(angle) * argRadius
                const px = vec.transform([wx, wy] as vec.Vector2, combinedTransform)
                arcPts.push(`${px[0]},${px[1]}`)
              }

              return (
                <polyline
                  points={arcPts.join(" ")}
                  fill="none"
                  stroke={ptColor}
                  strokeWidth={1.5}
                  opacity={0.6}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
              )
            })()}

            {/* Line from origin to point */}
            {(showModulus || showArgument) && (
              <line
                x1={pxOrigin[0]}
                y1={pxOrigin[1]}
                x2={pxPoint[0]}
                y2={pxPoint[1]}
                stroke={ptColor}
                strokeWidth={1}
                opacity={0.4}
                strokeDasharray="3,3"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            )}

            {/* Main point */}
            <circle
              cx={pxPoint[0]}
              cy={pxPoint[1]}
              r={pointRadius}
              style={{ fill: ptColor, opacity: 1 }}
            />

            {/* Point label */}
            {pt.label && (
              <text
                x={pxPoint[0] + pointRadius + 4}
                y={pxPoint[1] - pointRadius - 2}
                fontSize={labelSize}
                textAnchor="start"
                dominantBaseline="auto"
                style={{ fill: ptColor }}
                className="mafs-shadow"
              >
                {pt.label}
              </text>
            )}

            {/* Conjugate */}
            {showConjugate && Math.abs(im) > 0.01 && (() => {
              const conjPx = vec.transform([re, -im] as vec.Vector2, combinedTransform)
              return (
                <g>
                  {/* Dashed connector */}
                  <line
                    x1={pxPoint[0]}
                    y1={pxPoint[1]}
                    x2={conjPx[0]}
                    y2={conjPx[1]}
                    stroke={ptColor}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    opacity={0.3}
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                  {/* Conjugate point (hollow) */}
                  <circle
                    cx={conjPx[0]}
                    cy={conjPx[1]}
                    r={pointRadius}
                    fill="var(--mafs-bg)"
                    stroke={ptColor}
                    strokeWidth={2}
                    opacity={0.6}
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                  {/* Conjugate label */}
                  <text
                    x={conjPx[0] + pointRadius + 4}
                    y={conjPx[1] + pointRadius + 2}
                    fontSize={labelSize * 0.85}
                    textAnchor="start"
                    dominantBaseline="hanging"
                    style={{ fill: ptColor }}
                    opacity={0.6}
                    className="mafs-shadow"
                  >
                    z̄
                  </text>
                </g>
              )
            })()}
          </g>
        )
      })}
    </g>
  )
}

ComplexPlane.displayName = "ComplexPlane"
