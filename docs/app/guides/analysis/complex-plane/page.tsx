import CodeAndExample from "components/CodeAndExample"
import ComplexPlaneExample from "guide-examples/analysis/ComplexPlaneExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Complex Plane",
}

export default function Page() {
  return (
    <>
      <p>
        ComplexPlane displays complex numbers on an Argand diagram. Points, modulus circles,
        argument arcs, and conjugates are all optional overlays.
      </p>

      <CodeAndExample example={ComplexPlaneExample} />

      <h2>Props</h2>
      <ul>
        <li><code>points</code> — complex numbers as <code>{`{ z: [re, im], label?, color? }`}</code></li>
        <li><code>showConjugate</code> — mirror points across the real axis</li>
        <li><code>showModulus</code> — draw |z| circles</li>
        <li><code>showArgument</code> — draw angle arcs from the positive real axis</li>
      </ul>
    </>
  )
}
