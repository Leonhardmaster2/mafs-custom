import CodeAndExample from "components/CodeAndExample"
import VennDiagramExample from "guide-examples/statistics/VennDiagramExample"
import VennDiagram3SetExample from "guide-examples/statistics/VennDiagram3SetExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Venn Diagram",
}

export default function Page() {
  return (
    <>
      <p>
        Venn diagrams show set relationships with overlapping circles. Supports 2-set and 3-set
        configurations with labeled intersection regions and an optional universal set rectangle.
        Click on the regions to highlight them interactively.
      </p>

      <CodeAndExample example={VennDiagramExample} />

      <h2>Three-set Venn diagram</h2>
      <p>
        Three overlapping sets arranged in an equilateral triangle layout, with all pairwise and
        triple intersections labeled.
      </p>

      <CodeAndExample example={VennDiagram3SetExample} />
    </>
  )
}
