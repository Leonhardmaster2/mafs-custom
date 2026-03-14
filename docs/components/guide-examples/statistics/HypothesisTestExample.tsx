"use client"

import { useState } from "react"
import { Mafs, Coordinates, HypothesisTest, Debug } from "mafs"

export default function HypothesisTestExample() {
  const [alpha, setAlpha] = useState(0.05)
  const [testStat, setTestStat] = useState(1.8)
  const [alternative, setAlternative] = useState<"less" | "greater" | "two-sided">("greater")
  const [debug, setDebug] = useState(false)

  return (
    <>
      <Mafs
        height={400}
        viewBox={{ x: [-4, 4], y: [-0.05, 0.45] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian
          xAxis="auto"
          yAxis="auto"
        />
        <HypothesisTest
          alpha={alpha}
          alternative={alternative}
          testStatistic={testStat}
          showDecision
          showAcceptanceRegion
        />
        {debug && <Debug.ViewportInfo />}
        {debug && <Debug.FpsCounter />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-bold opacity-70">α</span>
          <span className="w-10 tabular-nums">{alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-bold opacity-70">z</span>
          <span className="w-10 tabular-nums">{testStat.toFixed(2)}</span>
          <input
            type="range"
            min={-3.5}
            max={3.5}
            step={0.05}
            value={testStat}
            onChange={(e) => setTestStat(Number(e.target.value))}
          />
        </label>
        <select
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
          value={alternative}
          onChange={(e) => setAlternative(e.target.value as "less" | "greater" | "two-sided")}
        >
          <option value="greater">H₁: μ &gt; μ₀ (right-tailed)</option>
          <option value="less">H₁: μ &lt; μ₀ (left-tailed)</option>
          <option value="two-sided">H₁: μ ≠ μ₀ (two-tailed)</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-red-500"
          />
          <span className="opacity-70">Debug</span>
        </label>
      </div>
    </>
  )
}
