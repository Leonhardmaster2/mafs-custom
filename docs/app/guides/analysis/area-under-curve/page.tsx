import CodeAndExample from "components/CodeAndExample"
import AreaUnderCurveExample from "guide-examples/analysis/AreaUnderCurveExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Area Under Curve",
}

export default function Page() {
  return (
    <>
      <p>
        AreaUnderCurve shades the region between a function and the x-axis, with optional Riemann
        sum rectangles. Drag the slider to see how the approximation improves as the number of
        rectangles increases.
      </p>

      <CodeAndExample example={AreaUnderCurveExample} />

      <h2>Props</h2>
      <ul>
        <li><code>fn</code> — the function y = fn(x)</li>
        <li><code>from</code> / <code>to</code> — bounds of the region</li>
        <li><code>showBounds</code> — show dashed vertical lines at the bounds</li>
        <li><code>riemannSums</code> — configure rectangles with <code>n</code>, <code>type</code> (left, right, midpoint, trapezoid)</li>
        <li><code>label</code> — text label above the shaded area</li>
      </ul>
    </>
  )
}
