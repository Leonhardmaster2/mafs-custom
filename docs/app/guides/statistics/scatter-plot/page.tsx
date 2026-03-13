import CodeAndExample from "components/CodeAndExample"
import ScatterPlotExample from "guide-examples/statistics/ScatterPlotExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Scatter Plot",
}

export default function Page() {
  return (
    <>
      <p>
        ScatterPlot renders data points with optional regression lines. Supports linear,
        quadratic, and exponential regression with equation and R&sup2; display.
      </p>

      <CodeAndExample example={ScatterPlotExample} />

      <h2>Props</h2>
      <ul>
        <li><code>points</code> — single series of [x, y] pairs</li>
        <li><code>series</code> — multiple color-coded series</li>
        <li><code>regression</code> — type, showEquation, showR2</li>
        <li><code>showMeanLines</code> — horizontal and vertical mean lines</li>
      </ul>
    </>
  )
}
