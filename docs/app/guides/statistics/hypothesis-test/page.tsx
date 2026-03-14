import CodeAndExample from "components/CodeAndExample"
import HypothesisTestExample from "guide-examples/statistics/HypothesisTestExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hypothesis Test",
}

export default function Page() {
  return (
    <>
      <p>
        HypothesisTest visualizes a statistical hypothesis test on a normal distribution. It shows
        the rejection region(s), critical values, the test statistic, p-value area, and the
        decision. Supports one-sided (left/right) and two-sided tests.
      </p>

      <CodeAndExample example={HypothesisTestExample} />

      <h2>Props</h2>
      <ul>
        <li><code>alternative</code> — &quot;less&quot;, &quot;greater&quot;, or &quot;two-sided&quot;</li>
        <li><code>alpha</code> — significance level (default 0.05)</li>
        <li><code>testStatistic</code> — z-score of the observed statistic</li>
        <li><code>showRejectionRegion</code> — shade the rejection region(s)</li>
        <li><code>showPValue</code> — shade the p-value area</li>
        <li><code>showDecision</code> — display &quot;Reject H₀&quot; or &quot;Fail to reject H₀&quot;</li>
      </ul>
    </>
  )
}
