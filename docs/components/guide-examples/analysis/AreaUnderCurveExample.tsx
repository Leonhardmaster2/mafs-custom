"use client"

import { useState } from "react"
import { Mafs, Coordinates, Plot, AreaUnderCurve } from "mafs"

export default function AreaUnderCurveExample() {
  const [n, setN] = useState(10)

  return (
    <div style={{ position: "relative" }}>
      <Mafs height={400} viewBox={{ x: [-1, 4], y: [-1, 10] }} pan={false}>
        <Coordinates.Cartesian />
        <Plot.OfX y={(x) => x * x} />
        <AreaUnderCurve
          fn={(x) => x * x}
          from={0}
          to={3}
          riemannSums={{ n, type: "left" }}
          showAreaComparison
        />
      </Mafs>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(0,0,0,0.7)",
          padding: "6px 12px",
          borderRadius: 6,
          color: "white",
          fontSize: 14,
          zIndex: 10,
        }}
      >
        Rectangles:{" "}
        <input
          type="range"
          min={2}
          max={50}
          step={1}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          style={{ width: 120, verticalAlign: "middle" }}
        />
        {" "}{n}
      </div>
    </div>
  )
}
