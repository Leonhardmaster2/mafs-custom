import CodeAndExample from "components/CodeAndExample"
import TangentLineExample from "guide-examples/analysis/TangentLineExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tangent Line",
}

export default function Page() {
  return (
    <>
      <p>
        TangentLine computes the numerical derivative of a function at a given x-value and draws
        the tangent line. Use it alongside <code>Plot.OfX</code> for interactive derivative
        exploration.
      </p>

      <CodeAndExample example={TangentLineExample} />

      <h2>Props</h2>
      <ul>
        <li><code>fn</code> — the function y = fn(x)</li>
        <li><code>at</code> — the x-value where the tangent touches</li>
        <li><code>length</code> — how far the tangent line extends</li>
        <li><code>showPoint</code> — show a dot at the tangent point</li>
        <li><code>showSlope</code> — display the slope value</li>
        <li><code>dx</code> — step size for numerical differentiation</li>
      </ul>
    </>
  )
}
