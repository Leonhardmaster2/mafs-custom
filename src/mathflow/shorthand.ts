/**
 * MathFlow Shorthand Expander
 *
 * Converts compact AI-output JSON into full MathFlowPayload objects
 * that the renderer can consume. This is a preprocessor layer —
 * the renderer itself does NOT change.
 */

import { DEFAULTS } from "./defaults"
import type {
  MathFlowPayload,
  GraphPayload,
  AreaUnderCurvePayload,
  TangentLinePayload,
  UnitCirclePayload,
  NumberLinePayload,
  VennDiagramPayload,
  TruthTablePayload,
  EquationStepsPayload,
  BoxPlotPayload,
  HistogramPayload,
  ScatterPlotPayload,
  NormalDistPayload,
  ProbabilityTreePayload,
  ProbabilityBranchPayload,
  StemAndLeafPayload,
  PiecewisePayload,
  AnglePayload,
  ComplexPlanePayload,
  BarChartPayload,
  PieChartPayload,
  SliderConfig,
  ViewBoxConfig,
  Vector2,
  ProbabilityNode,
} from "./types"

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function expandShorthand(
  compact: Record<string, unknown>,
): MathFlowPayload {
  const type = compact.t as string
  if (!type) throw new Error("Missing type field 't' in compact payload")

  switch (type) {
    case "g":
      return expandGraph(compact)
    case "auc":
      return expandAreaUnderCurve(compact)
    case "tan":
      return expandTangentLine(compact)
    case "uc":
      return expandUnitCircle(compact)
    case "nl":
      return expandNumberLine(compact)
    case "vn":
      return expandVennDiagram(compact)
    case "tt":
      return expandTruthTable(compact)
    case "eq":
      return expandEquationSteps(compact)
    case "bp":
      return expandBoxPlot(compact)
    case "hist":
      return expandHistogram(compact)
    case "sc":
      return expandScatterPlot(compact)
    case "norm":
      return expandNormalDist(compact)
    case "pt":
      return expandProbabilityTree(compact)
    case "sl":
      return expandStemAndLeaf(compact)
    case "pw":
      return expandPiecewise(compact)
    case "ang":
      return expandAngle(compact)
    case "cp":
      return expandComplexPlane(compact)
    case "bar":
      return expandBarChart(compact)
    case "pie":
      return expandPieChart(compact)
    default:
      throw new Error(`Unknown visualization type: ${type}`)
  }
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function requireField(
  c: Record<string, unknown>,
  field: string,
  typeName: string,
): void {
  if (c[field] === undefined || c[field] === null) {
    throw new Error(`${typeName} requires '${field}' field`)
  }
}

function requireArray(
  c: Record<string, unknown>,
  field: string,
  typeName: string,
): void {
  requireField(c, field, typeName)
  if (!Array.isArray(c[field])) {
    throw new Error(`${typeName} '${field}' must be an array`)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses slider arrays. Two formats:
 * - 4 elements: [id, min, max, default] — step defaults to 0.1
 * - 5 elements: [id, min, max, step, default] — explicit step
 */
function parseSliders(raw?: unknown[][]): SliderConfig[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((s) => {
    if (s.length === 4) {
      return {
        id: String(s[0]),
        min: Number(s[1]),
        max: Number(s[2]),
        step: DEFAULTS.slider.step,
        default: Number(s[3]),
      }
    }
    return {
      id: String(s[0]),
      min: Number(s[1]),
      max: Number(s[2]),
      step: Number(s[3]),
      default: Number(s[4]),
    }
  })
}

function parseViewBox(
  vb?: [number, number, number, number],
  domain?: Vector2,
  range?: Vector2,
): ViewBoxConfig {
  if (vb) {
    return { x: [vb[0], vb[1]], y: [vb[2], vb[3]] }
  }
  return {
    x: domain ?? [...DEFAULTS.graph.domain],
    y: range ?? [...DEFAULTS.graph.range],
  }
}

function assignColors(count: number, explicit?: string[]): string[] {
  const cycle = DEFAULTS.colorCycle
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(explicit?.[i] ?? cycle[i % cycle.length])
  }
  return result
}

// ---------------------------------------------------------------------------
// Individual expanders
// ---------------------------------------------------------------------------

function expandGraph(c: Record<string, unknown>): GraphPayload {
  requireArray(c, "fn", "graph")
  const fnList = c.fn as string[]
  const domain = (c.d as Vector2) ?? [...DEFAULTS.graph.domain]
  const range = (c.r as Vector2) ?? [...DEFAULTS.graph.range]
  const colors = assignColors(fnList.length, c.c as string[] | undefined)

  return {
    type: "graph",
    functions: fnList.map((expr, i) => ({
      expression: expr,
      color: colors[i],
    })),
    domain,
    range,
    sliders: parseSliders(c.s as unknown[][] | undefined),
    viewBox: parseViewBox(
      c.vb as [number, number, number, number] | undefined,
      domain,
      range,
    ),
  }
}

function expandAreaUnderCurve(
  c: Record<string, unknown>,
): AreaUnderCurvePayload {
  requireField(c, "fn", "auc")
  requireField(c, "a", "auc")
  requireField(c, "b", "auc")

  const from = Number(c.a)
  const to = Number(c.b)
  // Auto-fit viewBox around the integration bounds with padding
  const xPad = Math.max((to - from) * 0.3, 1)

  return {
    type: "areaUnderCurve",
    expression: c.fn as string,
    from,
    to,
    riemannType:
      (c.r as AreaUnderCurvePayload["riemannType"]) ??
      DEFAULTS.auc.riemannType,
    riemannN: (c.n as number) ?? DEFAULTS.auc.n,
    showAreaComparison: DEFAULTS.auc.showAreaComparison,
    color: (c.c as string) ?? DEFAULTS.auc.color,
    viewBox: parseViewBox(
      c.vb as [number, number, number, number] | undefined,
      [from - xPad, to + xPad],
      [-2, 10],
    ),
  }
}

function expandTangentLine(c: Record<string, unknown>): TangentLinePayload {
  requireField(c, "fn", "tan")
  requireField(c, "at", "tan")

  return {
    type: "tangentLine",
    expression: c.fn as string,
    at: c.at as number | string,
    showSlope: DEFAULTS.tangent.showSlope,
    showPoint: DEFAULTS.tangent.showPoint,
    tangentColor: (c.c as string) ?? DEFAULTS.tangent.tangentColor,
    dx: DEFAULTS.tangent.dx,
    sliders: parseSliders(c.s as unknown[][] | undefined),
    viewBox: parseViewBox(
      c.vb as [number, number, number, number] | undefined,
    ),
  }
}

function expandUnitCircle(c: Record<string, unknown>): UnitCirclePayload {
  return {
    type: "unitCircle",
    angle: (c.angle as number) ?? DEFAULTS.unitCircle.angle,
    show:
      (c.show as ("sin" | "cos" | "tan")[]) ?? [...DEFAULTS.unitCircle.show],
    draggable: DEFAULTS.unitCircle.draggable,
  }
}

function expandNumberLine(c: Record<string, unknown>): NumberLinePayload {
  requireArray(c, "r", "nl")
  const ivRaw = (c.iv as [number, number, boolean?, boolean?][]) ?? []
  const ptsRaw = (c.pts as [number, string?][]) ?? []

  return {
    type: "numberLine",
    range: c.r as Vector2,
    intervals: ivRaw.map((iv) => ({
      start: iv[0],
      end: iv[1],
      startInclusive: iv[2] ?? DEFAULTS.numberLine.intervalStartInclusive,
      endInclusive: iv[3] ?? DEFAULTS.numberLine.intervalEndInclusive,
    })),
    points: ptsRaw.map((pt) => ({
      value: pt[0],
      label: pt[1],
    })),
    arrows: DEFAULTS.numberLine.arrows,
    color: (c.c as string) ?? DEFAULTS.numberLine.color,
  }
}

/**
 * Venn diagram expander.
 *
 * The AI sends element arrays per set:
 *   sets: [["A", [1,3,5,7,9]], ["B", [2,3,5,8,9]]]
 *
 * The renderer expects exclusive counts and intersection values.
 * This function computes the set-theoretic breakdown automatically.
 */
function expandVennDiagram(c: Record<string, unknown>): VennDiagramPayload {
  requireArray(c, "sets", "vn")
  const setsRaw = c.sets as [string, (number | string)[]][]

  if (setsRaw.length < 2 || setsRaw.length > 3) {
    throw new Error("vn requires 2 or 3 sets")
  }

  const setElements = setsRaw.map(([, elements]) => new Set(elements))
  const labels = setsRaw.map(([label]) => label)

  // Compute all intersection regions
  const intersections: { sets: number[]; value: number | string }[] = []

  if (setElements.length === 2) {
    // A ∩ B
    const ab = [...setElements[0]].filter((e) => setElements[1].has(e))
    if (ab.length > 0) {
      intersections.push({ sets: [0, 1], value: ab.length })
    }
  } else {
    // 3-set: compute pairwise and triple intersections
    const ab = [...setElements[0]].filter((e) => setElements[1].has(e))
    const ac = [...setElements[0]].filter((e) => setElements[2].has(e))
    const bc = [...setElements[1]].filter((e) => setElements[2].has(e))
    const abc = ab.filter((e) => setElements[2].has(e))

    // Pairwise exclusive (subtract triple)
    const abOnly = ab.length - abc.length
    const acOnly = ac.length - abc.length
    const bcOnly = bc.length - abc.length

    if (abOnly > 0) intersections.push({ sets: [0, 1], value: abOnly })
    if (acOnly > 0) intersections.push({ sets: [0, 2], value: acOnly })
    if (bcOnly > 0) intersections.push({ sets: [1, 2], value: bcOnly })
    if (abc.length > 0)
      intersections.push({ sets: [0, 1, 2], value: abc.length })
  }

  // Compute exclusive counts (elements only in this set, not in any intersection)
  const exclusiveCounts = setElements.map((mySet, i) => {
    let count = 0
    for (const el of mySet) {
      const inOther = setElements.some((s, j) => j !== i && s.has(el))
      if (!inOther) count++
    }
    return count
  })

  const colors = assignColors(
    setsRaw.length,
    c.c as string[] | undefined,
  ).slice(0, setsRaw.length)

  return {
    type: "vennDiagram",
    sets: labels.map((label, i) => ({ label, exclusive: exclusiveCounts[i] })),
    intersections,
    complementValue: c.comp as number | string | undefined,
    colors,
  }
}

function expandTruthTable(c: Record<string, unknown>): TruthTablePayload {
  requireArray(c, "vars", "tt")
  requireArray(c, "expr", "tt")

  return {
    type: "truthTable",
    variables: c.vars as string[],
    expressions: c.expr as string[],
  }
}

function expandEquationSteps(
  c: Record<string, unknown>,
): EquationStepsPayload {
  requireArray(c, "steps", "eq")
  const stepsRaw = c.steps as [string, string?][]
  return {
    type: "equationSteps",
    steps: stepsRaw.map(([expression, annotation]) => ({
      expression,
      annotation,
    })),
  }
}

function expandBoxPlot(c: Record<string, unknown>): BoxPlotPayload {
  requireArray(c, "data", "bp")
  return {
    type: "boxPlot",
    data: c.data as number[],
    color: (c.c as string) ?? DEFAULTS.boxPlot.color,
  }
}

function expandHistogram(c: Record<string, unknown>): HistogramPayload {
  // Must have either data+bins or raw+bc
  const hasFreq = c.data !== undefined
  const hasRaw = c.raw !== undefined
  if (!hasFreq && !hasRaw) {
    throw new Error("hist requires either 'data'+'bins' or 'raw'+'bc'")
  }

  return {
    type: "histogram",
    data: c.data as number[] | undefined,
    bins: c.bins as number[] | undefined,
    rawData: c.raw as number[] | undefined,
    binCount: c.bc as number | undefined,
    color: (c.c as string) ?? DEFAULTS.histogram.color,
  }
}

function expandScatterPlot(c: Record<string, unknown>): ScatterPlotPayload {
  requireArray(c, "pts", "sc")
  return {
    type: "scatterPlot",
    points: c.pts as Vector2[],
    regression: {
      type:
        (c.reg as ScatterPlotPayload["regression"]["type"]) ??
        DEFAULTS.scatterPlot.regression,
      showEquation: DEFAULTS.scatterPlot.showEquation,
      showR2: DEFAULTS.scatterPlot.showR2,
    },
    color: (c.c as string) ?? DEFAULTS.scatterPlot.color,
  }
}

function expandNormalDist(c: Record<string, unknown>): NormalDistPayload {
  const shadeRaw = (c.shade as [number, number, string?][]) ?? []

  return {
    type: "normalDistribution",
    mean: (c.m as number) ?? DEFAULTS.normalDist.mean,
    stdDev: (c.sd as number) ?? DEFAULTS.normalDist.stdDev,
    regions: shadeRaw.map(([from, to, label]) => ({ from, to, label })),
    showMeanLine: DEFAULTS.normalDist.showMeanLine,
    showStdDevMarkers:
      (c.sm as boolean) ?? DEFAULTS.normalDist.showStdDevMarkers,
    color: (c.c as string) ?? DEFAULTS.normalDist.color,
  }
}

function expandProbabilityTree(
  c: Record<string, unknown>,
): ProbabilityTreePayload {
  requireArray(c, "tree", "pt")

  function convertNode(node: ProbabilityNode): ProbabilityBranchPayload {
    const [probability, label, children] = node
    return {
      label,
      probability,
      children: children?.map(convertNode),
    }
  }

  return {
    type: "probabilityTree",
    data: (c.tree as ProbabilityNode[]).map(convertNode),
  }
}

function expandStemAndLeaf(c: Record<string, unknown>): StemAndLeafPayload {
  requireArray(c, "data", "sl")
  return {
    type: "stemAndLeaf",
    data: c.data as number[],
  }
}

function expandPiecewise(c: Record<string, unknown>): PiecewisePayload {
  requireArray(c, "pieces", "pw")
  const piecesRaw = c.pieces as [string, Vector2][]
  const epRaw = (c.ep as [number, boolean?, boolean?][]) ?? []

  // Auto-compute viewBox from piece domains
  let xMin = Infinity
  let xMax = -Infinity
  for (const [, domain] of piecesRaw) {
    xMin = Math.min(xMin, domain[0])
    xMax = Math.max(xMax, domain[1])
  }
  const xPad = Math.max((xMax - xMin) * 0.15, 1)

  return {
    type: "piecewise",
    pieces: piecesRaw.map(([expression, domain]) => ({ expression, domain })),
    endpoints: epRaw.map(([value, fromLeft, fromRight]) => ({
      value,
      fromLeft: fromLeft ?? true,
      fromRight: fromRight ?? true,
    })),
    viewBox: parseViewBox(
      c.vb as [number, number, number, number] | undefined,
      [xMin - xPad, xMax + xPad],
      [-10, 10],
    ),
  }
}

function expandAngle(c: Record<string, unknown>): AnglePayload {
  requireArray(c, "v", "ang")
  requireArray(c, "from", "ang")
  requireArray(c, "to", "ang")

  return {
    type: "angle",
    vertex: c.v as Vector2,
    from: c.from as Vector2,
    to: c.to as Vector2,
    label: (c.label as string) ?? DEFAULTS.angle.label,
    color: (c.c as string) ?? DEFAULTS.angle.color,
    radius: DEFAULTS.angle.radius,
  }
}

function expandComplexPlane(c: Record<string, unknown>): ComplexPlanePayload {
  requireArray(c, "pts", "cp")
  const ptsRaw = c.pts as [number, number, string?][]
  const showArr = (c.show as string[]) ?? []

  return {
    type: "complexPlane",
    points: ptsRaw.map(([re, im, label]) => ({
      z: [re, im],
      label,
    })),
    showConjugate: showArr.includes("conj"),
    showModulus: showArr.includes("mod"),
    showArgument: showArr.includes("arg"),
  }
}

function expandBarChart(c: Record<string, unknown>): BarChartPayload {
  requireArray(c, "data", "bar")
  const dataRaw = c.data as [string, number][]
  return {
    type: "barChart",
    data: dataRaw.map(([label, value]) => ({ label, value })),
    orientation:
      (c.o as "vertical" | "horizontal") ?? DEFAULTS.barChart.orientation,
    color: (c.c as string) ?? DEFAULTS.barChart.color,
  }
}

function expandPieChart(c: Record<string, unknown>): PieChartPayload {
  requireArray(c, "data", "pie")
  const dataRaw = c.data as [string, number][]
  return {
    type: "pieChart",
    data: dataRaw.map(([label, value]) => ({ label, value })),
  }
}
