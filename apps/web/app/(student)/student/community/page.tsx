'use client'
import { useQuery } from '@tanstack/react-query'
import { packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Users, MessageCircle, Send, ExternalLink, Sparkles, Lock, ArrowRight, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

export default function CommunityPage() {
  const { user } = useAuthStore()
  const tier = (user as any)?.packageTier || 'free'

  const { data: pkgs, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages),
    staleTime: 10 * 60 * 1000,
  })

  const myPkg = pkgs?.find((p: any) => p.tier === tier)
  const links = myPkg?.communityLinks || {}
  const hasTelegram = !!links.telegramUrl
  const hasWhatsapp = !!links.whatsappUrl
  const hasAny = hasTelegram || hasWhatsapp
  const isFree = tier === 'free'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))',
          border: '1px solid rgba(99,102,241,0.25)',
        }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(99,102,241,0.25)' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white">Community</h1>
            <p className="text-sm text-gray-300 mt-1">
              Apne plan ke saath aane wale exclusive Telegram aur WhatsApp groups join karein —
              learners se jude rahein, doubts pucheein aur opportunities pakdein.
            </p>
            {myPkg && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}>
                <Sparkles className="w-3 h-3" />
                {myPkg.name} Plan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-2xl p-8 text-center text-gray-400 text-sm border border-white/10">
          Loading your community access…
        </div>
      )}

      {/* Free user — no community access yet */}
      {!isLoading && isFree && (
        <div className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(251,191,36,0.06))',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white mt-4">Community is for enrolled learners</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Koi bhi paid package lete hi aapko apne plan ke according private Telegram aur WhatsApp
            groups ka access mil jata hai.
          </p>
          <Link href="/packages"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            View Packages
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Paid user — links not configured by admin */}
      {!isLoading && !isFree && !hasAny && (
        <div className="rounded-2xl p-6 text-center border border-white/10 bg-white/[0.02]">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-white mt-4">Community links coming soon</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Aapke plan ke groups setup ho rahe hain. Jaise hi admin links add karega, yahaan dikhne lag jayenge.
          </p>
        </div>
      )}

      {/* Paid user — links available */}
      {!isLoading && !isFree && hasAny && (
        <>
          {links.note && (
            <div className="rounded-xl px-4 py-3 text-sm text-gray-300 border border-white/10 bg-white/[0.03] flex gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{links.note}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {hasTelegram && (
              <a href={links.telegramUrl} target="_blank" rel="noopener noreferrer"
                className="group rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(56,189,248,0.06))',
                  border: '1px solid rgba(14,165,233,0.3)',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">Telegram</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {links.telegramLabel || `Join ${myPkg?.name || ''} Telegram`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Tap to open in Telegram</span>
                  <ExternalLink className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            )}

            {hasWhatsapp && (
              <a href={links.whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="group rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.06))',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {links.whatsappLabel || `Join ${myPkg?.name || ''} WhatsApp`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Tap to open in WhatsApp</span>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            )}
          </div>

          <div className="rounded-xl px-4 py-3 text-xs text-gray-500 border border-white/10 bg-white/[0.02]">
            Yeh links sirf {myPkg?.name || 'aapke'} plan members ke liye hain — kripya kisi aur ke saath share na karein.
          </div>
        </>
      )}
    </div>
  )
}
