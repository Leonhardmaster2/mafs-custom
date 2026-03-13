"use client"

export { Mafs } from "./view/Mafs"
export type { MafsProps } from "./view/Mafs"

export { Coordinates } from "./display/Coordinates"
export { autoPi as labelPi } from "./display/Coordinates/Cartesian"

export { Plot } from "./display/Plot"
export type { OfXProps, OfYProps, ParametricProps, VectorFieldProps } from "./display/Plot"

export { Line } from "./display/Line"
export type {
  PointAngleProps,
  PointSlopeProps,
  ThroughPointsProps,
  SegmentProps,
} from "./display/Line"

export { Circle } from "./display/Circle"
export type { CircleProps } from "./display/Circle"

export { Ellipse } from "./display/Ellipse"
export type { EllipseProps } from "./display/Ellipse"

export { Polygon } from "./display/Polygon"
export type { PolygonProps } from "./display/Polygon"

export { Polyline } from "./display/Polyline"
export type { PolylineProps } from "./display/Polyline"

export { Point } from "./display/Point"
export type { PointProps } from "./display/Point"

export { Vector } from "./display/Vector"
export type { VectorProps } from "./display/Vector"

export { Image } from "./display/Image"
export type { ImageProps } from "./display/Image"

export { Text } from "./display/Text"
export type { TextProps, CardinalDirection } from "./display/Text"

export { Theme } from "./display/Theme"
export type { Filled, Stroked } from "./display/Theme"

export { MovablePoint } from "./interaction/MovablePoint"
export type { MovablePointProps } from "./interaction/MovablePoint"

export { MovablePointDisplay } from "./display/MovablePointDisplay"
export type { MovablePointDisplayProps } from "./display/MovablePointDisplay"

export { useMovable } from "./interaction/useMovable"
export type { UseMovable, UseMovableArguments } from "./interaction/useMovable"

export { useMovablePoint } from "./interaction/useMovablePoint"
export type {
  ConstraintFunction,
  UseMovablePoint,
  UseMovablePointArguments,
} from "./interaction/useMovablePoint"

export { useStopwatch } from "./animation/useStopwatch"
export type { Stopwatch, StopwatchArguments } from "./animation/useStopwatch"

export type { Interval } from "./math"
export { vec } from "./vec"

export { Transform, type TransformProps } from "./display/Transform"

export { useTransformContext } from "./context/TransformContext"
export { usePaneContext } from "./context/PaneContext"

export { Debug } from "./debug"

export { LaTeX } from "./display/LaTeX"

// Statistics & Probability components (Austrian Matura / SAT)
export { ProbabilityTree, useProbabilityMarble } from "./display/statistics/ProbabilityTree"
export type {
  ProbabilityTreeProps,
  ProbabilityBranch,
  MarbleState,
  UseProbabilityMarbleArgs,
  ProbabilityMarbleControls,
} from "./display/statistics/ProbabilityTree"

export { VennDiagram } from "./display/statistics/VennDiagram"
export type {
  VennDiagramProps,
  VennSet,
  VennIntersection,
} from "./display/statistics/VennDiagram"

export { StemAndLeaf } from "./display/statistics/StemAndLeaf"
export type { StemAndLeafProps } from "./display/statistics/StemAndLeaf"

export { BoxPlot } from "./display/statistics/BoxPlot"
export type { BoxPlotProps, FiveNumberSummary } from "./display/statistics/BoxPlot"

export { Histogram } from "./display/statistics/Histogram"
export type { HistogramProps } from "./display/statistics/Histogram"

export { ScatterPlot } from "./display/statistics/ScatterPlot"
export type { ScatterPlotProps, ScatterSeries, RegressionConfig } from "./display/statistics/ScatterPlot"

export { BarChart } from "./display/statistics/BarChart"
export type { BarChartProps, BarChartItem, BarChartGroup } from "./display/statistics/BarChart"

export { PieChart } from "./display/statistics/PieChart"
export type { PieChartProps, PieChartSlice } from "./display/statistics/PieChart"

// Analysis & Calculus components
export { NumberLine } from "./display/NumberLine"
export type { NumberLineProps, NumberLineInterval, NumberLinePoint } from "./display/NumberLine"

export { Angle } from "./display/Angle"
export type { AngleProps } from "./display/Angle"

export { TangentLine } from "./display/TangentLine"
export type { TangentLineProps } from "./display/TangentLine"

export { AreaUnderCurve } from "./display/AreaUnderCurve"
export type { AreaUnderCurveProps, RiemannSumsConfig } from "./display/AreaUnderCurve"

export { Asymptote } from "./display/Asymptote"
export type { AsymptoteProps } from "./display/Asymptote"

export { PiecewiseFunction } from "./display/PiecewiseFunction"
export type { PiecewiseFunctionProps, PiecewisePiece, EndpointConfig } from "./display/PiecewiseFunction"

export { NormalDistribution } from "./display/NormalDistribution"
export type { NormalDistributionProps, NormalRegion } from "./display/NormalDistribution"

export { ComplexPlane } from "./display/ComplexPlane"
export type { ComplexPlaneProps, ComplexPoint } from "./display/ComplexPlane"
