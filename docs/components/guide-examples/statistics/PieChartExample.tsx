"use client"

import { Mafs, PieChart } from "mafs"

export default function PieChartExample() {
  return (
    <Mafs height={420} viewBox={{ x: [-5, 5], y: [-4, 4] }} pan={false}>
      <PieChart
        data={[
          { label: "Physics", value: 40, color: "var(--mafs-blue)" },
          { label: "Math", value: 25, color: "var(--mafs-red)" },
          { label: "CS", value: 35, color: "var(--mafs-green)" },
        ]}
        center={[0, 0]}
        radius={3}
        labelPosition="callout"
        showValues
      />
    </Mafs>
  )
}
