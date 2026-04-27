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
        <div className="glass-card p-6 flex flex-col gap-3">
          <p className="text-[#555] text-sm font-[family-name:var(--font-dm-mono)]">
            Sign in to see your circles.
          </p>
          <Link
            href="/login"
            className="self-start text-xs font-[family-name:var(--font-dm-mono)] uppercase tracking-wider text-[#ED1131] hover:text-[#b5001e] transition-colors"
          >
            Sign In →
          </Link>
        </div>
      ) : loading ? (
        <div className="glass-card p-5 text-[#333] font-[family-name:var(--font-dm-mono)] text-sm animate-pulse">
          Loading...
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-6 flex flex-col gap-3">
          <p className="text-[#555] text-sm font-[family-name:var(--font-dm-mono)]">
            No circles yet. Create one to compete with friends.
          </p>
          <Link
            href="/circles"
            className="self-start text-xs font-[family-name:var(--font-dm-mono)] uppercase tracking-wider text-[#ED1131] hover:text-[#b5001e] transition-colors"
          >
            Create or Join →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="glass-card-accent p-5 flex flex-col gap-3">
              <div>
                <p className="font-[family-name:var(--font-orbitron)] text-base font-medium text-[#f3f3f3]">
                  {group.name}
                </p>
                <p className="metric-label mt-1">{group.member_count} members</p>
              </div>
              <Link
                href={`/circles/${group.id}`}
                className="self-start text-xs font-[family-name:var(--font-dm-mono)] uppercase tracking-wider text-[#ED1131] hover:text-[#b5001e] transition-colors"
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
