import CodeAndExample from "components/CodeAndExample"
import WaveInterference from "guide-examples/examples/WaveInterference"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wave interference",
}

export default function Page() {
  return (
    <>
      <p>
        This example demonstrates the superposition of two sinusoidal waves. The individual waves
        are shown in blue and red at reduced opacity, while their sum (the interference pattern) is
        shown in bold. Drag the points to adjust each wave&apos;s amplitude, and use the slider to
        change the second wave&apos;s frequency to see beats and standing wave patterns.
      </p>

      <CodeAndExample example={WaveInterference} />

      <h2>Concepts demonstrated</h2>
      <ul>
        <li>Constructive and destructive interference</li>
        <li>Beat frequency (when ω₁ ≈ ω₂)</li>
        <li>Traveling waves via <code>useStopwatch</code></li>
        <li>Interactive amplitude control via <code>useMovablePoint</code></li>
      </ul>
    </>
  )
}
