import CodeAndExample from "components/CodeAndExample"
import AsymptoteExample from "guide-examples/analysis/AsymptoteExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Asymptote",
}

export default function Page() {
  return (
    <>
      <p>
        Asymptote draws dashed lines indicating vertical, horizontal, or oblique asymptotes.
        The lines extend to the viewport edges and stay visible during pan/zoom.
      </p>

      <CodeAndExample example={AsymptoteExample} />

      <h2>Props</h2>
      <ul>
        <li><code>type</code> — &ldquo;vertical&rdquo;, &ldquo;horizontal&rdquo;, or &ldquo;oblique&rdquo;</li>
        <li><code>value</code> — x-coordinate (vertical) or y-coordinate (horizontal)</li>
        <li><code>slope</code> / <code>intercept</code> — for oblique asymptotes</li>
        <li><code>label</code> — text label near the line</li>
        <li><code>style</code> — &ldquo;dashed&rdquo; (default) or &ldquo;solid&rdquo;</li>
      </ul>
    </>
  )
}
