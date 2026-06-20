import NavHeader from "@/components/NavHeader"
import StandingsClient from "./StandingsClient"

export default function StandingsPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <NavHeader active="standings" />
      <StandingsClient />
    </div>
  )
}
