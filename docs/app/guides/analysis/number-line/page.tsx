import CodeAndExample from "components/CodeAndExample"
import NumberLineExample from "guide-examples/analysis/NumberLineExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Number Line",
}

export default function Page() {
  return (
    <>
      <p>
        Number lines visualize intervals, solution sets, and inequalities on a one-dimensional
        axis. Configure open/closed endpoints, interval labels, and individual points.
      </p>

      <CodeAndExample example={NumberLineExample} />

      <h2>Props</h2>
      <ul>
        <li><code>range</code> — the visible range as <code>[min, max]</code></li>
        <li><code>ticks</code> — tick configuration with <code>step</code> and <code>labels</code></li>
        <li><code>intervals</code> — array of intervals with start/end, inclusive/exclusive, color, label</li>
        <li><code>points</code> — individual marked points</li>
        <li><code>arrows</code> — show arrow tips at both ends (default: true)</li>
      </ul>
    </>
  )
}
