import CodeAndExample from "components/CodeAndExample"
import StemAndLeafExample from "guide-examples/statistics/StemAndLeafExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Stem-and-Leaf",
}

export default function Page() {
  return (
    <>
      <p>
        Stem-and-leaf plots organize numerical data by splitting each value into a stem and leaf.
        Data is automatically sorted and grouped with missing stems filled in.
      </p>

      <CodeAndExample example={StemAndLeafExample} />
    </>
  )
}
