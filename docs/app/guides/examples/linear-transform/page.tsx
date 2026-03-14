import CodeAndExample from "components/CodeAndExample"
import LinearTransform from "guide-examples/examples/LinearTransform"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Linear transform",
}

export default function Page() {
  return (
    <>
      <p>
        This example visualizes a 2×2 linear transformation on the plane. Drag the red and blue
        points to define the columns of the transformation matrix — where the standard basis vectors
        e₁ and e₂ map to. Use the slider to animate the interpolation from the identity matrix to
        the target transformation.
      </p>

      <CodeAndExample example={LinearTransform} />

      <h2>Features</h2>
      <ul>
        <li>Deformed grid showing how the transformation warps space</li>
        <li>Original and transformed basis vectors</li>
        <li>Unit square → parallelogram visualization</li>
        <li>Eigenvector lines (when eigenvalues are real)</li>
        <li>Determinant display inside the transformed shape</li>
        <li>Smooth animation via the <code>t</code> parameter</li>
      </ul>
    </>
  )
}
