'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import './styles.css'

const AirDrawerClient = dynamic(
  () => import('./_components/AirDrawerClient'),
  { ssr: false }
)

const ALLOWED_ROLES = ['superadmin', 'admin', 'manager', 'mentor', 'salesperson']

export default function AirDrawerPage() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!accessToken) {
      router.push('/login')
      return
    }
    setAllowed(ALLOWED_ROLES.includes(user?.role || ''))
  }, [accessToken, user, router])

  if (allowed === null) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0f172a', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        Checking access…
      </div>
    )
  }

  if (!allowed) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0f172a', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20 }}>Access Denied</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          Air Drawer is only available to admins, mentors, and meeting hosts.
        </p>
        <button onClick={() => router.back()}
          style={{ padding: '10px 24px', background: '#8b5cf6', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="airdrawer-root">
      <AirDrawerClient />
    </div>
  )
}
