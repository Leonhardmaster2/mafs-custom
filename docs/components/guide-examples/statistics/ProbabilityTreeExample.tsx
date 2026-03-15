"use client"

import { Mafs, ProbabilityTree, useProbabilityMarble } from "mafs"

const treeData = [
  {
    label: "Red",
    probability: "3/5" as string | number,
    children: [
      { label: "Red, Red", probability: "2/4" as string | number },
      { label: "Red, Blue", probability: "2/4" as string | number },
    ],
  },
  {
    label: "Blue",
    probability: "2/5" as string | number,
    children: [
      { label: "Blue, Red", probability: "3/4" as string | number },
      { label: "Blue, Blue", probability: "1/4" as string | number },
    ],
  },
]

export default function ProbabilityTreeExample() {
  const { marble, play, reset, isPlaying, resultPath } = useProbabilityMarble({
    data: treeData,
    x: 0,
    y: 0,
    hSpacing: 3,
    vSpacing: 1.5,
    speed: 0.6,
  })

  return (
    <div style={{ position: "relative" }}>
      <Mafs height={400} viewBox={{ x: [-2, 8], y: [-3, 3] }} pan>
        <ProbabilityTree
          data={treeData}
          x={0}
          y={0}
          hSpacing={3}
          vSpacing={1.5}
          marble={marble}
        />
      </Mafs>
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        display: "flex",
        gap: 8,
        alignItems: "center",
        zIndex: 10,
      }}>
        <button
          onClick={isPlaying ? reset : play}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(0,0,0,0.5)",
            color: "#eee",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {isPlaying ? "Reset" : "\u25B6 Simulate"}
        </button>
        {resultPath.length > 0 && !isPlaying && (
          <span style={{
            fontSize: 13,
            color: "#ccc",
            whiteSpace: "nowrap",
            background: "rgba(0,0,0,0.5)",
            padding: "4px 10px",
            borderRadius: 6,
          }}>
            {resultPath.join(" \u2192 ")}
          </span>
        )}
      </div>
    </div>
  )
}
