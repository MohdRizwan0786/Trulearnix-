'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './styles.css'

const AirDrawerClient = dynamic(
  () => import('./_components/AirDrawerClient'),
  { ssr: false }
)

const ALLOWED_ROLES = ['superadmin', 'admin', 'mentor', 'teacher']
const ALLOWED_PERM = 'air-drawer'

export default function AirDrawerPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    const role = typeof window !== 'undefined' ? (localStorage.getItem('adminRole') || '') : ''
    const permsRaw = typeof window !== 'undefined' ? localStorage.getItem('adminPermissions') : null

    if (!token) {
      router.push('/login')
      return
    }

    let perms: string[] = []
    try { perms = permsRaw ? JSON.parse(permsRaw) : [] } catch {}

    const roleOk = ALLOWED_ROLES.includes(role)
    const permOk = perms.includes('*') || perms.includes(ALLOWED_PERM) || perms.includes('live-classes')

    if (roleOk || permOk) {
      setAllowed(true)
    } else {
      setAllowed(false)
    }
  }, [router])

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
          Air Drawer is only available to admins, mentors, teachers, and meeting hosts.
        </p>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding: '10px 24px', background: '#8b5cf6', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
          Back to Dashboard
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
