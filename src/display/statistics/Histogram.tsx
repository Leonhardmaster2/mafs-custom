import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface HistogramProps {
  /** Frequencies per bin (requires bins to define edges) */
  data?: number[]
  /** Bin edges (n+1 values for n bars). Required when using data. */
  bins?: number[]
  /** Raw data to auto-bin */
  rawData?: number[]
  /** Number of bins for auto-binning. Default: uses square root rule */
  binCount?: number
  /** Bar color. Default: Theme.blue */
  color?: string
  /** Fill opacity. Default: 0.6 */
  opacity?: number
  /** Whether to show frequency labels above each bar. Default: false */
  showFrequencyLabels?: boolean
  /** Whether to show bin edge labels on x-axis. Default: true */
  showBinLabels?: boolean
  /** Font size for labels in pixels. Default: 16 */
  labelSize?: number
  /** Label color. Default: Theme.foreground */
  labelColor?: string
  /** Stroke weight for bar outlines. Default: 1.5 */
  weight?: number
  /** Hover opacity boost. Default: 0.85 */
  hoverOpacity?: number
}

function autoBin(
  rawData: number[],
  binCount?: number,
): { frequencies: number[]; edges: number[] } {
  const sorted = [...rawData].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  // Square root rule if no binCount
  const nBins = binCount ?? Math.ceil(Math.sqrt(rawData.length))
  const binWidth = (max - min) / nBins

  const edges: number[] = []
  for (let i = 0; i <= nBins; i++) {
    edges.push(Math.round((min + i * binWidth) * 1e6) / 1e6)
  }

  const frequencies = new Array(nBins).fill(0)
  for (const val of rawData) {
    let idx = Math.floor((val - min) / binWidth)
    if (idx >= nBins) idx = nBins - 1 // include max in last bin
    if (idx < 0) idx = 0
    frequencies[idx]++
  }

  return { frequencies, edges }
}

export function Histogram({
  data,
  bins,
  rawData,
  binCount,
  color = Theme.blue,
  opacity = 0.6,
  showFrequencyLabels = false,
  showBinLabels = true,
  labelSize = 16,
  labelColor = Theme.foreground,
  weight = 1.5,
  hoverOpacity = 0.85,
}: HistogramProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null)

  const { frequencies, edges } = React.useMemo(() => {
    if (rawData) {
      return autoBin(rawData, binCount)
    }
    if (data && bins) {
      return { frequencies: data, edges: bins }
    }
    return { frequencies: [], edges: [] }
  }, [data, bins, rawData, binCount])

  if (frequencies.length === 0 || edges.length < 2) return null

  return (
    <g>
      {/* Bars */}
      {frequencies.map((freq, i) => {
        const xLeft = edges[i]
        const xRight = edges[i + 1]
        const isHovered = hoveredBar === i

        const bl: vec.Vector2 = [xLeft, 0]
        const tl: vec.Vector2 = [xLeft, freq]
        const tr: vec.Vector2 = [xRight, freq]
        const br: vec.Vector2 = [xRight, 0]

        const pxBl = vec.transform(bl, combinedTransform)
        const pxTl = vec.transform(tl, combinedTransform)
        const pxTr = vec.transform(tr, combinedTransform)
        const pxBr = vec.transform(br, combinedTransform)

        const barLabel = `${edges[i]}–${edges[i + 1]}: ${freq}`

        return (
          <g
            key={`bar-${i}`}
            onMouseEnter={() => setHoveredBar(i)}
            onMouseLeave={() => setHoveredBar(null)}
            style={{ cursor: "pointer" }}
          >
            <polygon
              points={`${pxBl[0]},${pxBl[1]} ${pxTl[0]},${pxTl[1]} ${pxTr[0]},${pxTr[1]} ${pxBr[0]},${pxBr[1]}`}
              fill={color}
              fillOpacity={isHovered ? hoverOpacity : opacity}
              stroke={color}
              strokeWidth={isHovered ? weight + 1 : weight}
              strokeOpacity={1}
              style={{ vectorEffect: "non-scaling-stroke", transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
            >
              <title>{barLabel}</title>
            </polygon>

            {/* Hover tooltip: frequency label above bar */}
            {isHovered && !showFrequencyLabels && freq > 0 && (
              <text
                x={(pxTl[0] + pxTr[0]) / 2}
                y={pxTl[1] - 8}
                fontSize={labelSize * 0.85}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{ fill: labelColor, fontWeight: 600, pointerEvents: "none" }}
                className="mafs-shadow"
              >
                {freq}
              </text>
            )}

            {/* Permanent frequency label above bar */}
            {showFrequencyLabels && freq > 0 && (
              <text
                x={(pxTl[0] + pxTr[0]) / 2}
                y={pxTl[1] - 4}
                fontSize={labelSize * 0.85}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{ fill: labelColor, pointerEvents: "none" }}
                className="mafs-shadow"
              >
                {freq}
              </text>
            )}
          </g>
        )
      })}

      {/* Bin edge labels — thin out when too crowded */}
      {showBinLabels &&
        (() => {
          // Compute pixel spacing between adjacent edges
          const minLabelSpacingPx = 35
          let labelEvery = 1
          if (edges.length >= 2) {
            const px0 = vec.transform([edges[0], 0] as vec.Vector2, combinedTransform)
            const px1 = vec.transform([edges[1], 0] as vec.Vector2, combinedTransform)
            const spacingPx = Math.abs(px1[0] - px0[0])
            if (spacingPx > 0) {
              labelEvery = Math.max(1, Math.ceil(minLabelSpacingPx / spacingPx))
            }
          }
          return edges.map((edge, i) => {
            // Always show first and last; skip intermediate when crowded
            if (i !== 0 && i !== edges.length - 1 && i % labelEvery !== 0) return null
            const pxPos = vec.transform([edge, 0] as vec.Vector2, combinedTransform)
            return (
              <text
                key={`edge-${i}`}
                x={pxPos[0]}
                y={pxPos[1] + 4}
                fontSize={labelSize * 0.75}
                textAnchor="middle"
                dominantBaseline="hanging"
                style={{ fill: labelColor, pointerEvents: "none" }}
                opacity={0.7}
                className="mafs-shadow"
              >
                {Number.isInteger(edge) ? edge : edge.toFixed(1)}
              </text>
            )
          })
        })()}
    </g>
  )
}

Histogram.displayName = "Histogram"
