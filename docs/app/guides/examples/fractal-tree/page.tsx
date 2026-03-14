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
        An <strong>infinite</strong> recursive fractal tree with viewport-culled rendering. Zoom in
        as far as you want — new branches are generated on the fly based on what&apos;s visible. The
        tree is self-similar at every scale. Drag the green point horizontally to adjust the branching
        angle.
      </p>

      <CodeAndExample example={FractalTree} />

      <h2>Performance optimizations</h2>
      <ul>
        <li><strong>Hard branch cap</strong> — maximum 12,000 branches per frame, regardless of zoom</li>
        <li><strong>Pixel-size culling</strong> — sub-pixel branches are not rendered or recursed into</li>
        <li><strong>Viewport culling</strong> — entire subtrees outside the visible area are skipped using geometric-series bounding boxes</li>
        <li><strong>No pre-generation</strong> — branches are computed lazily during render, only for the visible region at the current zoom</li>
        <li><strong>Path batching</strong> — one SVG <code>&lt;path&gt;</code> per depth level instead of one per branch</li>
        <li><strong>Inline matrix math</strong> — avoids per-branch <code>vec.transform</code> calls; cos/sin pre-computed once per frame</li>
        <li><strong>Array accumulation</strong> — coordinates stored in typed arrays, joined into SVG path strings once at the end</li>
      </ul>

      <p>
        Toggle <strong>Debug</strong> to see the branch count vs. budget and the current max recursion depth.
      </p>
    </>
  )
}
