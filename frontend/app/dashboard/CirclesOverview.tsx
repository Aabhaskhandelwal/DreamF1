"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Group {
  id: number
  name: string
  invite_code: string
  member_count: number
}

export default function CirclesOverview() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setAuthed(false)
      setLoading(false)
      return
    }
    fetch("http://localhost:8080/api/groups", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <p className="section-label mb-3">My Circles</p>

      {!authed ? (
        <div className="glass-card p-4 sm:p-6 flex flex-col gap-3">
          <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
            Sign in to see your circles.
          </p>
          <Link
            href="/login"
            className="self-start text-xs font-(family-name:--font-dm-mono) uppercase tracking-wider text-f1-red hover:text-f1-red-dark transition-colors"
          >
            Sign In →
          </Link>
        </div>
      ) : loading ? (
        <div className="glass-card p-4 sm:p-5 text-text-dim font-(family-name:--font-dm-mono) text-sm animate-pulse">
          Loading...
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-4 sm:p-6 flex flex-col gap-3">
          <p className="text-text-muted text-sm font-(family-name:--font-dm-mono)">
            No circles yet. Create one to compete with friends.
          </p>
          <Link
            href="/circles"
            className="self-start text-xs font-(family-name:--font-dm-mono) uppercase tracking-wider text-f1-red hover:text-f1-red-dark transition-colors"
          >
            Create or Join →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {groups.map((group) => (
            <div key={group.id} className="glass-card-accent p-4 sm:p-5 flex flex-col gap-3">
              <div>
                <p className="font-(family-name:--font-orbitron) text-base font-medium text-text-primary">
                  {group.name}
                </p>
                <p className="metric-label mt-1">{group.member_count} members</p>
              </div>
              <Link
                href={`/circles/${group.id}`}
                className="self-start text-xs font-(family-name:--font-dm-mono) uppercase tracking-wider text-f1-red hover:text-f1-red-dark transition-colors"
              >
                Leaderboard →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
