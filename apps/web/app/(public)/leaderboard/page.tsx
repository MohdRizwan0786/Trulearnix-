import LeaderboardClient from './LeaderboardClient'

export const metadata = {
  title: 'Partner Leaderboard — TruLearnix',
  description: 'Top earning partners on TruLearnix. Real earnings, updated regularly.',
}

async function fetchLeaderboard() {
  try {
    const base = process.env.INTERNAL_API_URL || 'http://localhost:5000'
    const res = await fetch(`${base}/api/affiliate/leaderboard`, { next: { revalidate: 300 } })
    const data = await res.json()
    return data.leaderboard || []
  } catch {
    return []
  }
}

export default async function LeaderboardPage() {
  const initialData = await fetchLeaderboard()
  return <LeaderboardClient initialData={initialData} />
}
