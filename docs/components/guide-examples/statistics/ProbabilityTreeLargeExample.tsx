"use client"

import { Mafs, ProbabilityTree, useProbabilityMarble } from "mafs"

const treeData = [
  {
    label: "Sunny",
    probability: "1/2" as string | number,
    children: [
      {
        label: "Train",
        probability: 0.7,
        children: [
          { label: "On time", probability: 0.9 },
          { label: "Late", probability: 0.1 },
        ],
      },
      {
        label: "Bus",
        probability: 0.3,
        children: [
          { label: "On time", probability: 0.6 },
          { label: "Late", probability: 0.4 },
        ],
      },
    ],
  },
  {
    label: "Rainy",
    probability: "3/10" as string | number,
    children: [
      {
        label: "Train",
        probability: 0.8,
        children: [
          { label: "On time", probability: 0.75 },
          { label: "Late", probability: 0.25 },
        ],
      },
      {
        label: "Bus",
        probability: 0.2,
        children: [
          { label: "On time", probability: 0.4 },
          { label: "Late", probability: 0.6 },
        ],
      },
    ],
  },
  {
    label: "Cloudy",
    probability: "1/5" as string | number,
    children: [
      {
        label: "Train",
        probability: 0.6,
      },
      {
        label: "Bus",
        probability: 0.4,
      },
    ],
  },
]

export default function ProbabilityTreeLargeExample() {
  const { marble, play, reset, isPlaying, resultPath } = useProbabilityMarble({
    data: treeData,
    x: -1,
    y: 0,
    hSpacing: 3,
    vSpacing: 1.0,
    speed: 0.5,
  })

  return (
    <div style={{ position: "relative" }}>
      <Mafs height={500} viewBox={{ x: [-3, 10], y: [-5, 5] }} pan>
        <ProbabilityTree
          data={treeData}
          x={-1}
          y={0}
          hSpacing={3}
          vSpacing={1.0}
          marble={marble}
          labelSize={18}
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
