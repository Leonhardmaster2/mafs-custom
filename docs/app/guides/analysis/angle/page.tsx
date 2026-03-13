import CodeAndExample from "components/CodeAndExample"
import AngleExample from "guide-examples/analysis/AngleExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Angle",
}

export default function Page() {
  return (
    <>
      <p>
        The Angle component marks and labels angles between two rays sharing a common vertex.
        Supports arc rendering, right-angle squares, filled sectors, and custom labels.
      </p>

      <CodeAndExample example={AngleExample} />

      <h2>Props</h2>
      <ul>
        <li><code>vertex</code> — the vertex point</li>
        <li><code>from</code> / <code>to</code> — endpoints of the two rays</li>
        <li><code>radius</code> — arc radius in world units</li>
        <li><code>label</code> — angle label text (e.g., &ldquo;60&deg;&rdquo; or &ldquo;&pi;/3&rdquo;)</li>
        <li><code>showRightAngle</code> — render a square instead of an arc</li>
        <li><code>filled</code> — fill the sector area</li>
      </ul>
    </>
  )
}
