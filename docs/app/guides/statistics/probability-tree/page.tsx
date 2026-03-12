import CodeAndExample from "components/CodeAndExample"
import ProbabilityTreeExample from "guide-examples/statistics/ProbabilityTreeExample"
import ProbabilityTreeLargeExample from "guide-examples/statistics/ProbabilityTreeLargeExample"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Probability Tree",
}

export default function Page() {
  return (
    <>
      <p>
        Probability trees visualize multi-stage experiments. Each branch shows the probability of
        an outcome, and leaf nodes display the combined result labels. Click <strong>Simulate</strong>{" "}
        to watch an animated marble travel through the tree, choosing branches based on their
        probabilities.
      </p>

      <CodeAndExample example={ProbabilityTreeExample} />

      <h2>Irregular multi-stage tree</h2>
      <p>
        Trees can have different depths per branch. Here a 3-stage weather/transport experiment has
        some branches that terminate earlier than others.
      </p>

      <CodeAndExample example={ProbabilityTreeLargeExample} />
    </>
  )
}
