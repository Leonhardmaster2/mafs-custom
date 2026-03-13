/**
 * MathFlow Default Values
 *
 * Single source of truth for all defaults the shorthand expander assumes.
 * If the AI omits a field, the expander fills it from here.
 */

import type { Vector2 } from "./types"

export const DEFAULTS = {
  graph: {
    domain: [-10, 10] as Vector2,
    range: [-10, 10] as Vector2,
    color: "blue",
    subdivisions: 2,
  },

  slider: {
    step: 0.1,
  },

  auc: {
    riemannType: "left" as const,
    n: 10,
    showAreaComparison: true,
    color: "blue",
  },

  tangent: {
    dx: 0.0001,
    showSlope: true,
    showPoint: true,
    tangentColor: "red",
  },

  unitCircle: {
    angle: 0,
    show: ["sin", "cos", "tan"] as ("sin" | "cos" | "tan")[],
    draggable: true,
  },

  numberLine: {
    arrows: true,
    color: "foreground",
    intervalStartInclusive: true,
    intervalEndInclusive: true,
  },

  vennDiagram: {
    colors: ["blue", "red", "green"],
  },

  boxPlot: {
    color: "blue",
  },

  histogram: {
    color: "blue",
  },

  scatterPlot: {
    regression: "linear" as const,
    showEquation: true,
    showR2: true,
    color: "blue",
  },

  normalDist: {
    mean: 0,
    stdDev: 1,
    showMeanLine: true,
    showStdDevMarkers: false,
    color: "blue",
  },

  angle: {
    label: "",
    color: "blue",
    radius: 0.5,
  },

  complexPlane: {
    showConjugate: false,
    showModulus: false,
    showArgument: false,
  },

  barChart: {
    orientation: "vertical" as const,
    color: "blue",
  },

  piecewise: {
    showEndpoints: true,
  },

  /** Theme color cycle for multi-series data */
  colorCycle: ["blue", "red", "green", "yellow", "indigo", "violet", "orange", "pink"],
} as const
