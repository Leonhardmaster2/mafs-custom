import * as React from "react"
import { useTransformContext } from "../context/TransformContext"
import { Theme } from "./Theme"
import { vec } from "../vec"

export interface NumberLineInterval {
  /** Start value of the interval */
  start: number
  /** End value of the interval */
  end: number
  /** Whether the start endpoint is inclusive (filled circle). Default: true */
  startInclusive?: boolean
  /** Whether the end endpoint is inclusive (filled circle). Default: true */
  endInclusive?: boolean
  /** Color of the interval segment */
  color?: string
  /** Label text displayed above the interval */
  label?: string
}

export interface NumberLinePoint {
  /** Position on the number line */
  value: number
  /** Label displayed above or below the point */
  label?: string
  /** Color of the point */
  color?: string
}

export interface NumberLineProps {
  /** Range of the number line [min, max] */
  range: vec.Vector2
  /** Height of the Mafs container in pixels. Default: 80 */
  height?: number
  /** Tick configuration */
  ticks?: {
    /** Step between tick marks. Default: 1 */
    step?: number
    /** Whether to show numeric labels. Default: true */
    labels?: boolean
  }
  /** Intervals to display on the number line */
  intervals?: NumberLineInterval[]
  /** Individual points to display */
  points?: NumberLinePoint[]
  /** Whether to show arrow tips at both ends. Default: true */
  arrows?: boolean
  /** Color of the axis line and ticks. Default: Theme.foreground */
  color?: string
  /** Font size for labels in pixels. Default: 18 */
  labelSize?: number
  /** Weight of the interval lines. Default: 3 */
  intervalWeight?: number
}

export function NumberLine({
  range: [rangeMin, rangeMax],
  ticks: tickConfig,
  intervals = [],
  points = [],
  arrows = true,
  color = Theme.foreground,
  labelSize = 18,
  intervalWeight = 3,
}: NumberLineProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const tickStep = tickConfig?.step ?? 1
  const showTickLabels = tickConfig?.labels ?? true

  // Axis extends slightly beyond range
  const padding = (rangeMax - rangeMin) * 0.06
  const axisLeft: vec.Vector2 = [rangeMin - padding, 0]
  const axisRight: vec.Vector2 = [rangeMax + padding, 0]
  const pxLeft = vec.transform(axisLeft, combinedTransform)
  const pxRight = vec.transform(axisRight, combinedTransform)

  // Generate ticks
  const ticks: number[] = []
  const firstTick = Math.ceil(rangeMin / tickStep) * tickStep
  for (let t = firstTick; t <= rangeMax; t += tickStep) {
    ticks.push(Math.round(t * 1e10) / 1e10) // avoid floating point drift
  }

  const tickHalfPx = 5
  const endpointRadius = 5

  // Arrow marker id
  const arrowId = React.useMemo(
    () => `mafs-nl-arrow-${Math.random().toString(36).slice(2, 8)}`,
    [],
  )

  // Smart tick label thinning: skip labels when they'd overlap
  const tickLabelStep = React.useMemo(() => {
    if (ticks.length < 2) return 1
    const px0 = vec.transform([ticks[0], 0] as vec.Vector2, combinedTransform)
    const px1 = vec.transform([ticks[1], 0] as vec.Vector2, combinedTransform)
    const pxPerTick = Math.abs(px1[0] - px0[0])
    const minPxPerLabel = labelSize * 1.8
    if (pxPerTick < 1) return 1
    return Math.max(1, Math.ceil(minPxPerLabel / pxPerTick))
  }, [ticks, combinedTransform, labelSize])

  // Point labels go above axis; interval labels stagger higher when both exist
  const pointLabelYOffset = -endpointRadius - 8
  const hasPointsAndIntervals = points.length > 0 && intervals.some((iv) => iv.label)
  const intervalLabelYOffset = hasPointsAndIntervals
    ? -endpointRadius - 6 - labelSize
    : -endpointRadius - 6

  return (
    <g>
      {/* Arrow marker definition */}
      {arrows && (
        <defs>
          <marker
            id={`${arrowId}-right`}
            markerWidth="8"
            markerHeight="8"
            refX="8"
            refY="4"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={color} strokeWidth={0} />
          </marker>
          <marker
            id={`${arrowId}-left`}
            markerWidth="8"
            markerHeight="8"
            refX="0"
            refY="4"
            orient="auto"
          >
            <path d="M 8 0 L 0 4 L 8 8 z" fill={color} strokeWidth={0} />
          </marker>
        </defs>
      )}

      {/* Main axis line */}
      <line
        x1={pxLeft[0]}
        y1={pxLeft[1]}
        x2={pxRight[0]}
        y2={pxRight[1]}
        stroke={color}
        strokeWidth={2}
        style={{ vectorEffect: "non-scaling-stroke" }}
        markerStart={arrows ? `url(#${arrowId}-left)` : undefined}
        markerEnd={arrows ? `url(#${arrowId}-right)` : undefined}
      />

      {/* Tick marks and labels */}
      {ticks.map((t, ti) => {
        const pxPos = vec.transform([t, 0] as vec.Vector2, combinedTransform)
        const showLabel = showTickLabels && (ti % tickLabelStep === 0)
        return (
          <g key={`tick-${t}`}>
            <line
              x1={pxPos[0]}
              y1={pxPos[1] - tickHalfPx}
              x2={pxPos[0]}
              y2={pxPos[1] + tickHalfPx}
              stroke={color}
              strokeWidth={1.5}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            {showLabel && (
              <text
                x={pxPos[0]}
                y={pxPos[1] + tickHalfPx + 4}
                fontSize={labelSize * 0.8}
                textAnchor="middle"
                dominantBaseline="hanging"
                style={{ fill: color }}
                className="mafs-shadow"
              >
                {t}
              </text>
            )}
          </g>
        )
      })}

      {/* Intervals */}
      {intervals.map((interval, i) => {
        const intColor = interval.color ?? Theme.blue
        const startInc = interval.startInclusive ?? true
        const endInc = interval.endInclusive ?? true

        const pxStart = vec.transform(
          [interval.start, 0] as vec.Vector2,
          combinedTransform,
        )
        const pxEnd = vec.transform(
          [interval.end, 0] as vec.Vector2,
          combinedTransform,
        )

        return (
          <g key={`interval-${i}`}>
            {/* Interval line segment */}
            <line
              x1={pxStart[0]}
              y1={pxStart[1]}
              x2={pxEnd[0]}
              y2={pxEnd[1]}
              stroke={intColor}
              strokeWidth={intervalWeight}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />

            {/* Start endpoint */}
            <circle
              cx={pxStart[0]}
              cy={pxStart[1]}
              r={endpointRadius}
              fill={startInc ? intColor : "var(--mafs-bg)"}
              stroke={intColor}
              strokeWidth={2}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />

            {/* End endpoint */}
            <circle
              cx={pxEnd[0]}
              cy={pxEnd[1]}
              r={endpointRadius}
              fill={endInc ? intColor : "var(--mafs-bg)"}
              stroke={intColor}
              strokeWidth={2}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />

            {/* Interval label */}
            {interval.label && (
              <text
                x={(pxStart[0] + pxEnd[0]) / 2}
                y={pxStart[1] + intervalLabelYOffset}
                fontSize={labelSize * 0.85}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{ fill: intColor }}
                className="mafs-shadow"
              >
                {interval.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Individual points */}
      {points.map((pt, i) => {
        const ptColor = pt.color ?? Theme.red
        const pxPos = vec.transform(
          [pt.value, 0] as vec.Vector2,
          combinedTransform,
        )
        return (
          <g key={`point-${i}`}>
            <circle
              cx={pxPos[0]}
              cy={pxPos[1]}
              r={endpointRadius + 1}
              fill={ptColor}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            {pt.label && (
              <text
                x={pxPos[0]}
                y={pxPos[1] + pointLabelYOffset}
                fontSize={labelSize * 0.85}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{ fill: ptColor }}
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

NumberLine.displayName = "NumberLine"
