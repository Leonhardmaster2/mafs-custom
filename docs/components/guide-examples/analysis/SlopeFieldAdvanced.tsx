"use client"

import { useState } from "react"
import { Mafs, Coordinates, SlopeField, Debug, useMovablePoint, Theme } from "mafs"

/**
 * Advanced slope field example: a nonlinear predator-prey-inspired ODE
 * and other exotic fields with multiple solution curves and Euler comparison.
 */

const ODES: Record<
  string,
  { label: string; fn: (x: number, y: number) => number; desc: string }
> = {
  logistic: {
    label: "dy/dx = y(1 − y/3)",
    fn: (_x, y) => y * (1 - y / 3),
    desc: "Logistic growth — solutions converge to carrying capacity y = 3",
  },
  vanderpol: {
    label: "dy/dx = (1 − x²)y − x",
    fn: (x, y) => (1 - x * x) * y - x,
    desc: "Van der Pol oscillator — limit cycle behaviour with nonlinear damping",
  },
  pendulum: {
    label: "dy/dx = −sin(x)",
    fn: (x) => -Math.sin(x),
    desc: "Pendulum — periodic equilibria at x = nπ, separatrices visible",
  },
  cusp: {
    label: "dy/dx = x² + y²",
    fn: (x, y) => x * x + y * y,
    desc: "Explosive growth — solutions blow up in finite time",
  },
  damped: {
    label: "dy/dx = −0.3y + sin(2x)",
    fn: (x, y) => -0.3 * y + Math.sin(2 * x),
    desc: "Damped oscillation with periodic forcing",
  },
  riccati: {
    label: "dy/dx = y² − x",
    fn: (x, y) => y * y - x,
    desc: "Riccati equation — parabolic separatrix between bounded and blowup regions",
  },
}

export default function SlopeFieldAdvanced() {
  const [odeKey, setOdeKey] = useState("vanderpol")
  const [method, setMethod] = useState<"rk4" | "euler">("rk4")
  const [debug, setDebug] = useState(false)
  const ode = ODES[odeKey]

  const p1 = useMovablePoint([0, 2], { color: Theme.blue })
  const p2 = useMovablePoint([-2, -1], { color: Theme.red })
  const p3 = useMovablePoint([1, -2], { color: Theme.green })
  const p4 = useMovablePoint([3, 0.5], { color: Theme.yellow })

  return (
    <>
      <Mafs
        height={500}
        viewBox={{ x: [-6, 6], y: [-5, 5] }}
        pan
        zoom={{ min: 0.001, max: 10000 }}
        debug={debug}
      >
        <Coordinates.Cartesian xAxis="auto" yAxis="auto" />
        <SlopeField
          ode={ode.fn}
          step="auto"
          opacity={0.4}
          integrationMethod={method}
          solutions={[
            { initialCondition: p1.point, color: Theme.blue, weight: 2.5 },
            { initialCondition: p2.point, color: Theme.red, weight: 2.5 },
            { initialCondition: p3.point, color: Theme.green, weight: 2.5 },
            { initialCondition: p4.point, color: Theme.yellow, weight: 2.5, style: "dashed" },
          ]}
        />
        {p1.element}
        {p2.element}
        {p3.element}
        {p4.element}
        {debug && <Debug.ViewportInfo />}
        {debug && <Debug.FpsCounter />}
      </Mafs>

      <div className="p-4 border-gray-700 border-t bg-black text-white flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold opacity-70">ODE</span>
        <select
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 font-mono"
          value={odeKey}
          onChange={(e) => setOdeKey(e.target.value)}
        >
          {Object.entries(ODES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <span className="text-sm font-bold opacity-70 ml-2">Method</span>
        <select
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 font-mono"
          value={method}
          onChange={(e) => setMethod(e.target.value as "rk4" | "euler")}
        >
          <option value="rk4">RK4</option>
          <option value="euler">Euler</option>
        </select>

        <label className="flex items-center gap-2 text-sm ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-red-500"
          />
          <span className="opacity-70">Debug</span>
        </label>
      </div>
      <div className="px-4 py-2 bg-black border-gray-700 border-t text-white">
        <p className="text-xs opacity-60 italic">{ode.desc}</p>
        <p className="text-xs opacity-40 mt-1">
          4 solution curves · Drag points to change ICs · Switch to Euler to see numerical drift · Scroll to zoom
        </p>
      </div>
    </>
  )
}
