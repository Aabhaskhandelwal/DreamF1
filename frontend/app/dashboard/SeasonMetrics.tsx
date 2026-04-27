interface Props {
  total: number
  completed: number
  remaining: number
}

export default function SeasonMetrics({ total, completed, remaining }: Props) {
  const metrics = [
    { value: total, label: "Total Rounds" },
    { value: completed, label: "Completed" },
    { value: remaining, label: "Remaining" },
  ]

  return (
    <section>
      <p className="section-label mb-3">2026 Season</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {metrics.map(({ value, label }) => (
          <div key={label} className="glass-card p-3 sm:p-5 flex flex-col gap-1">
            <span className="metric-value">{value}</span>
            <span className="metric-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
