import { Construction } from 'lucide-react'
import EarlyAccessForm from './EarlyAccessForm'

export const metadata = { title: 'Under Maintenance — TruLearnix' }

export default async function MaintenancePage() {
  let message = 'We are performing scheduled maintenance. We will be back shortly.'
  let earlyAccessEnabled = false
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.trulearnix.com'
    const res = await fetch(`${apiUrl}/api/public/maintenance`, { next: { revalidate: 30 } })
    const data = await res.json()
    if (data.message) message = data.message
    earlyAccessEnabled = !!data.earlyAccessEnabled
  } catch {}

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Construction className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Under Maintenance</h1>
          <p className="text-gray-400 text-base leading-relaxed">{message}</p>
        </div>

        {/* Animated bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" style={{ width: '60%', animation: 'progress 2s ease-in-out infinite' }} />
        </div>

        {/* Early Access */}
        {earlyAccessEnabled && <EarlyAccessForm />}

        <p className="text-gray-600 text-sm">— Team TruLearnix</p>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
