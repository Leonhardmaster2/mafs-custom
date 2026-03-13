import CodeAndExample from "components/CodeAndExample"
import NormalDistributionExample from "guide-examples/analysis/NormalDistributionExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Normal Distribution",
}

export default function Page() {
  return (
    <>
      <p>
        NormalDistribution plots the bell curve for a given mean and standard deviation, with
        optional shaded regions, standard deviation markers, and z-score labels.
      </p>

      <CodeAndExample example={NormalDistributionExample} />

      <h2>Props</h2>
      <ul>
        <li><code>mean</code> / <code>stdDev</code> — distribution parameters</li>
        <li><code>shade</code> — single shaded region shorthand</li>
        <li><code>regions</code> — multiple shaded regions with labels</li>
        <li><code>showMeanLine</code> — vertical dashed line at the mean</li>
        <li><code>showStdDevMarkers</code> — tick marks at &mu;&plusmn;&sigma;, &mu;&plusmn;2&sigma;, &mu;&plusmn;3&sigma;</li>
        <li><code>showValues</code> — z-score labels on the markers</li>
      </ul>
    </>
  )
}
