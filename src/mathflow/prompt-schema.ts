/**
 * AI Prompt Schema
 *
 * This is the compact visualization format instruction to include in the
 * AI system prompt. It replaces the full MathFlowPayload schema dump.
 *
 * ~250 tokens instead of ~2,500.
 */

export const VISUALIZATION_PROMPT_SCHEMA = `
VISUALIZATION FORMAT: Output compact JSON. Types and their fields:

g (graph): fn (expression array), d (domain [min,max]), r (range), s (sliders), c (color array), vb (viewBox [xMin,xMax,yMin,yMax])
auc (area under curve): fn, a (from), b (to), r (riemann type: left|right|midpoint|trapezoid), n (rectangles), c (color)
tan (tangent): fn, at (x-value or slider ref like "{a}"), s (sliders), c (color)
uc (unit circle): angle (radians), show (array of "sin","cos","tan")
nl (number line): r (range [min,max]), iv (intervals as [start,end,startInclusive?,endInclusive?]), pts (points as [value,label?]), c (color)
vn (venn): sets as [label,elements[]] arrays (e.g. ["A",[1,3,5]]), comp (complement count), c (color array). Intersections are auto-computed from element overlap.
tt (truth table): vars (variable names), expr (expression strings)
eq (equation steps): steps as [expression,annotation?] arrays
bp (box plot): data (number array), c (color)
hist (histogram): data (frequencies)+bins, OR raw (raw data)+bc (bin count), c (color)
sc (scatter): pts (point [x,y] array), reg (regression: linear|quadratic|exponential|none), c (color)
norm (normal dist): m (mean), sd (std dev), shade as [from,to,label?] arrays, sm (show std dev markers)
pt (probability tree): tree as nested [probability,label,children?] arrays
sl (stem and leaf): data (number array)
pw (piecewise): pieces as [expression,[start,end]] arrays, ep (endpoints as [value,fromLeft?,fromRight?])
ang (angle): v (vertex [x,y]), from ([x,y]), to ([x,y]), label, c (color)
cp (complex plane): pts as [re,im,label?] arrays, show (array of "mod","arg","conj")
bar (bar chart): data as [label,value] arrays, o (orientation: vertical|horizontal), c (color)
pie (pie chart): data as [label,value] arrays

SLIDERS: Two formats. Use 4 elements when step 0.1 is fine, 5 when you need a custom step.
  4 elements: [id, min, max, default] — step defaults to 0.1
  5 elements: [id, min, max, step, default] — explicit step
  Example: ["a",-3,3,1] means id="a", range -3 to 3, step 0.1, default 1
  Example: ["a",-3,3,0.5,1] means id="a", range -3 to 3, step 0.5, default 1

DEFAULTS (omit these fields):
- Graph: domain [-10,10], range [-10,10], color cycles blue→red→green→yellow
- AUC: riemann type "left", n 10, color blue
- Tangent: color red, shows slope + point
- Unit circle: angle 0, shows all three, draggable
- Number line: arrows true, intervals inclusive by default
- Venn: colors blue→red→green
- Scatter: linear regression, shows equation + R²
- Normal: mean 0, std dev 1, shows mean line
- Box plot/histogram/bar: color blue
- Bar chart: vertical orientation

Example: {"t":"g","fn":["sin(x)"]} renders a sine wave with standard axes.
Example: {"t":"auc","fn":"x^2","a":0,"b":3} renders area under x² from 0 to 3 with left Riemann sums.
Example: {"t":"vn","sets":[["A",[1,3,5,7,9]],["B",[2,3,5,8,9]]]} renders a Venn diagram — exclusive/intersection counts computed automatically.
Example: {"t":"norm","m":100,"sd":15,"shade":[[85,115,"68.2%"]]} renders a bell curve with shaded region.
`.trim()
