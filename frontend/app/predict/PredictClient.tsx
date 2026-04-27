"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TEAM_COLORS } from "@/lib/design"
import DriverSelect from "./DriverSelect"
import type { F1Event } from "../dashboard/page"

interface PredictionSlot {
  key: "first_place" | "second_place" | "third_place" | "fastest_lap" | "pole_position"
  label: string
  placeholder: string
}

const SLOTS: PredictionSlot[] = [
  { key: "first_place",    label: "P1 — Race Winner",   placeholder: "Winner" },
  { key: "second_place",   label: "P2 — Second Place",  placeholder: "P2" },
  { key: "third_place",    label: "P3 — Third Place",   placeholder: "P3" },
  { key: "fastest_lap",    label: "Fastest Lap",        placeholder: "Fastest Lap" },
  { key: "pole_position",  label: "Pole Position",      placeholder: "Pole" },
]

interface FormState {
  first_place: string | null
  second_place: string | null
  third_place: string | null
  fastest_lap: string | null
  pole_position: string | null
  dnf_driver: string | null
}

interface ExistingPrediction extends FormState {
  event_id: number
  points: number | null
  is_scored: boolean
}

const BLANK: FormState = {
  first_place: null, second_place: null, third_place: null,
  fastest_lap: null, pole_position: null, dnf_driver: null,
}

function DriverChip({ code }: { code: string }) {
  const color = TEAM_COLORS[code] ?? "#666"
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span
        className="font-(family-name:--font-f1-regular) text-sm tracking-wider"
        style={{ color }}
      >
        {code}
      </span>
    </span>
  )
}

export default function PredictClient({
  nextRace,
  backendDown,
}: {
  nextRace: F1Event | null
  backendDown: boolean
}) {
  const [token, setToken] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(BLANK)
  const [existing, setExisting] = useState<ExistingPrediction | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Read token from localStorage on mount (localStorage is client-only)
  useEffect(() => {
    setToken(localStorage.getItem("token"))
  }, [])

  // Fetch existing prediction when we have a token and know the next race
  useEffect(() => {
    if (!token || !nextRace) return
    setLoadingExisting(true)
    fetch("http://localhost:8080/api/predictions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data: ExistingPrediction[] | null) => {
        if (!data) return
        const match = data.find((p) => p.event_id === nextRace.id)
        if (match) setExisting(match)
      })
      .finally(() => setLoadingExisting(false))
  }, [token, nextRace])

  // Drivers already chosen in other required slots (for deduplication)
  function disabledFor(currentKey: keyof FormState): Set<string> {
    const others = (Object.keys(form) as (keyof FormState)[])
      .filter((k) => k !== currentKey && k !== "dnf_driver")
      .map((k) => form[k])
      .filter((v): v is string => v !== null)
    return new Set(others)
  }

  function set(key: keyof FormState) {
    return (v: string | null) => setForm((f) => ({ ...f, [key]: v }))
  }

  const canSubmit =
    form.first_place && form.second_place && form.third_place &&
    form.fastest_lap && form.pole_position

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !token) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("http://localhost:8080/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.detail ?? "Submission failed. Try again.")
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError("Could not reach the server.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Error/edge states ──────────────────────────────────────────────

  if (backendDown) {
    return (
      <div className="glass-card p-8 space-y-2">
        <p className="section-label text-f1-red">Backend unavailable</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          Start the FastAPI server — <code className="text-f1-red">cd backend && uvicorn main:app --reload</code>
        </p>
      </div>
    )
  }

  if (!nextRace) {
    return (
      <div className="glass-card p-8 space-y-2">
        <p className="section-label text-text-muted">Season Complete</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          No upcoming races remain for 2026.
        </p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="glass-card p-8 space-y-3">
        <p className="section-label text-f1-red">Sign in to predict</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          You need an account to lock in predictions.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 px-4 py-2 text-xs font-(family-name:--font-dm-mono)
                     uppercase tracking-widest border border-f1-red text-f1-red
                     hover:bg-f1-red hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const formattedDate = new Date(nextRace.event_date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  // ── Already submitted (from server) ──────────────────────────────

  if (existing && !submitted) {
    return (
      <div className="space-y-6">
        <RaceHeader event={nextRace} formattedDate={formattedDate} />
        <div className="glass-card-accent p-6 space-y-4">
          <p className="section-label text-f1-red">Prediction Locked</p>
          <p className="text-text-muted text-xs font-(family-name:--font-dm-mono)">
            Your picks for this race are already submitted.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                  {label}
                </p>
                {existing[key] ? <DriverChip code={existing[key]!} /> : <span className="text-text-dim text-xs">—</span>}
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                DNF Pick
              </p>
              {existing.dnf_driver
                ? <DriverChip code={existing.dnf_driver} />
                : <span className="text-text-dim text-xs">—</span>}
            </div>
          </div>
          {existing.is_scored && (
            <p className="font-(family-name:--font-orbitron) text-2xl font-bold text-f1-red pt-2">
              {existing.points ?? 0} <span className="text-sm text-text-muted font-(family-name:--font-dm-mono)">pts</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Success state after fresh submit ─────────────────────────────

  if (submitted) {
    return (
      <div className="space-y-6">
        <RaceHeader event={nextRace} formattedDate={formattedDate} />
        <div className="glass-card-accent p-6 space-y-4">
          <p className="section-label text-f1-green">Prediction Submitted</p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                  {label}
                </p>
                {form[key] ? <DriverChip code={form[key]!} /> : <span className="text-text-dim text-xs">—</span>}
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                DNF Pick
              </p>
              {form.dnf_driver ? <DriverChip code={form.dnf_driver} /> : <span className="text-text-dim text-xs">—</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <RaceHeader event={nextRace} formattedDate={formattedDate} />

      {loadingExisting ? (
        <div className="glass-card p-6 animate-pulse">
          <div className="h-4 bg-[#1a1a1a] rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-[#1a1a1a] rounded" />)}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <p className="section-label">Your Picks</p>

          {/* Required slots — P1/P2/P3/FL/Pole */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SLOTS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                  {label}
                </label>
                <DriverSelect
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  disabledCodes={disabledFor(key)}
                />
              </div>
            ))}

            {/* DNF — optional */}
            <div className="space-y-1.5">
              <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                DNF Pick <span className="text-text-dim normal-case">(optional)</span>
              </label>
              <DriverSelect
                value={form.dnf_driver}
                onChange={set("dnf_driver")}
                placeholder="No pick"
                optional
              />
            </div>
          </div>

          {submitError && (
            <p className="text-f1-red text-xs font-(family-name:--font-dm-mono)">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full sm:w-auto px-8 py-3 bg-f1-red text-white text-xs
                       font-(family-name:--font-dm-mono) uppercase tracking-widest
                       hover:bg-f1-red-dark transition-colors disabled:opacity-40
                       disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Locking In…" : "Lock Prediction"}
          </button>
        </form>
      )}
    </div>
  )
}

function RaceHeader({ event, formattedDate }: { event: F1Event; formattedDate: string }) {
  return (
    <div>
      <p className="section-label mb-1">Round {event.round_number} · Upcoming Race</p>
      <h2 className="font-(family-name:--font-orbitron) text-2xl font-bold text-text-primary">
        {event.event_name}
      </h2>
      <p className="text-text-muted text-sm font-(family-name:--font-dm-mono) mt-1">
        {event.country} · {formattedDate}
      </p>
    </div>
  )
}
