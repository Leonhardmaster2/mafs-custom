import CodeAndExample from "components/CodeAndExample"
import VectorFieldShowcase from "guide-examples/examples/VectorFieldShowcase"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vector field",
}

export default function Page() {
  return (
    <>
      <p>
        This example showcases <code>Plot.VectorField</code> with six different
        field configurations. Drag the yellow center point to move the
        singularity, and switch between sink, source, vortex, saddle, spiral,
        and shear fields using the dropdown. Vectors fade near the center to
        keep the singularity readable.
      </p>

      <CodeAndExample example={VectorFieldShowcase} />

      <h2>Concepts demonstrated</h2>
      <ul>
        <li>Converging (sink) and diverging (source) vector fields</li>
        <li>Rotational (vortex) and combined (spiral sink) flows</li>
        <li>Saddle-point topology with hyperbolic separatrices</li>
        <li>
          Opacity modulation via <code>xyOpacity</code> for visual clarity
        </li>
        <li>
          Interactive center control via <code>useMovablePoint</code>
        </li>
      </ul>
    </>
  )
}
