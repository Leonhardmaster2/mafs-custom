import * as React from "react"
import { useTransformContext } from "../../context/TransformContext"
import { Theme } from "../Theme"
import { vec } from "../../vec"

export interface VennSet {
  /** Label for this set (e.g., "A", "B") */
  label: string
  /** Number of elements only in this set (exclusive count) */
  exclusive?: number
}

export interface VennIntersection {
  /** Which set indices participate (e.g., [0, 1] for A ∩ B) */
  sets: number[]
  /** Value to display in this region */
  value: number | string
}

export interface VennDiagramProps {
  /** Array of 2 or 3 sets */
  sets: VennSet[]
  /** Intersection values */
  intersections?: VennIntersection[]
  /** Center of the diagram in world space */
  center?: vec.Vector2
  /** Radius of each circle in world units */
  radius?: number
  /** Colors for each set circle */
  colors?: string[]
  /** Fill opacity for circles */
  fillOpacity?: number
  /** Font size for labels (pixels) */
  labelSize?: number
  /** Color for value labels */
  labelColor?: string
  /** Whether to show the universal set rectangle */
  showUniversal?: boolean
  /** Label for the universal set */
  universalLabel?: string
  /** Value to display in the complement region (outside all circles) */
  complementValue?: number | string
  /** Index of the currently highlighted region, or null. Use with onRegionClick. */
  highlightedRegion?: string | null
  /** Called when a region is clicked. Key format: "exclusive-0", "intersection-0", etc. */
  onRegionClick?: (regionKey: string | null) => void
  /** Opacity boost for highlighted region */
  highlightOpacity?: number
}

/**
 * Compute circle centers for 2-set and 3-set Venn diagrams.
 */
function getCircleCenters(
  center: vec.Vector2,
  radius: number,
  count: 2 | 3,
): vec.Vector2[] {
  const overlap = radius * 0.6

  if (count === 2) {
    return [
      [center[0] - overlap / 2, center[1]],
      [center[0] + overlap / 2, center[1]],
    ]
  }

  // 3-set: equilateral triangle arrangement
  const angle120 = (2 * Math.PI) / 3
  return [0, 1, 2].map((i) => {
    const a = Math.PI / 2 + i * angle120
    return [center[0] + overlap * 0.6 * Math.cos(a), center[1] + overlap * 0.6 * Math.sin(a)]
  }) as vec.Vector2[]
}

/**
 * Find the centroid of intersection regions for label placement.
 * Exclusive regions are pushed strongly away from the overlap zone.
 * Pairwise intersections in 3-set diagrams are pushed away from the
 * non-participating circle so labels don't cluster in the center.
 */
function getRegionCentroid(
  centers: vec.Vector2[],
  setIndices: number[],
  allIndices: number[],
  radius: number,
): vec.Vector2 {
  if (setIndices.length === 1) {
    // Exclusive region: push label far away from other circles
    const idx = setIndices[0]
    const others = allIndices.filter((i) => i !== idx)
    if (others.length === 0) return centers[idx]

    const otherCenter: vec.Vector2 = [
      others.reduce((s, i) => s + centers[i][0], 0) / others.length,
      others.reduce((s, i) => s + centers[i][1], 0) / others.length,
    ]
    const dir = vec.sub(centers[idx], otherCenter)
    if (vec.mag(dir) < 0.001) return centers[idx]
    // Push to ~75% of radius away from center — well into the exclusive-only zone
    const pushDist = radius * 0.75
    return vec.add(centers[idx], vec.scale(vec.normalize(dir), pushDist))
  }

  // Centroid of participating circle centers
  const cx = setIndices.reduce((s, i) => s + centers[i][0], 0) / setIndices.length
  const cy = setIndices.reduce((s, i) => s + centers[i][1], 0) / setIndices.length
  const mid: vec.Vector2 = [cx, cy]

  // For pairwise intersections in a 3-set diagram, push the label away from
  // the non-participating circle(s) so it sits in the correct lens region
  const nonParticipating = allIndices.filter((i) => !setIndices.includes(i))
  if (setIndices.length === 2 && nonParticipating.length > 0) {
    const nonCenter: vec.Vector2 = [
      nonParticipating.reduce((s, i) => s + centers[i][0], 0) / nonParticipating.length,
      nonParticipating.reduce((s, i) => s + centers[i][1], 0) / nonParticipating.length,
    ]
    const awayDir = vec.sub(mid, nonCenter)
    if (vec.mag(awayDir) > 0.001) {
      // Push away from the third circle by ~55% of radius
      return vec.add(mid, vec.scale(vec.normalize(awayDir), radius * 0.55))
    }
  }

  return mid
}

/**
 * Get the set label position — placed at the far side of each circle, away from the others.
 */
function getSetLabelPosition(
  centers: vec.Vector2[],
  idx: number,
  allIndices: number[],
  radius: number,
): vec.Vector2 {
  const cc = centers[idx]
  const others = allIndices.filter((i) => i !== idx)

  if (others.length === 0) {
    return [cc[0], cc[1] + radius + 0.3]
  }

  const otherCenter: vec.Vector2 = [
    others.reduce((s, i) => s + centers[i][0], 0) / others.length,
    others.reduce((s, i) => s + centers[i][1], 0) / others.length,
  ]

  // Direction away from the other circle(s)
  const dir = vec.sub(cc, otherCenter)
  if (vec.mag(dir) < 0.001) {
    return [cc[0], cc[1] + radius + 0.3]
  }

  // Place label just outside the circle in the "away" direction
  return vec.add(cc, vec.scale(vec.normalize(dir), radius + 0.35))
}

export function VennDiagram({
  sets,
  intersections = [],
  center = [0, 0],
  radius = 1.8,
  colors,
  fillOpacity = 0.2,
  labelSize = 24,
  labelColor = Theme.foreground,
  showUniversal = false,
  universalLabel = "U",
  complementValue,
  highlightedRegion = null,
  onRegionClick,
  highlightOpacity = 0.5,
}: VennDiagramProps) {
  const { viewTransform, userTransform } = useTransformContext()
  const combinedTransform = vec.matrixMult(viewTransform, userTransform)

  const count = sets.length as 2 | 3
  if (count < 2 || count > 3) {
    return null
  }

  const defaultColors =
    count === 2 ? [Theme.blue, Theme.red] : [Theme.blue, Theme.red, Theme.green]
  const circleColors = colors || defaultColors
  const circleCenters = getCircleCenters(center, radius, count)
  const allIndices = sets.map((_, i) => i)

  // Unique ID for clip paths
  const clipId = React.useMemo(() => `venn-${Math.random().toString(36).slice(2, 8)}`, [])

  // Compute pixel-space circle data
  const circleData = circleCenters.map((cc) => {
    const pxCenter = vec.transform(cc, combinedTransform)
    const pxEdge = vec.transform([cc[0] + radius, cc[1]] as vec.Vector2, combinedTransform)
    const pxRadius = Math.abs(pxEdge[0] - pxCenter[0])
    return { pxCenter, pxRadius }
  })

  return (
    <g>
      {/* Clip path definitions for intersection highlighting */}
      <defs>
        {circleData.map((cd, i) => (
          <clipPath key={`clip-${i}`} id={`${clipId}-circle-${i}`}>
            <circle cx={cd.pxCenter[0]} cy={cd.pxCenter[1]} r={cd.pxRadius} />
          </clipPath>
        ))}
        {/* Compound clip paths for pairwise-only regions (A∩B minus C) in 3-set diagrams */}
        {count === 3 &&
          intersections.map((inter, i) => {
            if (inter.sets.length !== 2) return null
            const [a, b] = inter.sets
            const c = allIndices.find((idx) => idx !== a && idx !== b)!
            // Clip to circle B, then we'll subtract C with an SVG mask
            return (
              <React.Fragment key={`pairwise-defs-${i}`}>
                {/* Mask that excludes circle C from the pairwise region */}
                <mask id={`${clipId}-pairwise-mask-${i}`}>
                  {/* White = visible everywhere */}
                  <rect x="-9999" y="-9999" width="99999" height="99999" fill="white" />
                  {/* Black = hidden where circle C is */}
                  <circle
                    cx={circleData[c].pxCenter[0]}
                    cy={circleData[c].pxCenter[1]}
                    r={circleData[c].pxRadius}
                    fill="black"
                  />
                </mask>
              </React.Fragment>
            )
          })}
        {/* Compound clip path for triple intersection (clipped to circle-1, then we nest with circle-2) */}
        {count === 3 && (() => {
          const tripleInter = intersections.find((inter) => inter.sets.length === 3)
          if (!tripleInter) return null
          return (
            <clipPath id={`${clipId}-triple-inner`}>
              <circle
                cx={circleData[1].pxCenter[0]}
                cy={circleData[1].pxCenter[1]}
                r={circleData[1].pxRadius}
              />
            </clipPath>
          )
        })()}
        {/* Exclusive masks: for each circle, subtract ALL other circles */}
        {sets.map((_, i) => {
          const others = allIndices.filter((j) => j !== i)
          if (others.length === 0) return null
          return (
            <mask key={`excl-mask-${i}`} id={`${clipId}-excl-mask-${i}`}>
              <rect x="-9999" y="-9999" width="99999" height="99999" fill="white" />
              {others.map((j) => (
                <circle
                  key={j}
                  cx={circleData[j].pxCenter[0]}
                  cy={circleData[j].pxCenter[1]}
                  r={circleData[j].pxRadius}
                  fill="black"
                />
              ))}
            </mask>
          )
        })}
        {/* Complement mask: everything minus ALL circles (for universal complement region) */}
        {showUniversal && (
          <mask id={`${clipId}-complement-mask`}>
            <rect x="-9999" y="-9999" width="99999" height="99999" fill="white" />
            {circleData.map((cd, i) => (
              <circle
                key={i}
                cx={cd.pxCenter[0]}
                cy={cd.pxCenter[1]}
                r={cd.pxRadius}
                fill="black"
              />
            ))}
          </mask>
        )}
      </defs>

      {/* Universal set rectangle */}
      {showUniversal &&
        (() => {
          const padding = radius * 0.8
          const corners: vec.Vector2[] = [
            [center[0] - radius - padding, center[1] + radius + padding],
            [center[0] + radius + padding, center[1] + radius + padding],
            [center[0] + radius + padding, center[1] - radius - padding],
            [center[0] - radius - padding, center[1] - radius - padding],
          ]
          const pxCorners = corners.map((c) => vec.transform(c, combinedTransform))

          const uLabelPos = vec.transform(
            [center[0] + radius + padding - 0.15, center[1] + radius + padding - 0.15],
            combinedTransform,
          )

          return (
            <>
              <polygon
                points={pxCorners.map((p) => `${p[0]},${p[1]}`).join(" ")}
                fill="none"
                stroke={Theme.foreground}
                strokeWidth={1.5}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <text
                x={uLabelPos[0]}
                y={uLabelPos[1]}
                fontSize={labelSize}
                textAnchor="end"
                dominantBaseline="hanging"
                style={{ fill: labelColor, fontStyle: "italic" }}
                className="mafs-shadow"
              >
                {universalLabel}
              </text>
            </>
          )
        })()}

      {/* Base circles */}
      {circleData.map((cd, i) => (
        <circle
          key={`circle-${i}`}
          cx={cd.pxCenter[0]}
          cy={cd.pxCenter[1]}
          r={cd.pxRadius}
          fill={circleColors[i]}
          fillOpacity={fillOpacity}
          stroke={circleColors[i]}
          strokeWidth={2}
          strokeOpacity={0.8}
          style={{ vectorEffect: "non-scaling-stroke", cursor: onRegionClick ? "pointer" : undefined }}
        />
      ))}

      {/* Highlight for intersection regions */}
      {intersections.map((inter, i) => {
        const regionKey = `intersection-${i}`
        const isHighlighted = highlightedRegion === regionKey

        if (!isHighlighted) return null

        if (inter.sets.length === 3) {
          // Triple intersection: circle-0 clipped to circle-1, then clipped to circle-2
          return (
            <g key={`highlight-inter-${i}`} clipPath={`url(#${clipId}-circle-${2})`}>
              <circle
                cx={circleData[0].pxCenter[0]}
                cy={circleData[0].pxCenter[1]}
                r={circleData[0].pxRadius}
                fill={Theme.yellow}
                fillOpacity={highlightOpacity}
                stroke="none"
                clipPath={`url(#${clipId}-circle-${1})`}
              />
            </g>
          )
        }

        if (inter.sets.length === 2 && count === 3) {
          // Pairwise intersection in 3-set: A∩B minus C
          const [a, b] = inter.sets
          return (
            <g key={`highlight-inter-${i}`} mask={`url(#${clipId}-pairwise-mask-${i})`}>
              <circle
                cx={circleData[a].pxCenter[0]}
                cy={circleData[a].pxCenter[1]}
                r={circleData[a].pxRadius}
                fill={circleColors[a]}
                fillOpacity={highlightOpacity}
                stroke="none"
                clipPath={`url(#${clipId}-circle-${b})`}
              />
            </g>
          )
        }

        // 2-set diagram: simple lens shape
        const [a, b] = inter.sets
        return (
          <g key={`highlight-inter-${i}`}>
            <circle
              cx={circleData[a].pxCenter[0]}
              cy={circleData[a].pxCenter[1]}
              r={circleData[a].pxRadius}
              fill={circleColors[a]}
              fillOpacity={highlightOpacity}
              stroke="none"
              clipPath={`url(#${clipId}-circle-${b})`}
            />
          </g>
        )
      })}

      {/* Highlight for exclusive regions (crescent: circle minus all others) */}
      {sets.map((_, i) => {
        const regionKey = `exclusive-${i}`
        const isHighlighted = highlightedRegion === regionKey
        if (!isHighlighted) return null

        return (
          <circle
            key={`highlight-excl-${i}`}
            cx={circleData[i].pxCenter[0]}
            cy={circleData[i].pxCenter[1]}
            r={circleData[i].pxRadius}
            fill={circleColors[i]}
            fillOpacity={highlightOpacity}
            stroke="none"
            mask={`url(#${clipId}-excl-mask-${i})`}
          />
        )
      })}

      {/* Highlight for complement region (outside all circles, inside universal rectangle) */}
      {showUniversal && highlightedRegion === "complement" &&
        (() => {
          const padding = radius * 0.8
          const corners: vec.Vector2[] = [
            [center[0] - radius - padding, center[1] + radius + padding],
            [center[0] + radius + padding, center[1] + radius + padding],
            [center[0] + radius + padding, center[1] - radius - padding],
            [center[0] - radius - padding, center[1] - radius - padding],
          ]
          const pxCorners = corners.map((c) => vec.transform(c, combinedTransform))
          return (
            <polygon
              points={pxCorners.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={Theme.foreground}
              fillOpacity={highlightOpacity * 0.4}
              stroke="none"
              mask={`url(#${clipId}-complement-mask)`}
            />
          )
        })()}

      {/* Clickable regions — layered from bottom to top:
          0. Complement (universal minus all circles, behind everything)
          1. Exclusive regions
          2. Pairwise intersections (masked to exclude triple zone in 3-set)
          3. Triple intersection (on top, catches center clicks)
      */}
      {onRegionClick && (
        <>
          {/* Complement click area (outside all circles, inside universal rect) */}
          {showUniversal && (() => {
            const padding = radius * 0.8
            const corners: vec.Vector2[] = [
              [center[0] - radius - padding, center[1] + radius + padding],
              [center[0] + radius + padding, center[1] + radius + padding],
              [center[0] + radius + padding, center[1] - radius - padding],
              [center[0] - radius - padding, center[1] - radius - padding],
            ]
            const pxCorners = corners.map((c) => vec.transform(c, combinedTransform))
            return (
              <polygon
                points={pxCorners.map((p) => `${p[0]},${p[1]}`).join(" ")}
                fill="transparent"
                style={{ cursor: "pointer", pointerEvents: "all" }}
                mask={`url(#${clipId}-complement-mask)`}
                onClick={() =>
                  onRegionClick(
                    highlightedRegion === "complement" ? null : "complement",
                  )
                }
              />
            )
          })()}
          {/* Exclusive region click areas (full circle masked to exclude other circles) */}
          {sets.map((_, i) => (
            <circle
              key={`click-excl-${i}`}
              cx={circleData[i].pxCenter[0]}
              cy={circleData[i].pxCenter[1]}
              r={circleData[i].pxRadius}
              fill="transparent"
              style={{ cursor: "pointer", pointerEvents: "all" }}
              mask={`url(#${clipId}-excl-mask-${i})`}
              onClick={() =>
                onRegionClick(
                  highlightedRegion === `exclusive-${i}` ? null : `exclusive-${i}`,
                )
              }
            />
          ))}
          {/* Pairwise intersection click areas */}
          {intersections.map((inter, i) => {
            if (inter.sets.length !== 2) return null
            const [a, b] = inter.sets

            if (count === 3) {
              // In 3-set diagrams: mask out the third circle so clicks in the
              // triple-overlap zone fall through to the triple click target below
              return (
                <g key={`click-inter-${i}`} mask={`url(#${clipId}-pairwise-mask-${i})`}>
                  <circle
                    cx={circleData[a].pxCenter[0]}
                    cy={circleData[a].pxCenter[1]}
                    r={circleData[a].pxRadius}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    clipPath={`url(#${clipId}-circle-${b})`}
                    onClick={() =>
                      onRegionClick(
                        highlightedRegion === `intersection-${i}` ? null : `intersection-${i}`,
                      )
                    }
                  />
                </g>
              )
            }

            // 2-set diagram: simple lens click area
            return (
              <circle
                key={`click-inter-${i}`}
                cx={circleData[a].pxCenter[0]}
                cy={circleData[a].pxCenter[1]}
                r={circleData[a].pxRadius}
                fill="transparent"
                style={{ cursor: "pointer" }}
                clipPath={`url(#${clipId}-circle-${b})`}
                onClick={() =>
                  onRegionClick(
                    highlightedRegion === `intersection-${i}` ? null : `intersection-${i}`,
                  )
                }
              />
            )
          })}
          {/* Triple intersection click area (on top — catches center clicks) */}
          {count === 3 && (() => {
            const tripleIdx = intersections.findIndex((inter) => inter.sets.length === 3)
            if (tripleIdx === -1) return null
            return (
              <g clipPath={`url(#${clipId}-circle-${2})`}>
                <circle
                  cx={circleData[0].pxCenter[0]}
                  cy={circleData[0].pxCenter[1]}
                  r={circleData[0].pxRadius}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  clipPath={`url(#${clipId}-circle-${1})`}
                  onClick={() =>
                    onRegionClick(
                      highlightedRegion === `intersection-${tripleIdx}`
                        ? null
                        : `intersection-${tripleIdx}`,
                    )
                  }
                />
              </g>
            )
          })()}
        </>
      )}

      {/* Set labels — placed at the far edge of each circle, away from others */}
      {circleCenters.map((_, i) => {
        const labelWorld = getSetLabelPosition(circleCenters, i, allIndices, radius)
        const pxLabel = vec.transform(labelWorld, combinedTransform)

        return (
          <text
            key={`label-${i}`}
            x={pxLabel[0]}
            y={pxLabel[1]}
            fontSize={labelSize * 1.1}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: circleColors[i], fontWeight: "bold", pointerEvents: "none" }}
            className="mafs-shadow"
          >
            {sets[i].label}
          </text>
        )
      })}

      {/* Exclusive set values */}
      {sets.map((set, i) => {
        if (set.exclusive == null) return null
        const centroid = getRegionCentroid(circleCenters, [i], allIndices, radius)
        const pxPos = vec.transform(centroid, combinedTransform)
        const isActive = highlightedRegion === `exclusive-${i}`

        return (
          <text
            key={`exclusive-${i}`}
            x={pxPos[0]}
            y={pxPos[1]}
            fontSize={labelSize * 0.9}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: labelColor,
              textDecoration: isActive ? "underline" : "none",
              fontWeight: isActive ? "bold" : "normal",
              pointerEvents: "none",
            }}
            className="mafs-shadow"
          >
            {set.exclusive}
          </text>
        )
      })}

      {/* Intersection values */}
      {intersections.map((inter, i) => {
        const centroid = getRegionCentroid(circleCenters, inter.sets, allIndices, radius)
        const pxPos = vec.transform(centroid, combinedTransform)
        const isActive = highlightedRegion === `intersection-${i}`

        return (
          <text
            key={`inter-${i}`}
            x={pxPos[0]}
            y={pxPos[1]}
            fontSize={labelSize * 0.9}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: labelColor,
              textDecoration: isActive ? "underline" : "none",
              fontWeight: isActive ? "bold" : "normal",
              pointerEvents: "none",
            }}
            className="mafs-shadow"
          >
            {inter.value}
          </text>
        )
      })}

      {/* Complement value (outside all circles, inside universal rect) */}
      {showUniversal && complementValue != null &&
        (() => {
          const padding = radius * 0.8
          // Place in bottom-left corner of the universal rectangle
          const compPos = vec.transform(
            [center[0] - radius - padding + 0.3, center[1] - radius - padding + 0.3] as vec.Vector2,
            combinedTransform,
          )
          const isActive = highlightedRegion === "complement"
          return (
            <text
              x={compPos[0]}
              y={compPos[1]}
              fontSize={labelSize * 0.9}
              textAnchor="start"
              dominantBaseline="auto"
              style={{
                fill: labelColor,
                textDecoration: isActive ? "underline" : "none",
                fontWeight: isActive ? "bold" : "normal",
                pointerEvents: "none",
              }}
              className="mafs-shadow"
            >
              {complementValue}
            </text>
          )
        })()}
    </g>
  )
}

VennDiagram.displayName = "VennDiagram"
