"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TEAM_COLORS } from "@/lib/design"
import DriverSelect from "./DriverSelect"
import type { F1Event } from "../dashboard/page"

interface PredictionSlot {
  key: "pole_position" | "first_place" | "second_place" | "third_place" | "fourth_place" | "fifth_place" | "fastest_lap" | "dnf_driver"
  label: string
  placeholder: string
}

const DRIVER_SLOTS: PredictionSlot[] = [
  { key: "pole_position", label: "Pole Position",     placeholder: "Pole" },
  { key: "first_place",   label: "P1 — Race Winner",  placeholder: "Winner" },
  { key: "second_place",  label: "P2 — Second Place", placeholder: "P2" },
  { key: "third_place",   label: "P3 — Third Place",  placeholder: "P3" },
  { key: "fourth_place",  label: "P4 — Fourth Place", placeholder: "P4" },
  { key: "fifth_place",   label: "P5 — Fifth Place",  placeholder: "P5" },
  { key: "fastest_lap",   label: "Fastest Lap",       placeholder: "Fastest Lap" },
  { key: "dnf_driver",    label: "DNF Driver",        placeholder: "DNF" },
]

// Position slots that must not share a driver with each other
const POSITION_KEYS = new Set<keyof FormState>([
  "pole_position", "first_place", "second_place", "third_place",
  "fourth_place", "fifth_place", "fastest_lap",
])

interface FormState {
  pole_position: string | null
  first_place: string | null
  second_place: string | null
  third_place: string | null
  fourth_place: string | null
  fifth_place: string | null
  fastest_lap: string | null
  dnf_driver: string | null
  safety_car: boolean | null
}

interface ExistingPrediction {
  event_id: number
  pole_position: string | null
  first_place: string | null
  second_place: string | null
  third_place: string | null
  fourth_place: string | null
  fifth_place: string | null
  fastest_lap: string | null
  dnf_driver: string | null
  safety_car: boolean | null
  points: number | null
  is_scored: boolean
}

const BLANK: FormState = {
  pole_position: null, first_place: null, second_place: null, third_place: null,
  fourth_place: null, fifth_place: null, fastest_lap: null,
  dnf_driver: null, safety_car: null,
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

  useEffect(() => {
    setToken(localStorage.getItem("token"))
  }, [])

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

  // Position slots deduplicate against each other; DNF slot can share a driver
  function disabledFor(currentKey: keyof FormState): Set<string> {
    if (!POSITION_KEYS.has(currentKey)) return new Set()
    return new Set(
      (Object.keys(form) as (keyof FormState)[])
        .filter((k) => k !== currentKey && POSITION_KEYS.has(k))
        .map((k) => form[k])
        .filter((v): v is string => v !== null)
    )
  }

  function set(key: keyof FormState) {
    return (v: string | null) => setForm((f) => ({ ...f, [key]: v }))
  }

  const canSubmit =
    form.pole_position && form.first_place && form.second_place && form.third_place &&
    form.fourth_place && form.fifth_place && form.fastest_lap && form.dnf_driver &&
    form.safety_car !== null

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
            {DRIVER_SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                  {label}
                </p>
                {existing[key]
                  ? <DriverChip code={existing[key] as string} />
                  : <span className="text-text-dim text-xs">—</span>}
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">Safety Car</p>
              <span className="text-xs font-(family-name:--font-dm-mono) text-text-secondary">
                {existing.safety_car === null ? "—" : existing.safety_car ? "Yes" : "No"}
              </span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2">
            {DRIVER_SLOTS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">{label}</p>
                {form[key]
                  ? <DriverChip code={form[key] as string} />
                  : <span className="text-text-dim text-xs">—</span>}
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">Safety Car</p>
              <span className="text-xs font-(family-name:--font-dm-mono) text-text-secondary">
                {form.safety_car === null ? "—" : form.safety_car ? "Yes" : "No"}
              </span>
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
          <div className="h-4 bg-border-subtle rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="h-10 bg-border-subtle rounded" />)}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <p className="section-label">Your Picks</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {DRIVER_SLOTS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                  {label}
                </label>
                <DriverSelect
                  value={form[key] as string | null}
                  onChange={set(key)}
                  placeholder={placeholder}
                  disabledCodes={disabledFor(key)}
                />
              </div>
            ))}

            {/* Safety Car — required yes/no */}
            <div className="space-y-1.5">
              <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                Safety Car Deployed?
              </label>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, safety_car: val }))}
                    className={`px-4 py-1.5 text-[0.65rem] font-(family-name:--font-dm-mono) uppercase tracking-widest
                                border transition-colors cursor-pointer
                                ${form.safety_car === val
                                  ? "border-f1-red bg-f1-red text-white"
                                  : "border-border-muted text-text-muted hover:border-[#444] hover:text-text-primary"
                                }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-f1-red text-xs font-(family-name:--font-dm-mono)">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full sm:w-auto px-5 sm:px-8 py-2.5 sm:py-3 bg-f1-red text-white text-xs
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
