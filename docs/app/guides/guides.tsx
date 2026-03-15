import kebabCase from "lodash/kebabCase"
import {
  CardStackIcon,
  DotFilledIcon,
  GridIcon,
  SquareIcon,
  CircleIcon,
  ArrowTopRightIcon,
  RotateCounterClockwiseIcon,
  TextIcon,
  CursorArrowIcon,
  PlayIcon,
  ImageIcon,
} from "@radix-ui/react-icons"

import {
  FunctionIcon,
  EllipseIcon,
  LatexIcon,
  LinesIcon,
  CustomComponentsIcon,
  TransformContextsIcon,
  DebugIcon,
  LinearAlgebraIcon,
} from "components/icons"

type Section = {
  title: string
  guides: (Guide | Separator)[]
}

type Guide = {
  title: string
  sidebarTitle?: string
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.FunctionComponent<any>
  separator?: false
}

type Separator = { separator: true }

export const Guides: Section[] = [
  {
    title: "Get started",
    guides: [
      { title: "Installation", slug: "installation" },
      { title: "Hello f(x)", slug: "hello-f-x" },
      { title: "Learning React", slug: "learning-react" },
    ],
  },
  {
    title: "Display",
    guides: [
      { title: "Mafs", icon: CardStackIcon, slug: "mafs" },
      { title: "Coordinates", icon: GridIcon, slug: "coordinates" },
      { separator: true },
      { title: "Points", icon: DotFilledIcon, slug: "points" },
      { title: "Lines", icon: LinesIcon, slug: "lines" },
      { title: "Polygons", icon: SquareIcon, slug: "polygons" },
      { title: "Circles", icon: CircleIcon, slug: "circles" },
      { title: "Ellipses", icon: EllipseIcon, slug: "ellipses" },
      { title: "Plots", icon: FunctionIcon, slug: "plots" },
      { title: "Text", icon: TextIcon, slug: "text" },
      { title: "Vectors", icon: ArrowTopRightIcon, slug: "vectors" },
      { title: "Images", icon: ImageIcon, slug: "images" },
      { separator: true },
      { title: "Transform", icon: RotateCounterClockwiseIcon, slug: "transform" },
      { title: "Debug", icon: DebugIcon, slug: "debug" },
    ],
  },
  {
    title: "Utility",
    guides: [{ title: "Linear algebra", icon: LinearAlgebraIcon, slug: "vec" }],
  },
  {
    title: "Interaction",
    guides: [{ title: "Movable points", icon: CursorArrowIcon, slug: "movable-points" }],
  },
  {
    title: "Custom components",
    guides: [
      {
        sidebarTitle: "Overview",
        title: "Custom components",
        icon: CustomComponentsIcon,
        slug: "overview",
      },
      { title: "Transform contexts", icon: TransformContextsIcon, slug: "contexts" },
    ],
  },
  {
    title: "Experimental",
    guides: [
      { title: "Animation", icon: PlayIcon, slug: "animation" },
      { title: "LaTeX", icon: LatexIcon, slug: "latex" },
    ],
  },
  {
    title: "Statistics",
    guides: [
      { title: "Box Plot", slug: "box-plot" },
      { title: "Stem-and-Leaf", slug: "stem-and-leaf" },
      { title: "Probability Tree", slug: "probability-tree" },
      { title: "Venn Diagram", slug: "venn-diagram" },
      { separator: true },
      { title: "Histogram", slug: "histogram" },
      { title: "Bar Chart", slug: "bar-chart" },
      { title: "Pie Chart", slug: "pie-chart" },
      { title: "Scatter Plot", slug: "scatter-plot" },
      { separator: true },
      { title: "Hypothesis Test", slug: "hypothesis-test" },
    ],
  },
  {
    title: "Analysis",
    guides: [
      { title: "Number Line", slug: "number-line" },
      { title: "Angle", slug: "angle" },
      { title: "Tangent Line", slug: "tangent-line" },
      { title: "Area Under Curve", slug: "area-under-curve" },
      { title: "Asymptote", slug: "asymptote" },
      { title: "Piecewise Function", slug: "piecewise-function" },
      { title: "Normal Distribution", slug: "normal-distribution" },
      { title: "Complex Plane", slug: "complex-plane" },
      { separator: true },
      { title: "Taylor Series", slug: "taylor-series" },
      { title: "Slope Field", slug: "slope-field" },
      { title: "Geometric Construction", slug: "geometric-construction" },
    ],
  },
  {
    title: "Examples",
    guides: [
      { title: "Bézier curves", slug: "bezier-curves" },
      { title: "Riemann sums", slug: "riemann-sums" },
      { title: "Fancy parabola", slug: "fancy-parabola" },
      { title: "Projectile motion", slug: "projectile-motion" },
      { separator: true },
      { title: "Linear transform", slug: "linear-transform" },
      { title: "Vector field", slug: "vector-field" },
      { title: "Wave interference", slug: "wave-interference" },
      { title: "Fractal tree", slug: "fractal-tree" },
      { title: "Fourier epicycles", slug: "fourier-epicycles" },
    ],
  },
]

export function getDocContext(
  sectionSlug: string,
  guideSlug: string,
): {
  current: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: React.FunctionComponent<any>
    sectionTitle: string
    guideTitle: string
    url: string
  }

  previous: {
    sectionTitle: string
    guideTitle: string
    url: string
  } | null

  next: {
    sectionTitle: string
    guideTitle: string
    url: string
  } | null
} {
  const flatGuidesAndSections = Guides.flatMap((section) =>
    section.guides.filter(isGuide).map((guide) => [section, guide] as const),
  )

  const currentIndex = flatGuidesAndSections.findIndex(
    ([section, guide]) => kebabCase(section.title) === sectionSlug && guide.slug === guideSlug,
  )

  const [section, guide] = flatGuidesAndSections[currentIndex]
  const [prevSection, prevGuide] = flatGuidesAndSections[currentIndex - 1] ?? [null, null]
  const [nextSection, nextGuide] = flatGuidesAndSections[currentIndex + 1] ?? [null, null]

  return {
    current: {
      icon: guide.icon,
      sectionTitle: section.title,
      guideTitle: guide.title,
      url: `/guides/${kebabCase(section.title)}/${guide.slug}`,
    },
    previous: prevGuide
      ? {
          sectionTitle: prevSection.title,
          guideTitle: prevGuide.title,
          url: `/guides/${kebabCase(prevSection.title)}/${prevGuide.slug}`,
        }
      : null,
    next: nextGuide
      ? {
          sectionTitle: nextSection.title,
          guideTitle: nextGuide.title,
          url: `/guides/${kebabCase(nextSection.title)}/${nextGuide.slug}`,
        }
      : null,
  }
}

function isGuide(guide: Guide | Separator): guide is Guide {
  return !guide.separator
}
