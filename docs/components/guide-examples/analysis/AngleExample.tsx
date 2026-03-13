"use client"

import { Mafs, Coordinates, Angle, Line, Point, useMovablePoint } from "mafs"

export default function AngleExample() {
  const vertex: [number, number] = [0, 0]
  const fromPoint: [number, number] = [3, 0]
  const toHandle = useMovablePoint([1.5, 2.6])

  const angle = Math.atan2(toHandle.y - vertex[1], toHandle.x - vertex[0])
  const degrees = ((angle * 180) / Math.PI + 360) % 360

  return (
    <Mafs height={300} viewBox={{ x: [-1, 5], y: [-1, 4] }}>
      <Coordinates.Cartesian />
      <Line.Segment point1={vertex} point2={fromPoint} />
      <Line.Segment point1={vertex} point2={toHandle.point as [number, number]} />
      <Point x={vertex[0]} y={vertex[1]} />

      <Angle
        vertex={vertex}
        from={fromPoint}
        to={toHandle.point as [number, number]}
        radius={0.8}
        label={`${Math.round(degrees)}°`}
        filled
        fillOpacity={0.15}
      />

      {toHandle.element}
    </Mafs>
  )
}
