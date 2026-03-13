import CodeAndExample from "components/CodeAndExample"
import HistogramExample from "guide-examples/statistics/HistogramExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Histogram",
}

export default function Page() {
  return (
    <>
      <p>
        Histograms display frequency distributions with touching bars. Pass pre-computed
        frequencies with bin edges, or raw data for automatic binning.
      </p>

      <CodeAndExample example={HistogramExample} />

      <h2>Props</h2>
      <ul>
        <li><code>data</code> + <code>bins</code> — frequencies and bin edges</li>
        <li><code>rawData</code> + <code>binCount</code> — auto-bin from raw values</li>
        <li><code>showFrequencyLabels</code> — numbers above each bar</li>
        <li><code>showBinLabels</code> — edge values on the x-axis</li>
      </ul>
    </>
  )
}
