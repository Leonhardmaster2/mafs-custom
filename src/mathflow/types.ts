/**
 * MathFlow Type Definitions
 *
 * Defines the full (expanded) payload format consumed by the renderer,
 * and the compact shorthand format output by the AI.
 */

// ---------------------------------------------------------------------------
// Shared sub-types
// ---------------------------------------------------------------------------

export type Vector2 = [number, number]

export interface SliderConfig {
  id: string
  min: number
  max: number
  step: number
  default: number
  label?: string
}

export interface ViewBoxConfig {
  x: Vector2
  y: Vector2
  padding?: number
}

// ---------------------------------------------------------------------------
// Compact (AI-output) format — minimal JSON the AI sends
// ---------------------------------------------------------------------------

export interface CompactSlider {
  /** [id, min, max, default] or [id, min, max, step, default] */
  0: string
  1: number
  2: number
  3?: number
  4?: number
}

/** Union of all compact visualization payloads keyed by `t` */
export type CompactPayload =
  | CompactGraph
  | CompactAreaUnderCurve
  | CompactTangentLine
  | CompactUnitCircle
  | CompactNumberLine
  | CompactVennDiagram
  | CompactTruthTable
  | CompactEquationSteps
  | CompactBoxPlot
  | CompactHistogram
  | CompactScatterPlot
  | CompactNormalDist
  | CompactProbabilityTree
  | CompactStemAndLeaf
  | CompactPiecewise
  | CompactAngle
  | CompactComplexPlane
  | CompactBarChart
  | CompactPieChart

export interface CompactGraph {
  t: "g"
  fn: string[]
  d?: Vector2
  r?: Vector2
  s?: (string | number)[][]
  c?: string[]
  vb?: [number, number, number, number]
}

export interface CompactAreaUnderCurve {
  t: "auc"
  fn: string
  a: number
  b: number
  r?: "left" | "right" | "midpoint" | "trapezoid"
  n?: number
  c?: string
  vb?: [number, number, number, number]
}

export interface CompactTangentLine {
  t: "tan"
  fn: string
  at: number | string
  s?: (string | number)[][]
  c?: string
  vb?: [number, number, number, number]
}

export interface CompactUnitCircle {
  t: "uc"
  angle?: number
  show?: ("sin" | "cos" | "tan")[]
}

export interface CompactNumberLine {
  t: "nl"
  r: Vector2
  iv?: [number, number, boolean?, boolean?][]
  pts?: [number, string?][]
  c?: string
}

export interface CompactVennDiagram {
  t: "vn"
  /** Sets as [label, elements[]] — expander computes exclusive counts and intersections */
  sets: [string, (number | string)[]][]
  comp?: number | string
  c?: string[]
}

export interface CompactTruthTable {
  t: "tt"
  vars: string[]
  expr: string[]
}

export interface CompactEquationSteps {
  t: "eq"
  steps: [string, string?][]
}

export interface CompactBoxPlot {
  t: "bp"
  data: number[]
  c?: string
}

export interface CompactHistogram {
  t: "hist"
  data?: number[]
  bins?: number[]
  raw?: number[]
  bc?: number
  c?: string
}

export interface CompactScatterPlot {
  t: "sc"
  pts: Vector2[]
  reg?: "linear" | "quadratic" | "exponential" | "none"
  c?: string
}

export interface CompactNormalDist {
  t: "norm"
  m?: number
  sd?: number
  shade?: [number, number, string?][]
  sm?: boolean
}

export interface CompactProbabilityTree {
  t: "pt"
  tree: ProbabilityNode[]
}

/** Nested array: [probability, label, children?] */
export type ProbabilityNode = [number | string, string, ProbabilityNode[]?]

export interface CompactStemAndLeaf {
  t: "sl"
  data: number[]
}

export interface CompactPiecewise {
  t: "pw"
  pieces: [string, Vector2][]
  ep?: [number, boolean?, boolean?][]
  vb?: [number, number, number, number]
}

export interface CompactAngle {
  t: "ang"
  v: Vector2
  from: Vector2
  to: Vector2
  label?: string
  c?: string
}

export interface CompactComplexPlane {
  t: "cp"
  pts: [number, number, string?][]
  show?: ("mod" | "arg" | "conj")[]
}

export interface CompactBarChart {
  t: "bar"
  data: [string, number][]
  c?: string
  o?: "vertical" | "horizontal"
}

export interface CompactPieChart {
  t: "pie"
  data: [string, number][]
}

// ---------------------------------------------------------------------------
// Full (expanded) payload — consumed by the renderer
// ---------------------------------------------------------------------------

export type MathFlowPayload =
  | GraphPayload
  | AreaUnderCurvePayload
  | TangentLinePayload
  | UnitCirclePayload
  | NumberLinePayload
  | VennDiagramPayload
  | TruthTablePayload
  | EquationStepsPayload
  | BoxPlotPayload
  | HistogramPayload
  | ScatterPlotPayload
  | NormalDistPayload
  | ProbabilityTreePayload
  | StemAndLeafPayload
  | PiecewisePayload
  | AnglePayload
  | ComplexPlanePayload
  | BarChartPayload
  | PieChartPayload

export interface GraphPayload {
  type: "graph"
  functions: {
    expression: string
    color?: string
  }[]
  domain: Vector2
  range: Vector2
  sliders: SliderConfig[]
  viewBox: ViewBoxConfig
}

export interface AreaUnderCurvePayload {
  type: "areaUnderCurve"
  expression: string
  from: number
  to: number
  riemannType: "left" | "right" | "midpoint" | "trapezoid"
  riemannN: number
  showAreaComparison: boolean
  color: string
  viewBox: ViewBoxConfig
}

export interface TangentLinePayload {
  type: "tangentLine"
  expression: string
  at: number | string
  showSlope: boolean
  showPoint: boolean
  tangentColor: string
  dx: number
  sliders: SliderConfig[]
  viewBox: ViewBoxConfig
}

export interface UnitCirclePayload {
  type: "unitCircle"
  angle: number
  show: ("sin" | "cos" | "tan")[]
  draggable: boolean
}

export interface NumberLinePayload {
  type: "numberLine"
  range: Vector2
  intervals: {
    start: number
    end: number
    startInclusive: boolean
    endInclusive: boolean
    color?: string
    label?: string
  }[]
  points: {
    value: number
    label?: string
    color?: string
  }[]
  arrows: boolean
  color: string
}

export interface VennDiagramPayload {
  type: "vennDiagram"
  sets: { label: string; exclusive: number | string }[]
  intersections: { sets: number[]; value: number | string }[]
  complementValue?: number | string
  colors: string[]
}

export interface TruthTablePayload {
  type: "truthTable"
  variables: string[]
  expressions: string[]
}

export interface EquationStepsPayload {
  type: "equationSteps"
  steps: { expression: string; annotation?: string }[]
}

export interface BoxPlotPayload {
  type: "boxPlot"
  data: number[]
  color: string
}

export interface HistogramPayload {
  type: "histogram"
  data?: number[]
  bins?: number[]
  rawData?: number[]
  binCount?: number
  color: string
}

export interface ScatterPlotPayload {
  type: "scatterPlot"
  points: Vector2[]
  regression: {
    type: "linear" | "quadratic" | "exponential" | "none"
    showEquation: boolean
    showR2: boolean
  }
  color: string
}

export interface NormalDistPayload {
  type: "normalDistribution"
  mean: number
  stdDev: number
  regions: { from: number; to: number; label?: string }[]
  showMeanLine: boolean
  showStdDevMarkers: boolean
  color: string
}

export interface ProbabilityTreePayload {
  type: "probabilityTree"
  data: ProbabilityBranchPayload[]
}

export interface ProbabilityBranchPayload {
  label: string
  probability: string | number
  children?: ProbabilityBranchPayload[]
}

export interface StemAndLeafPayload {
  type: "stemAndLeaf"
  data: number[]
}

export interface PiecewisePayload {
  type: "piecewise"
  pieces: { expression: string; domain: Vector2 }[]
  endpoints: { value: number; fromLeft: boolean; fromRight: boolean }[]
  viewBox: ViewBoxConfig
}

export interface AnglePayload {
  type: "angle"
  vertex: Vector2
  from: Vector2
  to: Vector2
  label: string
  color: string
  radius: number
}

export interface ComplexPlanePayload {
  type: "complexPlane"
  points: { z: Vector2; label?: string }[]
  showConjugate: boolean
  showModulus: boolean
  showArgument: boolean
}

export interface BarChartPayload {
  type: "barChart"
  data: { label: string; value: number }[]
  orientation: "vertical" | "horizontal"
  color: string
}

export interface PieChartPayload {
  type: "pieChart"
  data: { label: string; value: number }[]
}
