import CodeAndExample from "components/CodeAndExample"
import EpicycloidTracer from "guide-examples/examples/EpicycloidTracer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fourier epicycles",
}

export default function Page() {
  return (
    <>
      <p>
        A chain of rotating circles (epicycles) traces out a curve, demonstrating the geometric
        interpretation of Fourier series. This example uses the odd harmonics of a square wave — as
        you add more harmonics, the traced path converges to a square wave shape.
      </p>

      <CodeAndExample example={EpicycloidTracer} />

      <h2>Concepts demonstrated</h2>
      <ul>
        <li>Fourier series as rotating circles</li>
        <li>Convergence of partial sums to the target function</li>
        <li>Continuous animation via <code>useStopwatch</code></li>
        <li>Trail accumulation via <code>React.useRef</code></li>
      </ul>
    </>
  )
}
