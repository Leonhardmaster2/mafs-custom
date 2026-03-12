import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface StemAndLeafProps {
  /** Array of numbers to display */
  data: number[]
  /** Top-left corner X in world space */
  x?: number
  /** Top-left corner Y in world space */
  y?: number
  /** Color for stem values */
  stemColor?: string
  /** Color for leaf values */
  leafColor?: string
  /** Font size in pixels */
  fontSize?: number
  /** Horizontal spacing between characters in pixels */
  charWidth?: number
  /** Vertical spacing between rows in pixels */
  rowHeight?: number
  /** Whether to show the key (e.g., "1 | 2 = 12") */
  showKey?: boolean
  /** Position offset for the key relative to the plot, in pixels */
  keyOffset?: vec.Vector2
  /** Color for the separator line */
  separatorColor?: string
}

interface StemLeafRow {
  stem: number
  leaves: number[]
}

function buildStemLeafData(data: number[]): StemLeafRow[] {
  const sorted = [...data].sort((a, b) => a - b)

  const map = new Map<number, number[]>()
  for (const num of sorted) {
    const stem = Math.floor(num / 10)
    const leaf = num % 10
    if (!map.has(stem)) map.set(stem, [])
    map.get(stem)!.push(leaf)
  }

  const stems = Array.from(map.keys()).sort((a, b) => a - b)

  // Fill in missing stems for continuity
  const result: StemLeafRow[] = []
  if (stems.length > 0) {
    for (let s = stems[0]; s <= stems[stems.length - 1]; s++) {
      result.push({
        stem: s,
        leaves: map.get(s) || [],
      })
    }
  }

  return result
}

export function StemAndLeaf({
  data,
  x = 0,
  y = 0,
  stemColor = Theme.foreground,
  leafColor = Theme.green,
  fontSize = 22,
  charWidth = 14,
  rowHeight = 28,
  showKey = true,
  keyOffset = [0, -30],
  separatorColor = Theme.foreground,
}: StemAndLeafProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  if (data.length === 0) return null

  const rows = buildStemLeafData(data)

  // Transform the anchor point to pixel space
  const anchorPx = vec.transform([x, y], combinedTransform)

  // Find the widest stem for right-alignment
  const maxStemDigits = Math.max(...rows.map((r) => String(r.stem).length))
  const stemWidth = maxStemDigits * charWidth

  // Separator position (in pixels from anchor)
  const sepX = stemWidth + charWidth

  return (
    <g>
      {/* Separator line */}
      <line
        x1={anchorPx[0] + sepX}
        y1={anchorPx[1] - 4}
        x2={anchorPx[0] + sepX}
        y2={anchorPx[1] + rows.length * rowHeight + 4}
        stroke={separatorColor}
        strokeWidth={2}
        style={{ vectorEffect: "non-scaling-stroke" }}
      />

      {/* Rows */}
      {rows.map((row, i) => {
        const rowY = anchorPx[1] + i * rowHeight + rowHeight * 0.7

        return (
          <g key={`row-${i}`}>
            {/* Stem (right-aligned to separator) */}
            <text
              x={anchorPx[0] + sepX - charWidth * 0.5}
              y={rowY}
              fontSize={fontSize}
              textAnchor="end"
              dominantBaseline="middle"
              style={{ fill: stemColor, fontFamily: "monospace" }}
              className="mafs-shadow"
            >
              {row.stem}
            </text>

            {/* Leaves (left-aligned after separator) */}
            {row.leaves.map((leaf, j) => (
              <text
                key={`leaf-${i}-${j}`}
                x={anchorPx[0] + sepX + charWidth * 0.5 + j * charWidth}
                y={rowY}
                fontSize={fontSize}
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fill: leafColor, fontFamily: "monospace" }}
                className="mafs-shadow"
              >
                {leaf}
              </text>
            ))}
          </g>
        )
      })}

      {/* Key */}
      {showKey && rows.length > 0 && (() => {
        const keyX = anchorPx[0] + keyOffset[0]
        const keyY = anchorPx[1] + rows.length * rowHeight + rowHeight + keyOffset[1] + 20

        const exampleStem = rows[0].stem
        const exampleLeaf = rows[0].leaves[0] ?? 0
        const exampleValue = exampleStem * 10 + exampleLeaf

        return (
          <text
            x={keyX}
            y={keyY}
            fontSize={fontSize * 0.8}
            dominantBaseline="hanging"
            textAnchor="start"
            style={{ fill: stemColor, fontFamily: "monospace" }}
            className="mafs-shadow"
          >
            Key: {exampleStem} | {exampleLeaf} = {exampleValue}
          </text>
        )
      })()}
    </g>
  )
}

StemAndLeaf.displayName = "StemAndLeaf"
