"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Pred {
  points_earned: number
  score_breakdown: string | null
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="font-(family-name:--font-orbitron) text-2xl font-black tabular-nums"
        style={{ color: accent ?? "var(--color-text-primary)" }}
      >
        {value}
      </span>
      <span className="text-[0.55rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  )
}

export default function SeasonSnapshot() {
  const [preds, setPreds] = useState<Pred[] | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/predictions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPreds(Array.isArray(d) ? d : []))
      .catch(() => setPreds([]))
  }, [])

  // Hidden for logged-out users and until there's something to show.
  if (!preds || preds.length === 0) return null

  const total = preds.reduce((s, p) => s + (p.points_earned || 0), 0)
  const scoredCount = preds.filter((p) => p.score_breakdown != null).length
  const accuracy = scoredCount > 0 ? Math.round((total / (scoredCount * 64)) * 100) : null
  const best = preds.reduce((m, p) => Math.max(m, p.points_earned || 0), 0)

  return (
    <div className="glass-card p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">Your Season</p>
        <Link
          href="/predictions"
          className="text-[0.6rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-red hover:text-f1-red-dark transition-colors"
        >
          My Picks →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat value={total} label="Total Points" accent="#ED1131" />
        <Stat value={preds.length} label="Races Predicted" />
        <Stat value={accuracy != null ? `${accuracy}%` : "—"} label="Accuracy" />
        <Stat value={best} label="Best Race" />
      </div>
    </div>
  )
}
