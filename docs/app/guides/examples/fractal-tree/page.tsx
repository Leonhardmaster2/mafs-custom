import CodeAndExample from "components/CodeAndExample"
import FractalTree from "guide-examples/examples/FractalTree"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fractal tree",
}

export default function Page() {
  return (
    <>
      <p>
        A recursive fractal tree that grows from trunk to tips with animated branching. Drag the
        green point horizontally to adjust the branching angle. Scroll to zoom into the tree and
        explore the self-similar branching structure — the coordinate grid automatically adapts
        to the zoom level, showing finer subdivisions (0.1, 0.01, …) as you zoom in. Toggle
        the <strong>Debug</strong> checkbox to see the pane-based lazy loading in action — only
        the visible region is rendered.
      </p>

      <CodeAndExample example={FractalTree} />

      <h2>Concepts demonstrated</h2>
      <ul>
        <li>Recursive geometry with configurable depth</li>
        <li>Animated growth using <code>useStopwatch</code></li>
        <li>Path batching for rendering 1000+ branches efficiently</li>
        <li>HSL color interpolation by depth</li>
        <li>Auto-scaling coordinate grid via <code>xAxis=&quot;auto&quot;</code></li>
        <li>Debug mode showing the optimized viewport and pane boundaries</li>
      </ul>
    </>
  )
}
