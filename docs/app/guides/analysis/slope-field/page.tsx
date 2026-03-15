import CodeAndExample from "components/CodeAndExample"
import SlopeFieldExample from "guide-examples/analysis/SlopeFieldExample"
import SlopeFieldAdvanced from "guide-examples/analysis/SlopeFieldAdvanced"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Slope Field",
}

export default function Page() {
  return (
    <>
      <p>
        SlopeField renders the direction field of a first-order ordinary differential equation{" "}
        <code>dy/dx = f(x, y)</code>. Short line segments at each grid point indicate the slope.
        Pick different ODEs from the dropdown, drag the blue and red points to change
        initial conditions, and zoom in to explore — the slope segments automatically get denser
        as you zoom in, revealing finer detail. Solution curves are computed via RK4 integration.
        Toggle <strong>Debug</strong> to see the optimized pane-based rendering.
      </p>

      <CodeAndExample example={SlopeFieldExample} />

      <h2>Advanced: multi-curve exploration</h2>
      <p>
        This second example features more exotic ODEs — logistic growth, Van der Pol oscillator,
        pendulum dynamics, explosive growth, and a Riccati equation — with four draggable solution
        curves. Switch between <strong>RK4</strong> and <strong>Euler</strong> integration to see
        how numerical method choice affects solution accuracy on stiff or unstable equations.
        The dashed yellow curve lets you visually compare against the solid ones.
      </p>

      <CodeAndExample example={SlopeFieldAdvanced} />

      <h2>Props</h2>
      <ul>
        <li><code>ode</code> — the function f(x, y) defining dy/dx</li>
        <li><code>step</code> — grid spacing: a number in world units, or <code>&quot;auto&quot;</code> to adapt to zoom level</li>
        <li><code>solutions</code> — array of initial conditions for solution curves</li>
        <li><code>integrationMethod</code> — &quot;euler&quot; or &quot;rk4&quot;</li>
        <li><code>integrationStep</code> — step size for numerical integration, or <code>&quot;auto&quot;</code></li>
        <li><code>segmentLength</code> — length of each slope segment</li>
        <li><code>color</code> — color of slope segments</li>
        <li><code>opacity</code> — opacity of slope segments (default 0.6)</li>
        <li><code>weight</code> — stroke weight for slope segments</li>
      </ul>
    </>
  )
}
