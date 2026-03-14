import * as React from "react"
import { useCoordinateContext } from "../context/CoordinateContext"
import { useTransformContext } from "../context/TransformContext"
import { vec } from ".."

/**
 * A real-time FPS counter overlay for performance monitoring.
 * Displays current FPS in the top-left corner of the Mafs viewport.
 * Only rendered when debug mode is active.
 */
export function FpsCounter() {
  const { xMin, yMax } = useCoordinateContext()
  const { viewTransform } = useTransformContext()
  const [fps, setFps] = React.useState(0)

  const framesRef = React.useRef<number[]>([])
  const rafRef = React.useRef<number>(0)

  React.useEffect(() => {
    function tick(now: number) {
      const frames = framesRef.current
      frames.push(now)
      // Keep only the last second of timestamps
      while (frames.length > 0 && frames[0] <= now - 1000) {
        frames.shift()
      }
      setFps(frames.length)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Position at top-left corner in pixel space
  const [px, py] = vec.transform([xMin, yMax], viewTransform)

  // Color based on FPS: green >50, yellow 30-50, red <30
  const fpsColor = fps >= 50 ? "#4ade80" : fps >= 30 ? "#facc15" : "#f87171"

  return (
    <g className="mafs-shadow" style={{ pointerEvents: "none" }}>
      <rect
        x={px + 8}
        y={py + 6}
        width={72}
        height={24}
        rx={4}
        fill="rgba(0,0,0,0.7)"
      />
      <text
        x={px + 14}
        y={py + 23}
        fontFamily="monospace"
        fontSize={14}
        fontWeight="bold"
        fill={fpsColor}
      >
        {fps} FPS
      </text>
    </g>
  )
}

FpsCounter.displayName = "Debug.FpsCounter"
