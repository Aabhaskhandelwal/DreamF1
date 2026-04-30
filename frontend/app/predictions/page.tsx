"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NavHeader from "@/components/NavHeader"
import type { F1Event } from "../dashboard/page"
import { TEAM_COLORS } from "@/lib/design"

interface Prediction {
  id: number
  event_id: number
  first_place: string
  second_place: string
  third_place: string
  fourth_place: string | null
  fifth_place: string | null
  fastest_lap: string | null
  dnf_driver: string | null
  pole_position: string | null
  safety_car: boolean | null
  points_earned: number
}

interface RaceCard {
  prediction: Prediction
  event: F1Event
  status: "scored" | "pending" | "upcoming"
}

const DRIVER_PICK_LABELS: { key: keyof Prediction; label: string }[] = [
  { key: "first_place", label: "P1" },
  { key: "second_place", label: "P2" },
  { key: "third_place", label: "P3" },
  { key: "fourth_place", label: "P4" },
  { key: "fifth_place", label: "P5" },
  { key: "pole_position", label: "Pole" },
  { key: "fastest_lap", label: "FL" },
  { key: "dnf_driver", label: "DNF" },
]

function DriverChip({ code, label }: { code: string | null; label: string }) {
  const color = code ? (TEAM_COLORS[code] ?? "#555") : "#333"
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[0.5rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
        {label}
      </span>
      <span
        className="font-(family-name:--font-f1-regular) text-xs px-1.5 py-0.5 rounded-sm"
        style={{
          color: code ? color : "#444",
          backgroundColor: code ? `${color}18` : "transparent",
          border: `1px solid ${code ? `${color}33` : "#222"}`,
        }}
      >
        {code ?? "—"}
      </span>
    </div>
  )
}

export default function PredictionsPage() {
  const [cards, setCards] = useState<RaceCard[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setNotLoggedIn(true); setLoading(false); return }

    const today = new Date().toISOString().split("T")[0]

    Promise.all([
      fetch("http://localhost:8080/api/predictions", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("http://localhost:8080/api/schedule", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([preds, events]: [Prediction[], F1Event[]]) => {
      const eventMap = new Map(events.map((e) => [e.id, e]))

      const joined: RaceCard[] = preds
        .map((p) => {
          const event = eventMap.get(p.event_id)
          if (!event) return null
          const status: RaceCard["status"] =
            event.event_date >= today
              ? "upcoming"
              : event.is_completed
              ? "scored"
              : "pending"
          return { prediction: p, event, status }
        })
        .filter((c): c is RaceCard => c !== null)
        .sort((a, b) => b.event.round_number - a.event.round_number)

      setCards(joined)
      setLoading(false)
    })
  }, [])

  const totalPoints = cards?.reduce((s, c) => s + c.prediction.points_earned, 0) ?? 0
  const scoredCount = cards?.filter((c) => c.status === "scored").length ?? 0
  const maxPossible = scoredCount * 64

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <NavHeader active="predictions" />

      {notLoggedIn ? (
        <div className="glass-card p-8 space-y-3">
          <p className="section-label text-f1-red">Sign in to view your predictions</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                       border border-f1-red text-f1-red hover:bg-f1-red hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      ) : loading ? (
        <div className="glass-card p-8 space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-border-subtle rounded" />)}
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="glass-card p-5 flex flex-wrap gap-6 sm:gap-12">
            <div>
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase tracking-widest">Total Points</p>
              <p className="font-(family-name:--font-orbitron) text-3xl font-black text-f1-red mt-0.5">{totalPoints}</p>
            </div>
            <div>
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase tracking-widest">Races Predicted</p>
              <p className="font-(family-name:--font-orbitron) text-3xl font-black text-text-primary mt-0.5">{cards?.length ?? 0}</p>
            </div>
            {scoredCount > 0 && (
              <div>
                <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted uppercase tracking-widest">Accuracy</p>
                <p className="font-(family-name:--font-orbitron) text-3xl font-black text-text-primary mt-0.5">
                  {Math.round((totalPoints / maxPossible) * 100)}
                  <span className="text-sm text-text-muted font-(family-name:--font-dm-mono) ml-0.5">%</span>
                </p>
              </div>
            )}
          </div>

          {/* Cards */}
          {!cards || cards.length === 0 ? (
            <div className="glass-card p-10 text-center space-y-2">
              <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">No predictions yet.</p>
              <p className="text-text-dim text-xs font-(family-name:--font-dm-mono)">Head to the Predict page to lock in your picks for the next race.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map(({ prediction: p, event: e, status }) => (
                <div
                  key={p.id}
                  className="glass-card overflow-hidden"
                  style={{ borderLeft: status === "scored" ? "2px solid #ED1131" : status === "upcoming" ? "2px solid #4ade80" : "2px solid #444" }}
                >
                  <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
                    {/* Race info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                          R{e.round_number}
                        </span>
                        <StatusBadge status={status} />
                      </div>
                      <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-primary truncate">
                        {e.event_name}
                      </p>
                      <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-muted mt-0.5">
                        {new Date(e.event_date + "T12:00:00Z").toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      {status === "scored" ? (
                        <>
                          <p className="font-(family-name:--font-orbitron) text-2xl font-black text-f1-red leading-none">
                            {p.points_earned}
                          </p>
                          <p className="text-[0.55rem] font-(family-name:--font-dm-mono) text-text-muted uppercase tracking-widest mt-0.5">pts</p>
                        </>
                      ) : (
                        <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest mt-1">
                          {status === "upcoming" ? "Locked" : "Pending"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Picks row */}
                  <div className="flex items-center gap-3 sm:gap-5 px-4 pb-4 flex-wrap">
                    {DRIVER_PICK_LABELS.map(({ key, label }) => (
                      <DriverChip
                        key={key}
                        code={p[key] as string | null}
                        label={label}
                      />
                    ))}
                    {/* Safety Car chip */}
                    {p.safety_car !== null && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[0.5rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">SC</span>
                        <span className="font-(family-name:--font-dm-mono) text-xs px-1.5 py-0.5 rounded-sm"
                          style={{ color: "#aaaaaa", backgroundColor: "#aaaaaa18", border: "1px solid #aaaaaa33" }}>
                          {p.safety_car ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: RaceCard["status"] }) {
  if (status === "scored")
    return <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-red">Scored</span>
  if (status === "upcoming")
    return <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-f1-green">Upcoming</span>
  return <span className="text-[0.5rem] font-(family-name:--font-dm-mono) uppercase tracking-widest text-text-dim">Pending</span>
}
