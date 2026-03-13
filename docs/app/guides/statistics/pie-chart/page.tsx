import CodeAndExample from "components/CodeAndExample"
import PieChartExample from "guide-examples/statistics/PieChartExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pie Chart",
}

export default function Page() {
  return (
    <>
      <p>
        Pie charts show proportions of a whole. Set <code>innerRadius</code> for a donut chart
        variant. Labels can be positioned inside, outside, or with callout lines.
      </p>

      <CodeAndExample example={PieChartExample} />

      <h2>Props</h2>
      <ul>
        <li><code>data</code> — slices with label, value, and optional color</li>
        <li><code>innerRadius</code> — greater than 0 for donut chart</li>
        <li><code>labelPosition</code> — &ldquo;inside&rdquo;, &ldquo;outside&rdquo;, or &ldquo;callout&rdquo;</li>
        <li><code>showValues</code> — display raw values alongside percentages</li>
        <li><code>centerLabel</code> — center text for donut charts</li>
      </ul>
    </>
  )
}
