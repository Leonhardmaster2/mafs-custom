import CodeAndExample from "components/CodeAndExample"
import TaylorSeriesExample from "guide-examples/analysis/TaylorSeriesExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Taylor Series",
}

export default function Page() {
  return (
    <>
      <p>
        TaylorSeries visualizes Taylor (or Maclaurin) polynomial approximations of a function
        around a given center point. Drag the center point and adjust the order slider to see how
        higher-order polynomials converge to the original function.
      </p>

      <CodeAndExample example={TaylorSeriesExample} />

      <h2>Props</h2>
      <ul>
        <li><code>fn</code> — the function to approximate</li>
        <li><code>center</code> — expansion point (default 0 for Maclaurin)</li>
        <li><code>order</code> — degree of the polynomial</li>
        <li><code>showOriginal</code> — show the original function curve</li>
        <li><code>showError</code> — shade the region between f(x) and T_n(x)</li>
        <li><code>derivatives</code> — optional analytical derivatives for accuracy at high orders</li>
      </ul>
    </>
  )
}
