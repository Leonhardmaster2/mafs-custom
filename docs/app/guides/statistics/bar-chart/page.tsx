import CodeAndExample from "components/CodeAndExample"
import BarChartExample from "guide-examples/statistics/BarChartExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bar Chart",
}

export default function Page() {
  return (
    <>
      <p>
        Bar charts display categorical data with gaps between bars. Supports simple and grouped
        modes, vertical and horizontal orientation.
      </p>

      <CodeAndExample example={BarChartExample} />

      <h2>Props</h2>
      <ul>
        <li><code>data</code> — simple items with label and value</li>
        <li><code>groups</code> — grouped bars with multiple values per group</li>
        <li><code>orientation</code> — &ldquo;vertical&rdquo; or &ldquo;horizontal&rdquo;</li>
        <li><code>showValueLabels</code> — numbers above/beside bars</li>
      </ul>
    </>
  )
}
