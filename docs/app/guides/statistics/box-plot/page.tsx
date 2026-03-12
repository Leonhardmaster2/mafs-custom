import CodeAndExample from "components/CodeAndExample"
import BoxPlotExample from "guide-examples/statistics/BoxPlotExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Box Plot",
}

export default function Page() {
  return (
    <>
      <p>
        Box plots display the five-number summary (min, Q1, median, Q3, max) of a dataset. Pass
        raw data as an array of numbers, or provide a pre-computed summary object.
      </p>

      <CodeAndExample example={BoxPlotExample} />
    </>
  )
}
