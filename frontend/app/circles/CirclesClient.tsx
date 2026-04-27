"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Circle {
  id: number
  name: string
  invite_code: string
  member_count: number
}

interface LeaderboardEntry {
  username: string
  total_points: number
  rank: number
}

type View = "list" | "create" | "join" | "leaderboard"

const API = "http://localhost:8080/api"

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
}

export default function CirclesClient() {
  const [token, setToken] = useState<string | null>(null)
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>("list")

  // Create state
  const [createName, setCreateName] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<{ name: string; invite_code: string } | null>(null)

  // Join state
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Leaderboard state
  const [activeCircle, setActiveCircle] = useState<Circle | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
  const [lbLoading, setLbLoading] = useState(false)

  useEffect(() => {
    setToken(localStorage.getItem("token"))
  }, [])

  useEffect(() => {
    if (!token) return
    fetchCircles(token)
  }, [token])

  function fetchCircles(t: string) {
    setLoading(true)
    fetch(`${API}/groups`, { headers: authHeaders(t) })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data: Circle[]) => setCircles(data))
      .finally(() => setLoading(false))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !createName.trim()) return
    setCreateError(null)
    try {
      const res = await fetch(`${API}/groups`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name: createName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.detail ?? "Failed to create circle."); return }
      setCreateResult({ name: data.name, invite_code: data.invite_code })
      fetchCircles(token)
    } catch {
      setCreateError("Could not reach the server.")
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !joinCode.trim()) return
    setJoinError(null)
    try {
      const res = await fetch(`${API}/groups/join`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ invite_code: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.detail ?? "Failed to join circle."); return }
      setJoinSuccess(true)
      fetchCircles(token)
    } catch {
      setJoinError("Could not reach the server.")
    }
  }

  function openLeaderboard(circle: Circle) {
    if (!token) return
    setActiveCircle(circle)
    setLeaderboard(null)
    setView("leaderboard")
    setLbLoading(true)
    fetch(`${API}/groups/${circle.id}/leaderboard`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data: LeaderboardEntry[] | null) => setLeaderboard(data))
      .finally(() => setLbLoading(false))
  }

  // ── Not logged in ────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="glass-card p-8 space-y-3">
        <p className="section-label text-f1-red">Sign in to access Circles</p>
        <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
          Create or join a private group to compete with friends.
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

  // ── Leaderboard view ─────────────────────────────────────────────

  if (view === "leaderboard" && activeCircle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView("list"); setActiveCircle(null) }}
            className="text-text-muted hover:text-text-primary text-xs font-(family-name:--font-dm-mono)
                       uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <p className="section-label">Circle Leaderboard</p>
            <h2 className="font-(family-name:--font-orbitron) text-xl font-bold text-text-primary">
              {activeCircle.name}
            </h2>
          </div>
        </div>

        <div className="glass-card divide-y divide-border-subtle">
          {lbLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 animate-pulse">
                  <div className="w-6 h-4 bg-border-subtle rounded" />
                  <div className="flex-1 h-4 bg-border-subtle rounded" />
                  <div className="w-10 h-4 bg-border-subtle rounded" />
                </div>
              ))
            : leaderboard && leaderboard.length > 0
              ? leaderboard.map((entry) => (
                  <div key={entry.username} className="px-4 py-3 flex items-center gap-4">
                    <span
                      className="font-(family-name:--font-orbitron) text-sm font-bold w-6 text-right shrink-0"
                      style={{
                        color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#444",
                      }}
                    >
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-text-secondary text-sm font-(family-name:--font-dm-mono)">
                      {entry.username}
                    </span>
                    <span className="font-(family-name:--font-orbitron) text-sm font-bold text-f1-red">
                      {entry.total_points}
                      <span className="text-text-dim text-xs font-(family-name:--font-dm-mono) ml-1">pts</span>
                    </span>
                  </div>
                ))
              : (
                <div className="px-4 py-8 text-center text-text-muted text-sm font-(family-name:--font-dm-mono)">
                  No scored predictions yet.
                </div>
              )
          }
        </div>
      </div>
    )
  }

  // ── Create view ──────────────────────────────────────────────────

  if (view === "create") {
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView("list"); setCreateName(""); setCreateResult(null); setCreateError(null) }}
            className="text-text-muted hover:text-text-primary text-xs font-(family-name:--font-dm-mono)
                       uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="section-label">Create a Circle</p>
        </div>

        {createResult ? (
          <div className="glass-card-accent p-6 space-y-4">
            <p className="section-label text-f1-green">Circle Created</p>
            <p className="font-(family-name:--font-orbitron) text-lg font-bold text-text-primary">
              {createResult.name}
            </p>
            <div className="space-y-1">
              <p className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                Invite Code
              </p>
              <p className="font-(family-name:--font-orbitron) text-2xl font-bold text-f1-red tracking-widest">
                {createResult.invite_code}
              </p>
              <p className="text-text-muted text-xs font-(family-name:--font-dm-mono)">
                Share this code with friends so they can join.
              </p>
            </div>
            <button
              onClick={() => { setView("list"); setCreateName(""); setCreateResult(null) }}
              className="text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                         text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Done →
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                Circle Name
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Bahrain Boys"
                className="w-full px-3 py-2 bg-transparent border border-border-default text-text-primary
                           text-sm font-(family-name:--font-dm-mono) placeholder:text-text-dim
                           focus:outline-none focus:border-f1-red transition-colors"
              />
            </div>
            {createError && (
              <p className="text-f1-red text-xs font-(family-name:--font-dm-mono)">{createError}</p>
            )}
            <button
              type="submit"
              disabled={!createName.trim()}
              className="px-6 py-2.5 bg-f1-red text-white text-xs font-(family-name:--font-dm-mono)
                         uppercase tracking-widest hover:bg-f1-red-dark transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Create Circle
            </button>
          </form>
        )}
      </div>
    )
  }

  // ── Join view ────────────────────────────────────────────────────

  if (view === "join") {
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView("list"); setJoinCode(""); setJoinSuccess(false); setJoinError(null) }}
            className="text-text-muted hover:text-text-primary text-xs font-(family-name:--font-dm-mono)
                       uppercase tracking-widest transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <p className="section-label">Join a Circle</p>
        </div>

        {joinSuccess ? (
          <div className="glass-card-accent p-6 space-y-3">
            <p className="section-label text-f1-green">Joined!</p>
            <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
              You're now part of the circle. Good luck!
            </p>
            <button
              onClick={() => { setView("list"); setJoinCode(""); setJoinSuccess(false) }}
              className="text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                         text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              View Circles →
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="glass-card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.6rem] font-(family-name:--font-dm-mono) text-text-dim uppercase tracking-widest">
                Invite Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter code from a friend"
                className="w-full px-3 py-2 bg-transparent border border-border-default text-text-primary
                           text-sm font-(family-name:--font-dm-mono) placeholder:text-text-dim
                           focus:outline-none focus:border-f1-red transition-colors uppercase tracking-widest"
              />
            </div>
            {joinError && (
              <p className="text-f1-red text-xs font-(family-name:--font-dm-mono)">{joinError}</p>
            )}
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-6 py-2.5 bg-f1-red text-white text-xs font-(family-name:--font-dm-mono)
                         uppercase tracking-widest hover:bg-f1-red-dark transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Join Circle
            </button>
          </form>
        )}
      </div>
    )
  }

  // ── List view (default) ──────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <p className="section-label">My Circles</p>
          <p className="text-text-muted text-xs font-(family-name:--font-dm-mono) mt-0.5">
            Compete with friends — click a circle to see the leaderboard.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setView("join")}
            className="px-4 py-2 text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                       border border-border-default text-text-muted hover:border-f1-red hover:text-f1-red
                       transition-colors cursor-pointer"
          >
            Join
          </button>
          <button
            onClick={() => setView("create")}
            className="px-4 py-2 text-xs font-(family-name:--font-dm-mono) uppercase tracking-widest
                       bg-f1-red text-white hover:bg-f1-red-dark transition-colors cursor-pointer"
          >
            + Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card divide-y divide-border-subtle">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 animate-pulse">
              <div className="flex-1 h-4 bg-border-subtle rounded" />
              <div className="w-16 h-4 bg-border-subtle rounded" />
            </div>
          ))}
        </div>
      ) : circles.length === 0 ? (
        <div className="glass-card p-10 text-center space-y-2">
          <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
            You're not in any circles yet.
          </p>
          <p className="text-text-dim text-xs font-(family-name:--font-dm-mono)">
            Create one or ask a friend for their invite code.
          </p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border-subtle">
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => openLeaderboard(circle)}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-border-subtle
                         transition-colors text-left cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-(family-name:--font-dm-mono) text-sm text-text-primary group-hover:text-f1-red transition-colors truncate">
                  {circle.name}
                </p>
                <p className="text-[0.6rem] text-text-dim font-(family-name:--font-dm-mono) uppercase tracking-widest mt-0.5">
                  Code: {circle.invite_code}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-(family-name:--font-orbitron) text-sm font-bold text-text-secondary">
                  {circle.member_count}
                </p>
                <p className="text-[0.6rem] text-text-dim font-(family-name:--font-dm-mono) uppercase tracking-widest">
                  members
                </p>
              </div>
              <span className="text-text-dim text-xs group-hover:text-f1-red transition-colors">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
