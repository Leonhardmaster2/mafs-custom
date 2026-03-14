import CodeAndExample from "components/CodeAndExample"
import GeometricConstructionExample from "guide-examples/analysis/GeometricConstructionExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Geometric Construction",
}

export default function Page() {
  return (
    <>
      <p>
        GeometricConstruction renders classic compass-and-straightedge constructions with
        step-by-step reveal. Define a construction as an ordered list of steps (given points,
        compass arcs, straightedge lines, intersections). Use the slider to build up the
        construction one step at a time.
      </p>

      <CodeAndExample example={GeometricConstructionExample} />

      <h2>Props</h2>
      <ul>
        <li><code>construction</code> — ordered array of construction steps</li>
        <li><code>visibleSteps</code> — how many steps to reveal</li>
        <li><code>showLabels</code> — show point labels</li>
        <li><code>arcColor</code> / <code>resultColor</code> / <code>givenColor</code> — customize colors</li>
      </ul>

      <h2>Step types</h2>
      <ul>
        <li><code>given-point</code> — a named point at a position</li>
        <li><code>given-segment</code> — segment between two named points</li>
        <li><code>compass-arc</code> — arc centered at a point, radius defined by another point</li>
        <li><code>line-through</code> — infinite line through two points</li>
        <li><code>intersection</code> — computed intersection of two objects</li>
        <li><code>result-segment</code> / <code>result-line</code> — the construction result, rendered prominently</li>
      </ul>
    </>
  )
}
