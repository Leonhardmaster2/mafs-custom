import { describe, it, expect } from "vitest"
import { expandShorthand } from "./shorthand"
import { DEFAULTS } from "./defaults"

describe("expandShorthand", () => {
  it("throws on missing type", () => {
    expect(() => expandShorthand({})).toThrow("Missing type field")
  })

  it("throws on unknown type", () => {
    expect(() => expandShorthand({ t: "zzz" })).toThrow(
      "Unknown visualization type",
    )
  })
})

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------
describe("expandGraph", () => {
  it("expands minimal graph", () => {
    const result = expandShorthand({ t: "g", fn: ["sin(x)"] })
    expect(result).toEqual({
      type: "graph",
      functions: [{ expression: "sin(x)", color: "blue" }],
      domain: [-10, 10],
      range: [-10, 10],
      sliders: [],
      viewBox: { x: [-10, 10], y: [-10, 10] },
    })
  })

  it("throws when fn is missing", () => {
    expect(() => expandShorthand({ t: "g" })).toThrow("requires 'fn'")
  })

  it("throws when fn is not an array", () => {
    expect(() => expandShorthand({ t: "g", fn: "x^2" })).toThrow(
      "must be an array",
    )
  })

  it("expands graph with multiple functions and custom domain", () => {
    const result = expandShorthand({
      t: "g",
      fn: ["x^2", "sin(x)", "cos(x)"],
      d: [-5, 5],
      r: [-2, 8],
    })
    expect(result.type).toBe("graph")
    const g = result as any
    expect(g.functions).toHaveLength(3)
    expect(g.functions[0].color).toBe("blue")
    expect(g.functions[1].color).toBe("red")
    expect(g.functions[2].color).toBe("green")
    expect(g.domain).toEqual([-5, 5])
    expect(g.range).toEqual([-2, 8])
  })

  it("expands graph with sliders (4-element format)", () => {
    const result = expandShorthand({
      t: "g",
      fn: ["{a}*x^2"],
      s: [["a", -3, 3, 1]],
    }) as any
    expect(result.sliders).toHaveLength(1)
    expect(result.sliders[0]).toEqual({
      id: "a",
      min: -3,
      max: 3,
      step: DEFAULTS.slider.step,
      default: 1,
    })
  })

  it("expands graph with sliders (5-element format)", () => {
    const result = expandShorthand({
      t: "g",
      fn: ["{a}*x^2"],
      s: [["a", -3, 3, 0.5, 1]],
    }) as any
    expect(result.sliders[0].step).toBe(0.5)
    expect(result.sliders[0].default).toBe(1)
  })

  it("expands graph with explicit colors", () => {
    const result = expandShorthand({
      t: "g",
      fn: ["x", "x^2"],
      c: ["red", "green"],
    }) as any
    expect(result.functions[0].color).toBe("red")
    expect(result.functions[1].color).toBe("green")
  })

  it("expands graph with custom viewBox", () => {
    const result = expandShorthand({
      t: "g",
      fn: ["x"],
      vb: [-2, 2, -3, 3],
    }) as any
    expect(result.viewBox).toEqual({ x: [-2, 2], y: [-3, 3] })
  })
})

// ---------------------------------------------------------------------------
// Area Under Curve
// ---------------------------------------------------------------------------
describe("expandAreaUnderCurve", () => {
  it("expands minimal AUC", () => {
    const result = expandShorthand({
      t: "auc",
      fn: "x^2",
      a: 0,
      b: 3,
    }) as any
    expect(result.type).toBe("areaUnderCurve")
    expect(result.expression).toBe("x^2")
    expect(result.from).toBe(0)
    expect(result.to).toBe(3)
    expect(result.riemannType).toBe("left")
    expect(result.riemannN).toBe(10)
    expect(result.showAreaComparison).toBe(true)
    expect(result.color).toBe("blue")
  })

  it("auto-fits viewBox from integration bounds", () => {
    const result = expandShorthand({
      t: "auc",
      fn: "x^2",
      a: 0,
      b: 3,
    }) as any
    // viewBox should be centered around [0,3], not the graph default [-10,10]
    expect(result.viewBox.x[0]).toBeLessThan(0)
    expect(result.viewBox.x[0]).toBeGreaterThan(-5)
    expect(result.viewBox.x[1]).toBeGreaterThan(3)
    expect(result.viewBox.x[1]).toBeLessThan(8)
    expect(result.viewBox.y).toEqual([-2, 10])
  })

  it("uses explicit viewBox when provided", () => {
    const result = expandShorthand({
      t: "auc",
      fn: "x^2",
      a: 0,
      b: 3,
      vb: [-1, 4, -1, 12],
    }) as any
    expect(result.viewBox).toEqual({ x: [-1, 4], y: [-1, 12] })
  })

  it("throws when required fields are missing", () => {
    expect(() => expandShorthand({ t: "auc" })).toThrow("requires 'fn'")
    expect(() => expandShorthand({ t: "auc", fn: "x" })).toThrow(
      "requires 'a'",
    )
    expect(() => expandShorthand({ t: "auc", fn: "x", a: 0 })).toThrow(
      "requires 'b'",
    )
  })

  it("expands AUC with custom riemann type and n", () => {
    const result = expandShorthand({
      t: "auc",
      fn: "sin(x)",
      a: 0,
      b: 3.14,
      r: "midpoint",
      n: 20,
      c: "green",
    }) as any
    expect(result.riemannType).toBe("midpoint")
    expect(result.riemannN).toBe(20)
    expect(result.color).toBe("green")
  })
})

// ---------------------------------------------------------------------------
// Tangent Line
// ---------------------------------------------------------------------------
describe("expandTangentLine", () => {
  it("expands minimal tangent", () => {
    const result = expandShorthand({ t: "tan", fn: "x^2", at: 2 })
    expect(result.type).toBe("tangentLine")
    const tan = result as any
    expect(tan.expression).toBe("x^2")
    expect(tan.at).toBe(2)
    expect(tan.showSlope).toBe(true)
    expect(tan.showPoint).toBe(true)
    expect(tan.tangentColor).toBe("red")
  })

  it("throws when required fields are missing", () => {
    expect(() => expandShorthand({ t: "tan" })).toThrow("requires 'fn'")
    expect(() => expandShorthand({ t: "tan", fn: "x" })).toThrow(
      "requires 'at'",
    )
  })

  it("expands tangent with slider reference", () => {
    const result = expandShorthand({
      t: "tan",
      fn: "x^2",
      at: "{a}",
      s: [["a", -3, 3, 1]],
    }) as any
    expect(result.at).toBe("{a}")
    expect(result.sliders).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Unit Circle
// ---------------------------------------------------------------------------
describe("expandUnitCircle", () => {
  it("expands defaults", () => {
    const result = expandShorthand({ t: "uc" })
    expect(result.type).toBe("unitCircle")
    const uc = result as any
    expect(uc.angle).toBe(0)
    expect(uc.show).toEqual(["sin", "cos", "tan"])
    expect(uc.draggable).toBe(true)
  })

  it("expands with custom angle and show", () => {
    const result = expandShorthand({
      t: "uc",
      angle: 0.785,
      show: ["sin", "cos"],
    }) as any
    expect(result.angle).toBe(0.785)
    expect(result.show).toEqual(["sin", "cos"])
  })
})

// ---------------------------------------------------------------------------
// Number Line
// ---------------------------------------------------------------------------
describe("expandNumberLine", () => {
  it("expands minimal number line", () => {
    const result = expandShorthand({ t: "nl", r: [-5, 5] })
    expect(result.type).toBe("numberLine")
    const nl = result as any
    expect(nl.range).toEqual([-5, 5])
    expect(nl.intervals).toEqual([])
    expect(nl.points).toEqual([])
    expect(nl.arrows).toBe(true)
  })

  it("throws when range is missing", () => {
    expect(() => expandShorthand({ t: "nl" })).toThrow("requires 'r'")
  })

  it("expands with intervals and points", () => {
    const result = expandShorthand({
      t: "nl",
      r: [-5, 5],
      iv: [[-2, 3, false, true]],
      pts: [[0, "origin"], [4]],
    }) as any
    expect(result.intervals).toEqual([
      { start: -2, end: 3, startInclusive: false, endInclusive: true },
    ])
    expect(result.points).toHaveLength(2)
    expect(result.points[0]).toEqual({ value: 0, label: "origin" })
    expect(result.points[1]).toEqual({ value: 4, label: undefined })
  })

  it("uses default inclusive for intervals", () => {
    const result = expandShorthand({
      t: "nl",
      r: [-5, 5],
      iv: [[1, 3]],
    }) as any
    expect(result.intervals[0].startInclusive).toBe(true)
    expect(result.intervals[0].endInclusive).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Venn Diagram — element-based format
// ---------------------------------------------------------------------------
describe("expandVennDiagram", () => {
  it("computes exclusive counts and intersection from elements (2-set)", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1, 3, 5, 7, 9]],
        ["B", [2, 3, 5, 8, 9]],
      ],
    }) as any
    expect(result.type).toBe("vennDiagram")
    // A exclusive: {1,7} = 2, B exclusive: {2,8} = 2, A∩B: {3,5,9} = 3
    expect(result.sets).toEqual([
      { label: "A", exclusive: 2 },
      { label: "B", exclusive: 2 },
    ])
    expect(result.intersections).toEqual([{ sets: [0, 1], value: 3 }])
  })

  it("computes 3-set intersections correctly", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1, 2, 3, 4]],
        ["B", [2, 3, 5, 6]],
        ["C", [3, 4, 5, 7]],
      ],
    }) as any
    // A∩B∩C = {3} → 1
    // A∩B only (not C) = {2} → 1
    // A∩C only (not B) = {4} → 1
    // B∩C only (not A) = {5} → 1
    // A exclusive = {1} → 1
    // B exclusive = {6} → 1
    // C exclusive = {7} → 1
    expect(result.sets).toEqual([
      { label: "A", exclusive: 1 },
      { label: "B", exclusive: 1 },
      { label: "C", exclusive: 1 },
    ])
    expect(result.intersections).toContainEqual({
      sets: [0, 1],
      value: 1,
    })
    expect(result.intersections).toContainEqual({
      sets: [0, 2],
      value: 1,
    })
    expect(result.intersections).toContainEqual({
      sets: [1, 2],
      value: 1,
    })
    expect(result.intersections).toContainEqual({
      sets: [0, 1, 2],
      value: 1,
    })
  })

  it("handles disjoint sets (no intersection)", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1, 2]],
        ["B", [3, 4]],
      ],
    }) as any
    expect(result.sets).toEqual([
      { label: "A", exclusive: 2 },
      { label: "B", exclusive: 2 },
    ])
    expect(result.intersections).toEqual([])
  })

  it("handles complete overlap", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1, 2, 3]],
        ["B", [1, 2, 3]],
      ],
    }) as any
    expect(result.sets).toEqual([
      { label: "A", exclusive: 0 },
      { label: "B", exclusive: 0 },
    ])
    expect(result.intersections).toEqual([{ sets: [0, 1], value: 3 }])
  })

  it("passes through complement value", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1, 2]],
        ["B", [3, 4]],
      ],
      comp: 10,
    }) as any
    expect(result.complementValue).toBe(10)
  })

  it("throws when sets is missing", () => {
    expect(() => expandShorthand({ t: "vn" })).toThrow("requires 'sets'")
  })

  it("throws on invalid set count", () => {
    expect(() =>
      expandShorthand({ t: "vn", sets: [["A", [1]]] }),
    ).toThrow("2 or 3 sets")
  })

  it("assigns colors", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", [1]],
        ["B", [2]],
      ],
    }) as any
    expect(result.colors).toHaveLength(2)
  })

  it("handles string elements", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["Fruits", ["apple", "banana", "cherry"]],
        ["Red", ["apple", "cherry", "tomato"]],
      ],
    }) as any
    // Fruits exclusive: banana → 1, Red exclusive: tomato → 1, overlap: apple, cherry → 2
    expect(result.sets).toEqual([
      { label: "Fruits", exclusive: 1 },
      { label: "Red", exclusive: 1 },
    ])
    expect(result.intersections).toEqual([{ sets: [0, 1], value: 2 }])
  })
})

// ---------------------------------------------------------------------------
// Truth Table
// ---------------------------------------------------------------------------
describe("expandTruthTable", () => {
  it("expands truth table", () => {
    const result = expandShorthand({
      t: "tt",
      vars: ["P", "Q"],
      expr: ["P ∧ Q", "P → Q"],
    })
    expect(result).toEqual({
      type: "truthTable",
      variables: ["P", "Q"],
      expressions: ["P ∧ Q", "P → Q"],
    })
  })

  it("throws when required fields are missing", () => {
    expect(() => expandShorthand({ t: "tt" })).toThrow("requires 'vars'")
    expect(() => expandShorthand({ t: "tt", vars: ["P"] })).toThrow(
      "requires 'expr'",
    )
  })
})

// ---------------------------------------------------------------------------
// Equation Steps
// ---------------------------------------------------------------------------
describe("expandEquationSteps", () => {
  it("expands steps with annotations", () => {
    const result = expandShorthand({
      t: "eq",
      steps: [
        ["3x+7=22", "Start"],
        ["3x=15", "Subtract 7"],
        ["x=5", "Divide by 3"],
      ],
    }) as any
    expect(result.type).toBe("equationSteps")
    expect(result.steps).toHaveLength(3)
    expect(result.steps[0]).toEqual({
      expression: "3x+7=22",
      annotation: "Start",
    })
    expect(result.steps[2]).toEqual({
      expression: "x=5",
      annotation: "Divide by 3",
    })
  })

  it("handles steps without annotations", () => {
    const result = expandShorthand({
      t: "eq",
      steps: [["x=5"]],
    }) as any
    expect(result.steps[0].annotation).toBeUndefined()
  })

  it("throws when steps is missing", () => {
    expect(() => expandShorthand({ t: "eq" })).toThrow("requires 'steps'")
  })
})

// ---------------------------------------------------------------------------
// Box Plot
// ---------------------------------------------------------------------------
describe("expandBoxPlot", () => {
  it("expands with defaults", () => {
    const result = expandShorthand({
      t: "bp",
      data: [2, 5, 7, 8, 12, 15, 18, 22, 25],
    })
    expect(result).toEqual({
      type: "boxPlot",
      data: [2, 5, 7, 8, 12, 15, 18, 22, 25],
      color: "blue",
    })
  })

  it("throws when data is missing", () => {
    expect(() => expandShorthand({ t: "bp" })).toThrow("requires 'data'")
  })

  it("expands with custom color", () => {
    const result = expandShorthand({
      t: "bp",
      data: [1, 2, 3],
      c: "red",
    }) as any
    expect(result.color).toBe("red")
  })
})

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------
describe("expandHistogram", () => {
  it("expands with frequencies and bins", () => {
    const result = expandShorthand({
      t: "hist",
      data: [2, 5, 8, 12, 7, 3],
      bins: [0, 10, 20, 30, 40, 50, 60],
    }) as any
    expect(result.type).toBe("histogram")
    expect(result.data).toEqual([2, 5, 8, 12, 7, 3])
    expect(result.bins).toEqual([0, 10, 20, 30, 40, 50, 60])
    expect(result.color).toBe("blue")
  })

  it("expands with raw data and bin count", () => {
    const result = expandShorthand({
      t: "hist",
      raw: [12, 15, 23, 31, 45],
      bc: 6,
    }) as any
    expect(result.rawData).toEqual([12, 15, 23, 31, 45])
    expect(result.binCount).toBe(6)
  })

  it("throws when neither data nor raw is provided", () => {
    expect(() => expandShorthand({ t: "hist" })).toThrow(
      "requires either 'data'+'bins' or 'raw'+'bc'",
    )
  })
})

// ---------------------------------------------------------------------------
// Scatter Plot
// ---------------------------------------------------------------------------
describe("expandScatterPlot", () => {
  it("expands with defaults", () => {
    const result = expandShorthand({
      t: "sc",
      pts: [
        [1, 2],
        [2, 4.1],
        [3, 5.8],
      ],
    }) as any
    expect(result.type).toBe("scatterPlot")
    expect(result.points).toEqual([
      [1, 2],
      [2, 4.1],
      [3, 5.8],
    ])
    expect(result.regression.type).toBe("linear")
    expect(result.regression.showEquation).toBe(true)
    expect(result.regression.showR2).toBe(true)
  })

  it("throws when pts is missing", () => {
    expect(() => expandShorthand({ t: "sc" })).toThrow("requires 'pts'")
  })

  it("expands with explicit regression type", () => {
    const result = expandShorthand({
      t: "sc",
      pts: [[1, 1]],
      reg: "quadratic",
    }) as any
    expect(result.regression.type).toBe("quadratic")
  })
})

// ---------------------------------------------------------------------------
// Normal Distribution
// ---------------------------------------------------------------------------
describe("expandNormalDist", () => {
  it("expands with defaults", () => {
    const result = expandShorthand({ t: "norm" }) as any
    expect(result.type).toBe("normalDistribution")
    expect(result.mean).toBe(0)
    expect(result.stdDev).toBe(1)
    expect(result.regions).toEqual([])
    expect(result.showMeanLine).toBe(true)
    expect(result.showStdDevMarkers).toBe(false)
  })

  it("expands with shade regions", () => {
    const result = expandShorthand({
      t: "norm",
      m: 100,
      sd: 15,
      shade: [
        [85, 115, "68.2%"],
        [70, 130],
      ],
      sm: true,
    }) as any
    expect(result.mean).toBe(100)
    expect(result.stdDev).toBe(15)
    expect(result.regions).toHaveLength(2)
    expect(result.regions[0]).toEqual({ from: 85, to: 115, label: "68.2%" })
    expect(result.regions[1]).toEqual({ from: 70, to: 130, label: undefined })
    expect(result.showStdDevMarkers).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Probability Tree
// ---------------------------------------------------------------------------
describe("expandProbabilityTree", () => {
  it("expands nested tree", () => {
    const result = expandShorthand({
      t: "pt",
      tree: [
        [0.6, "Rain", [[0.3, "Late"], [0.7, "On time"]]],
        [0.4, "No rain", [[0.1, "Late"], [0.9, "On time"]]],
      ],
    }) as any
    expect(result.type).toBe("probabilityTree")
    expect(result.data).toHaveLength(2)
    expect(result.data[0].label).toBe("Rain")
    expect(result.data[0].probability).toBe(0.6)
    expect(result.data[0].children).toHaveLength(2)
    expect(result.data[0].children[0].label).toBe("Late")
    expect(result.data[0].children[0].probability).toBe(0.3)
  })

  it("handles leaf nodes (no children)", () => {
    const result = expandShorthand({
      t: "pt",
      tree: [[0.5, "A"], [0.5, "B"]],
    }) as any
    expect(result.data[0].children).toBeUndefined()
    expect(result.data[1].children).toBeUndefined()
  })

  it("throws when tree is missing", () => {
    expect(() => expandShorthand({ t: "pt" })).toThrow("requires 'tree'")
  })
})

// ---------------------------------------------------------------------------
// Stem and Leaf
// ---------------------------------------------------------------------------
describe("expandStemAndLeaf", () => {
  it("expands stem and leaf", () => {
    const result = expandShorthand({
      t: "sl",
      data: [12, 15, 21, 23, 25, 31, 34, 38, 42],
    })
    expect(result).toEqual({
      type: "stemAndLeaf",
      data: [12, 15, 21, 23, 25, 31, 34, 38, 42],
    })
  })

  it("throws when data is missing", () => {
    expect(() => expandShorthand({ t: "sl" })).toThrow("requires 'data'")
  })
})

// ---------------------------------------------------------------------------
// Piecewise
// ---------------------------------------------------------------------------
describe("expandPiecewise", () => {
  it("expands pieces with endpoints", () => {
    const result = expandShorthand({
      t: "pw",
      pieces: [
        ["x^2", [-3, 0]],
        ["2*x+1", [0, 2]],
        ["5", [2, 5]],
      ],
      ep: [
        [0, true, false],
        [2, true, true],
      ],
    }) as any
    expect(result.type).toBe("piecewise")
    expect(result.pieces).toHaveLength(3)
    expect(result.pieces[0]).toEqual({ expression: "x^2", domain: [-3, 0] })
    expect(result.endpoints).toHaveLength(2)
    expect(result.endpoints[0]).toEqual({
      value: 0,
      fromLeft: true,
      fromRight: false,
    })
  })

  it("throws when pieces is missing", () => {
    expect(() => expandShorthand({ t: "pw" })).toThrow("requires 'pieces'")
  })

  it("auto-computes viewBox from domains", () => {
    const result = expandShorthand({
      t: "pw",
      pieces: [
        ["x", [0, 5]],
        ["-x", [5, 10]],
      ],
    }) as any
    expect(result.viewBox.x[0]).toBeLessThan(0)
    expect(result.viewBox.x[1]).toBeGreaterThan(10)
  })

  it("defaults endpoint inclusivity to true", () => {
    const result = expandShorthand({
      t: "pw",
      pieces: [["x", [0, 1]]],
      ep: [[0]],
    }) as any
    expect(result.endpoints[0].fromLeft).toBe(true)
    expect(result.endpoints[0].fromRight).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Angle
// ---------------------------------------------------------------------------
describe("expandAngle", () => {
  it("expands with defaults", () => {
    const result = expandShorthand({
      t: "ang",
      v: [0, 0],
      from: [1, 0],
      to: [0.5, 0.866],
      label: "60°",
    })
    expect(result).toEqual({
      type: "angle",
      vertex: [0, 0],
      from: [1, 0],
      to: [0.5, 0.866],
      label: "60°",
      color: "blue",
      radius: 0.5,
    })
  })

  it("throws when required fields are missing", () => {
    expect(() => expandShorthand({ t: "ang" })).toThrow("requires 'v'")
    expect(() => expandShorthand({ t: "ang", v: [0, 0] })).toThrow(
      "requires 'from'",
    )
    expect(() =>
      expandShorthand({ t: "ang", v: [0, 0], from: [1, 0] }),
    ).toThrow("requires 'to'")
  })

  it("uses empty label by default", () => {
    const result = expandShorthand({
      t: "ang",
      v: [0, 0],
      from: [1, 0],
      to: [0, 1],
    }) as any
    expect(result.label).toBe("")
  })
})

// ---------------------------------------------------------------------------
// Complex Plane
// ---------------------------------------------------------------------------
describe("expandComplexPlane", () => {
  it("expands points with show flags", () => {
    const result = expandShorthand({
      t: "cp",
      pts: [
        [3, 2, "3+2i"],
        [-1, 4, "-1+4i"],
      ],
      show: ["mod", "arg"],
    }) as any
    expect(result.type).toBe("complexPlane")
    expect(result.points).toEqual([
      { z: [3, 2], label: "3+2i" },
      { z: [-1, 4], label: "-1+4i" },
    ])
    expect(result.showModulus).toBe(true)
    expect(result.showArgument).toBe(true)
    expect(result.showConjugate).toBe(false)
  })

  it("throws when pts is missing", () => {
    expect(() => expandShorthand({ t: "cp" })).toThrow("requires 'pts'")
  })

  it("defaults all show flags to false", () => {
    const result = expandShorthand({
      t: "cp",
      pts: [[1, 1]],
    }) as any
    expect(result.showModulus).toBe(false)
    expect(result.showArgument).toBe(false)
    expect(result.showConjugate).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bar Chart
// ---------------------------------------------------------------------------
describe("expandBarChart", () => {
  it("expands with defaults", () => {
    const result = expandShorthand({
      t: "bar",
      data: [
        ["Mon", 12],
        ["Tue", 8],
        ["Wed", 15],
      ],
    })
    expect(result).toEqual({
      type: "barChart",
      data: [
        { label: "Mon", value: 12 },
        { label: "Tue", value: 8 },
        { label: "Wed", value: 15 },
      ],
      orientation: "vertical",
      color: "blue",
    })
  })

  it("throws when data is missing", () => {
    expect(() => expandShorthand({ t: "bar" })).toThrow("requires 'data'")
  })

  it("expands with horizontal orientation", () => {
    const result = expandShorthand({
      t: "bar",
      data: [["A", 1]],
      o: "horizontal",
      c: "green",
    }) as any
    expect(result.orientation).toBe("horizontal")
    expect(result.color).toBe("green")
  })
})

// ---------------------------------------------------------------------------
// Pie Chart
// ---------------------------------------------------------------------------
describe("expandPieChart", () => {
  it("expands pie chart", () => {
    const result = expandShorthand({
      t: "pie",
      data: [
        ["A", 40],
        ["B", 25],
        ["C", 35],
      ],
    })
    expect(result).toEqual({
      type: "pieChart",
      data: [
        { label: "A", value: 40 },
        { label: "B", value: 25 },
        { label: "C", value: 35 },
      ],
    })
  })

  it("throws when data is missing", () => {
    expect(() => expandShorthand({ t: "pie" })).toThrow("requires 'data'")
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("edge cases", () => {
  it("handles empty fn array", () => {
    const result = expandShorthand({ t: "g", fn: [] }) as any
    expect(result.functions).toEqual([])
  })

  it("handles single-item arrays", () => {
    const result = expandShorthand({
      t: "sc",
      pts: [[1, 1]],
    }) as any
    expect(result.points).toEqual([[1, 1]])
  })

  it("handles empty intervals/points on number line", () => {
    const result = expandShorthand({ t: "nl", r: [0, 10] }) as any
    expect(result.intervals).toEqual([])
    expect(result.points).toEqual([])
  })

  it("handles probability tree with string probabilities", () => {
    const result = expandShorthand({
      t: "pt",
      tree: [["1/3", "A"], ["2/3", "B"]],
    }) as any
    expect(result.data[0].probability).toBe("1/3")
  })

  it("handles empty sets in venn diagram", () => {
    const result = expandShorthand({
      t: "vn",
      sets: [
        ["A", []],
        ["B", []],
      ],
    }) as any
    expect(result.sets).toEqual([
      { label: "A", exclusive: 0 },
      { label: "B", exclusive: 0 },
    ])
    expect(result.intersections).toEqual([])
  })
})
