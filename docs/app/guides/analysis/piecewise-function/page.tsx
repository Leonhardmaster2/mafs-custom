import CodeAndExample from "components/CodeAndExample"
import PiecewiseFunctionExample from "guide-examples/analysis/PiecewiseFunctionExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Piecewise Function",
}

export default function Page() {
  return (
    <>
      <p>
        PiecewiseFunction renders multiple function pieces, each with its own domain. Boundary
        endpoints are shown as filled (inclusive) or hollow (exclusive) circles.
      </p>

      <CodeAndExample example={PiecewiseFunctionExample} />

      <h2>Props</h2>
      <ul>
        <li><code>pieces</code> — array of <code>{`{ fn, domain, color? }`}</code></li>
        <li><code>showEndpoints</code> — show open/closed circles at boundaries</li>
        <li><code>endpointConfig</code> — specify which boundaries are inclusive from each side</li>
      </ul>
    </>
  )
}
