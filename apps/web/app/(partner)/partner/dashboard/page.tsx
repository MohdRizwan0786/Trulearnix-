'use client'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI, managerAPI, packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  TrendingUp, Users, Coins, Trophy, Crown, Lock,
  Network, ShieldCheck, Link2, Award, UserCog, MessageSquare,
  Target, Copy, CheckCircle2, ArrowRight, Zap, Star,
  Activity, Flame, Wallet, BarChart2, ChevronRight,
  Sparkles, BadgeCheck, ArrowUpRight, IndianRupee,
  CircleDollarSign, Banknote, GitBranch, LayoutGrid,
} from 'lucide-react'

// ─── Tier config ────────────────────────────────────────────────────────────
const TIERS = ['free', 'starter', 'pro', 'proedge', 'elite', 'supreme'] as const
type Tier = typeof TIERS[number]

const TIER_CFG: Record<Tier, {
  color: string; glow: string; bg: string; bgCard: string
  label: string; icon: string; order: number; price: string; tagline: string
}> = {
  free:    { color:'#6b7280', glow:'rgba(107,114,128,0.4)',  bg:'linear-gradient(135deg,#374151,#1f2937)', bgCard:'rgba(107,114,128,0.08)', label:'Free',    icon:'🆓', order:0, price:'₹0',      tagline:'Basic Access' },
  starter: { color:'#3b82f6', glow:'rgba(59,130,246,0.45)', bg:'linear-gradient(135deg,#1d4ed8,#1e40af)', bgCard:'rgba(59,130,246,0.08)',  label:'Starter', icon:'🚀', order:1, price:'₹4,999',  tagline:'Start Earning' },
  pro:     { color:'#8b5cf6', glow:'rgba(139,92,246,0.45)', bg:'linear-gradient(135deg,#7c3aed,#5b21b6)', bgCard:'rgba(139,92,246,0.08)',  label:'Pro',      icon:'⚡', order:2, price:'₹9,999',  tagline:'Higher Partnership earnings' },
  proedge: { color:'#d946ef', glow:'rgba(217,70,239,0.45)', bg:'linear-gradient(135deg,#a21caf,#6b21a8)', bgCard:'rgba(217,70,239,0.08)',  label:'Pro-Edge', icon:'🔥', order:3, price:'₹14,999', tagline:'Pro Plus Edge' },
  elite:   { color:'#f59e0b', glow:'rgba(245,158,11,0.45)', bg:'linear-gradient(135deg,#d97706,#b45309)', bgCard:'rgba(245,158,11,0.08)',  label:'Elite',    icon:'💎', order:4, price:'₹19,999', tagline:'VIP Benefits' },
  supreme: { color:'#ec4899', glow:'rgba(236,72,153,0.45)', bg:'linear-gradient(135deg,#e11d48,#be185d)', bgCard:'rgba(236,72,153,0.08)',  label:'Supreme',  icon:'👑', order:5, price:'₹29,999', tagline:'Maximum Power' },
}

const TIER_BENEFITS: Record<Tier, { text: string; highlight?: boolean }[]> = {
  free:    [{ text:'Browse free courses' }, { text:'Basic dashboard' }, { text:'Community access' }],
  starter: [{ text:'3-level Partnership earning system', highlight:true }, { text:'Partner link generator', highlight:true }, { text:'CRM & lead tracking' }, { text:'Full course library' }, { text:'Wallet & withdrawals' }],
  pro:     [{ text:'Higher Partnership earning rates', highlight:true }, { text:'Advanced analytics', highlight:true }, { text:'Priority support' }, { text:'All Starter benefits' }, { text:'Pro training modules' }],
  proedge: [{ text:'Pro-Edge Partnership earning rates', highlight:true }, { text:'Edge analytics & toolkit', highlight:true }, { text:'Priority mentor support' }, { text:'All Pro benefits' }, { text:'Pro-Edge exclusive modules' }],
  elite:   [{ text:'Top Partnership earning rates', highlight:true }, { text:'VIP partner events', highlight:true }, { text:'Dedicated support line' }, { text:'All Pro benefits' }, { text:'Elite resources & tools' }],
  supreme: [{ text:'Maximum Partnership earnings', highlight:true }, { text:'Personal manager', highlight:true }, { text:'Hall of Fame feature' }, { text:'All Elite benefits' }, { text:'Exclusive webinars & bonuses' }],
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ h = 120, radius = 20 }: { h?: number; radius?: number }) {
  return (
    <div style={{
      height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,rgba(139,92,246,0.06) 0%,rgba(139,92,246,0.14) 50%,rgba(139,92,246,0.06) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s ease-in-out infinite',
    }} />
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, color, title, sub, href, linkLabel }: {
  icon: any; color: string; title: string; sub?: string; href?: string; linkLabel?: string
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:36, height:36, borderRadius:11,
          background:`${color}18`,
          border:`1px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 12px ${color}20`,
        }}>
          <Icon style={{ width:17, height:17, color }} />
        </div>
        <div>
          <h3 style={{ color:'white', fontWeight:800, fontSize:14, margin:0 }}>{title}</h3>
          {sub && <p style={{ color:'#4b5563', fontSize:11, margin:0, marginTop:2 }}>{sub}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} style={{
          display:'flex', alignItems:'center', gap:5,
          color, fontSize:11, fontWeight:700, textDecoration:'none',
          background:`${color}12`, border:`1px solid ${color}25`,
          padding:'6px 12px', borderRadius:100,
          transition:'all 0.2s',
        }}>
          {linkLabel || 'View All'} <ArrowUpRight style={{ width:11, height:11 }} />
        </Link>
      )}
    </div>
  )
}

// ─── Earnings Bar Chart ──────────────────────────────────────────────────────
function EarningsChart({ trend }: { trend: any[] }) {
  const data = trend.slice(-6)
  if (!data.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:140, gap:10 }}>
      <div style={{
        width:52, height:52, borderRadius:16,
        background:'rgba(139,92,246,0.08)',
        border:'1px solid rgba(139,92,246,0.2)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <BarChart2 style={{ color:'rgba(139,92,246,0.4)', width:24, height:24 }} />
      </div>
      <p style={{ color:'#374151', fontSize:13, fontWeight:500 }}>No earnings data yet — start referring!</p>
    </div>
  )
  const maxVal = Math.max(...data.map((t: any) => t.earnings || t.total || 0), 1)
  const chartH = 110, barW = 30, gap = 16, padL = 8
  const totalW = data.length * (barW + gap) - gap + padL * 2
  return (
    <div style={{ overflowX:'auto', paddingBottom:4 }}>
      <svg viewBox={`0 0 ${totalW} ${chartH + 44}`} style={{ width:'100%', minWidth:totalW, height:chartH + 44 }}>
        <defs>
          <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="barBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b2e" />
            <stop offset="100%" stopColor="#0d0d14" />
          </linearGradient>
          <filter id="barGlow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f}
            x1={padL} y1={chartH * (1 - f) + 4}
            x2={totalW - padL} y2={chartH * (1 - f) + 4}
            stroke="rgba(139,92,246,0.08)" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}
        {data.map((t: any, i: number) => {
          const val = t.earnings || t.total || 0
          const barH = Math.max(8, (val / maxVal) * chartH)
          const x = padL + i * (barW + gap), y = chartH - barH + 4
          const isMax = val === maxVal && val > 0
          const label = t.month ? t.month.slice(0, 3) : (MONTHS[(t._id?.month || 1) - 1] || '')
          return (
            <g key={i}>
              {/* Shadow */}
              <rect x={x + 3} y={y + 6} width={barW} height={barH} rx={8}
                fill={isMax ? 'rgba(192,132,252,0.18)' : 'rgba(99,102,241,0.12)'} />
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={8}
                fill={isMax ? 'url(#barGrad2)' : 'url(#barGrad1)'}
                filter={isMax ? 'url(#barGlow)' : undefined} />
              {/* Top cap glow line */}
              {isMax && <rect x={x} y={y} width={barW} height={3} rx={3} fill="rgba(255,255,255,0.4)" />}
              {/* Value label */}
              {val > 0 && (
                <text x={x + barW / 2} y={y - 7} textAnchor="middle"
                  fill={isMax ? '#f0abfc' : '#7c5cbf'} fontSize="8" fontWeight="700">
                  {val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
                </text>
              )}
              {/* Month label */}
              <text x={x + barW / 2} y={chartH + 22} textAnchor="middle"
                fill={isMax ? '#c4b5fd' : '#374151'} fontSize="10" fontWeight={isMax ? '700' : '500'}>
                {label}
              </text>
              {isMax && (
                <text x={x + barW / 2} y={chartH + 35} textAnchor="middle"
                  fill="#7c3aed" fontSize="8" fontWeight="700">▲</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Network Rings ────────────────────────────────────────────────────────────
function NetworkRings({ l1, l2, l3 }: { l1: number; l2: number; l3: number }) {
  const total = l1 + l2 + l3
  const ring = (r: number, count: number, color: string, trackColor: string) => {
    const circ = 2 * Math.PI * r
    const pct = total > 0 ? Math.min(count / total, 1) : 0
    return { circ, dash: circ * pct, trackColor, color }
  }
  const rings = [
    { ...ring(36, l1, '#8b5cf6', 'rgba(139,92,246,0.12)'), label:'L1 Direct', count:l1, accent:'#a78bfa' },
    { ...ring(25, l2, '#06b6d4', 'rgba(6,182,212,0.12)'),  label:'L2 Network', count:l2, accent:'#67e8f9' },
    { ...ring(14, l3, '#f59e0b', 'rgba(245,158,11,0.12)'),  label:'L3 Extended', count:l3, accent:'#fcd34d' },
  ]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          <defs>
            <filter id="ringGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {rings.map((ring, i) => {
            const cx = 44, cy = 44
            const r = [36, 25, 14][i]
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring.trackColor} strokeWidth={i === 0 ? 9 : i === 1 ? 7 : 5} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring.color} strokeWidth={i === 0 ? 9 : i === 1 ? 7 : 5}
                  strokeDasharray={`${ring.dash} ${ring.circ}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  filter="url(#ringGlow)"
                />
              </g>
            )
          })}
          <text x="44" y="47" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">{total}</text>
          <text x="44" y="57" textAnchor="middle" fill="#4b5563" fontSize="8">total</text>
        </svg>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {rings.map(({ label, count, accent, color }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:`${color}15`,
              border:`1px solid ${color}25`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <span style={{ color: accent, fontWeight:900, fontSize:14 }}>{count}</span>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12, fontWeight:600, margin:0 }}>{label}</p>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.05)', marginTop:5 }}>
                <div style={{
                  height:3, borderRadius:2, background:color,
                  width:`${total > 0 ? (count / total) * 100 : 0}%`,
                  boxShadow:`0 0 6px ${color}60`,
                  transition:'width 1s ease',
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Glass Stat Card ──────────────────────────────────────────────────────────
function GlassStatCard({ label, value, icon: Icon, color, glow, sub, trend }: {
  label: string; value: string; icon: any; color: string; glow: string; sub?: string; trend?: 'up' | 'down' | null
}) {
  return (
    <div style={{
      position:'relative', overflow:'hidden',
      borderRadius:20, padding:'18px 16px',
      background:'rgba(13,13,20,0.8)',
      backdropFilter:'blur(16px)',
      border:`1px solid ${color}25`,
      boxShadow:`0 4px 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
    }}>
      {/* Gradient orb */}
      <div style={{
        position:'absolute', top:-30, right:-30, width:100, height:100,
        borderRadius:'50%', background:`${color}15`,
        filter:'blur(20px)', pointerEvents:'none',
      }} />
      <div style={{ position:'relative' }}>
        <div style={{
          width:38, height:38, borderRadius:12,
          background:`${color}18`, border:`1px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14,
          boxShadow:`0 0 14px ${color}25`,
        }}>
          <Icon style={{ width:18, height:18, color }} />
        </div>
        <p style={{ color:'#4b5563', fontSize:10, textTransform:'uppercase', letterSpacing:1.2, margin:0 }}>{label}</p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
          <p style={{ color:'white', fontWeight:900, fontSize:20, margin:0 }}>{value}</p>
          {trend === 'up' && (
            <span style={{ color:'#4ade80', fontSize:10, fontWeight:700, background:'rgba(74,222,128,0.12)', padding:'2px 6px', borderRadius:100 }}>
              ↑
            </span>
          )}
        </div>
        {sub && <p style={{ color:'#374151', fontSize:10, marginTop:4, margin:0 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Leaderboard Mini ─────────────────────────────────────────────────────────
function LeaderboardMini({ title, data, myRank, myEarnings, userId, accent, icon, resetLabel, tierNameMap }: {
  title: string; data: any[]; myRank: number; myEarnings: number
  userId?: string; accent: string; icon: string; resetLabel?: string
  tierNameMap?: Record<string, string>
}) {
  const getTierName = (t?: string) => t ? ((tierNameMap || {})[t.toLowerCase()] || t) : '—'
  const MEDALS = ['🥇', '🥈', '🥉']
  const top5 = data.slice(0, 5)
  const myEntry = data.find((u: any) => String(u._id) === String(userId))
  const showMyRow = myRank > 5 && myEntry
  return (
    <div style={{
      flex:1, minWidth:0,
      background:'rgba(13,13,20,0.9)',
      border:`1px solid ${accent}20`,
      borderRadius:20, overflow:'hidden',
      backdropFilter:'blur(12px)',
    }}>
      <div style={{
        padding:'14px 16px 12px',
        background:`linear-gradient(135deg,${accent}15,${accent}05)`,
        borderBottom:`1px solid ${accent}12`,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <div>
              <p style={{ color:'white', fontWeight:800, fontSize:13, margin:0 }}>{title}</p>
              {resetLabel && <p style={{ color:accent, fontSize:10, fontWeight:600, margin:0, marginTop:1 }}>{resetLabel}</p>}
            </div>
          </div>
          {myRank > 0 && (
            <div style={{
              background:`${accent}18`, border:`1px solid ${accent}30`,
              borderRadius:100, padding:'3px 10px',
              boxShadow:`0 0 10px ${accent}20`,
            }}>
              <span style={{ color:accent, fontSize:11, fontWeight:800 }}>#{myRank} You</span>
            </div>
          )}
        </div>
        {myEarnings > 0 && (
          <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.4)', borderRadius:10, padding:'5px 10px' }}>
            <span style={{ color:'#4b5563', fontSize:10 }}>Your earnings:</span>
            <span style={{ color:accent, fontWeight:800, fontSize:12 }}>₹{myEarnings.toLocaleString()}</span>
          </div>
        )}
      </div>
      <div style={{ padding:'8px' }}>
        {top5.length === 0 ? (
          <div style={{ padding:'24px', textAlign:'center', color:'#374151', fontSize:12 }}>No data yet</div>
        ) : (
          top5.map((u: any, i: number) => {
            const isMe = String(u._id) === String(userId)
            return (
              <div key={u._id || i} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 8px',
                borderRadius:12, marginBottom:3,
                background: isMe ? `${accent}10` : 'transparent',
                border: isMe ? `1px solid ${accent}22` : '1px solid transparent',
              }}>
                <div style={{
                  width:28, height:28, borderRadius:9, flexShrink:0,
                  background: i < 3 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: i < 3 ? 15 : 11, fontWeight:800, color: i < 3 ? 'white' : '#4b5563',
                }}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </div>
                {u.avatar ? (
                  <img src={u.avatar} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`1.5px solid ${isMe ? accent : 'rgba(255,255,255,0.1)'}` }} />
                ) : (
                  <div style={{
                    width:30, height:30, borderRadius:'50%', flexShrink:0,
                    background:`linear-gradient(135deg,${accent}50,${accent}25)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontWeight:800, fontSize:13,
                    border:`1.5px solid ${isMe ? accent : 'rgba(255,255,255,0.07)'}`,
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color: isMe ? 'white' : 'rgba(255,255,255,0.75)', fontSize:12, fontWeight: isMe ? 700 : 500, margin:0 }} className="truncate">
                    {u.name} {isMe && <span style={{ color:accent, fontSize:10 }}>(You)</span>}
                  </p>
                  <p style={{ color:'#374151', fontSize:10, margin:0 }}>{getTierName(u.packageTier)} · {u.totalReferrals || 0} refs</p>
                </div>
                <span style={{ color:accent, fontWeight:800, fontSize:12, flexShrink:0 }}>
                  ₹{(u.periodEarnings || u.totalEarnings || 0).toLocaleString()}
                </span>
              </div>
            )
          })
        )}
        {showMyRow && (
          <>
            <div style={{ textAlign:'center', color:'#1f2937', fontSize:11, padding:'2px 0' }}>· · ·</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 8px', borderRadius:12, background:`${accent}10`, border:`1px solid ${accent}22` }}>
              <div style={{ width:28, height:28, borderRadius:9, background:`${accent}20`, display:'flex', alignItems:'center', justifyContent:'center', color:accent, fontWeight:800, fontSize:11, flexShrink:0 }}>#{myRank}</div>
              {myEntry.avatar ? (
                <img src={myEntry.avatar} alt="" style={{ width:30, height:30, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`1.5px solid ${accent}` }} />
              ) : (
                <div style={{ width:30, height:30, borderRadius:'50%', background:`${accent}35`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {myEntry.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'white', fontSize:12, fontWeight:700, margin:0 }}>{myEntry.name} <span style={{ color:accent, fontSize:10 }}>(You)</span></p>
                <p style={{ color:'#4b5563', fontSize:10, margin:0 }}>{getTierName(myEntry.packageTier)}</p>
              </div>
              <span style={{ color:accent, fontWeight:800, fontSize:12 }}>₹{myEarnings.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
      <div style={{ padding:'0 8px 10px' }}>
        <Link href="/partner/leaderboard" style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'9px',
          borderRadius:12, background:`${accent}08`, border:`1px solid ${accent}18`,
          color:accent, fontSize:11, fontWeight:700, textDecoration:'none',
        }}>
          Full Leaderboard <ArrowUpRight style={{ width:12, height:12 }} />
        </Link>
      </div>
    </div>
  )
}

// ─── Plan Section ─────────────────────────────────────────────────────────────
function PlanSection({ currentTier, packageComm }: { currentTier: Tier; packageComm: any[] }) {
  const [selectedId, setSelectedId] = useState<string>(
    packageComm.find((p: any) => p.tier?.toLowerCase() === currentTier)?.packageId || packageComm[0]?.packageId || ''
  )
  const selectedPkg = packageComm.find((p: any) => p.packageId === selectedId) || packageComm[0]
  const tierKey = (selectedPkg?.tier?.toLowerCase() || 'free') as Tier
  const cfg = TIER_CFG[tierKey] || TIER_CFG['free']
  const currentPkgTier = currentTier
  const isUpgrade = (TIER_CFG[tierKey]?.order || 0) > (TIER_CFG[currentPkgTier]?.order || 0)
  const isCurrent = tierKey === currentPkgTier
  const hasHigherPkg = packageComm.some((p: any) => (TIER_CFG[p.tier?.toLowerCase() as Tier]?.order || 0) > (TIER_CFG[currentPkgTier]?.order || 0))

  if (!packageComm.length) return null

  return (
    <div style={{
      background:'rgba(13,13,20,0.95)',
      border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:24, overflow:'hidden',
      backdropFilter:'blur(16px)',
    }}>
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{
          width:38, height:38, borderRadius:12,
          background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 14px rgba(245,158,11,0.2)',
        }}>
          <Crown style={{ width:18, height:18, color:'#f59e0b' }} />
        </div>
        <div>
          <h3 style={{ color:'white', fontWeight:800, fontSize:15, margin:0 }}>Plans & Benefits</h3>
          <p style={{ color:'#4b5563', fontSize:12, margin:0 }}>
            Current: <span style={{ color:TIER_CFG[currentTier]?.color || '#6b7280', fontWeight:700 }}>
              {packageComm.find((p: any) => p.tier?.toLowerCase() === currentTier)?.name || currentTier}
            </span>
          </p>
        </div>
        {hasHigherPkg && (
          <div style={{
            marginLeft:'auto',
            background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)',
            borderRadius:100, padding:'4px 12px',
          }}>
            <span style={{ color:'#fcd34d', fontSize:11, fontWeight:700 }}>✨ Upgrade to Earn More</span>
          </div>
        )}
      </div>

      {/* Package pills — actual names from admin */}
      <div style={{ padding:'16px 20px 0', display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {packageComm.map((pkg: any) => {
          const pkgTier = (pkg.tier?.toLowerCase() || 'free') as Tier
          const pkgCfg = TIER_CFG[pkgTier] || TIER_CFG['free']
          const isActive = pkg.packageId === selectedId
          const isCur = pkgTier === currentPkgTier
          return (
            <button key={pkg.packageId} onClick={() => setSelectedId(pkg.packageId)} style={{
              flexShrink:0, padding:'8px 14px', borderRadius:100, cursor:'pointer',
              border: isActive ? `1.5px solid ${pkgCfg.color}` : '1.5px solid rgba(255,255,255,0.07)',
              background: isActive ? `${pkgCfg.color}18` : 'rgba(255,255,255,0.02)',
              display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
              boxShadow: isActive ? `0 0 20px ${pkgCfg.glow}` : 'none',
            }}>
              <span style={{ color: isActive ? pkgCfg.color : '#4b5563', fontSize:12, fontWeight:700 }}>{pkg.name}</span>
              {isCur && <span style={{ background:pkgCfg.color, color:'white', fontSize:9, fontWeight:800, padding:'1px 6px', borderRadius:100 }}>YOU</span>}
            </button>
          )
        })}
      </div>

      {/* Selected package detail */}
      {selectedPkg && (
        <div style={{ margin:'16px', borderRadius:20, overflow:'hidden', border:`1.5px solid ${cfg.color}28`, boxShadow:`0 6px 40px ${cfg.glow}` }}>
          <div style={{ padding:'20px', background:cfg.bg, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
            <div style={{ position:'absolute', bottom:-35, left:-25, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />
            <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ fontSize:32 }}>{cfg.icon}</div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <h4 style={{ color:'white', fontWeight:900, fontSize:20, margin:0 }}>{selectedPkg.name}</h4>
                  {isCurrent && (
                    <span style={{ background:'rgba(255,255,255,0.22)', color:'white', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:100 }}>
                      ✓ ACTIVE
                    </span>
                  )}
                  {isUpgrade && (
                    <span style={{ background:'rgba(0,0,0,0.3)', color:'#fcd34d', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:100 }}>
                      ↑ UPGRADE
                    </span>
                  )}
                </div>
                <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13, margin:0 }}>{cfg.tagline}</p>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:1, margin:0 }}>One-time</p>
                <p style={{ color:'white', fontWeight:900, fontSize:24, margin:0 }}>₹{(selectedPkg.price || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          <div style={{ background:'rgba(10,10,18,0.95)', padding:'18px 20px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'L1 Partnership earning', value: selectedPkg.l1Earn, color:'#a78bfa', bg:'rgba(139,92,246,0.1)' },
                { label:'L2 Partnership earning', value: selectedPkg.l2Earn, color:'#67e8f9', bg:'rgba(6,182,212,0.1)' },
                { label:'L3 Partnership earning', value: selectedPkg.l3Earn, color:'#fcd34d', bg:'rgba(245,158,11,0.1)' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:12, background:row.bg, border:`1px solid ${row.color}20` }}>
                  <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600 }}>{row.label}</span>
                  <span style={{ color:row.color, fontWeight:800, fontSize:14 }}>{row.value > 0 ? `₹${row.value.toLocaleString()}` : '—'}</span>
                </div>
              ))}
            </div>

            {isUpgrade && (
              <Link href="/student/upgrade" style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                marginTop:16, padding:'14px', borderRadius:14,
                background:cfg.bg, color:'white', fontWeight:800, fontSize:14,
                textDecoration:'none', boxShadow:`0 6px 24px ${cfg.glow}`,
              }}>
                <Sparkles style={{ width:16, height:16 }} />
                Upgrade — ₹{(selectedPkg.price || 0).toLocaleString('en-IN')}
                <ArrowRight style={{ width:15, height:15 }} />
              </Link>
            )}
            {isCurrent && (
              <div style={{ marginTop:14, padding:'12px', borderRadius:12, background:`${cfg.color}08`, border:`1px solid ${cfg.color}22`, textAlign:'center' }}>
                <span style={{ color:cfg.color, fontSize:13, fontWeight:700 }}>✓ This is your active plan</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, color, bg }: {
  href: string; icon: any; label: string; color: string; bg: string
}) {
  return (
    <Link href={href} style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      padding:'18px 8px', borderRadius:20,
      background:bg, border:`1px solid ${color}18`,
      textDecoration:'none', transition:'all 0.2s',
    }}>
      <div style={{
        width:46, height:46, borderRadius:14,
        background:`${color}18`, border:`1px solid ${color}28`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 4px 14px ${color}20`,
      }}>
        <Icon style={{ width:22, height:22, color }} />
      </div>
      <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:600, textAlign:'center', lineHeight:1.4, whiteSpace:'pre-line' }}>{label}</span>
    </Link>
  )
}

// ─── Date Filter Bar ──────────────────────────────────────────────────────────
type FilterPeriod = 'today' | '7' | '30' | 'custom'

function DashDateFilter({ period, setPeriod, from, setFrom, to, setTo }: {
  period: FilterPeriod; setPeriod: (p: FilterPeriod) => void
  from: string; setFrom: (v: string) => void
  to: string; setTo: (v: string) => void
}) {
  const OPTS: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7', label: '7 Days' },
    { key: '30', label: '30 Days' },
    { key: 'custom', label: 'Custom' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {OPTS.map(o => (
          <button key={o.key} onClick={() => setPeriod(o.key)} style={{
            padding:'7px 14px', borderRadius:100, fontSize:12, fontWeight:700, cursor:'pointer',
            border: period === o.key ? '1.5px solid #7c3aed' : '1.5px solid rgba(255,255,255,0.08)',
            background: period === o.key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
            color: period === o.key ? '#a78bfa' : '#4b5563',
            transition:'all 0.2s',
          }}>
            {o.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
            color:'white', fontSize:12, borderRadius:10, padding:'6px 10px', flex:1, minWidth:120,
          }} />
          <span style={{ color:'#374151', fontSize:12 }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
            color:'white', fontSize:12, borderRadius:10, padding:'6px 10px', flex:1, minWidth:120,
          }} />
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function PartnerDashboard() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [period, setPeriod] = useState<FilterPeriod>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const dashParams = period === 'custom'
    ? (from && to ? { period, from, to } : { period: '30' })
    : { period }

  const { data, isLoading } = useQuery({
    queryKey: ['partner-dashboard', period, from, to],
    queryFn: () => partnerAPI.dashboard(dashParams).then(r => r.data),
    staleTime: 0,
  })
  const { data: tipsData }  = useQuery({ queryKey:['my-tips'],  queryFn:() => managerAPI.myTips().then(r => r.data),  staleTime:0 })
  const { data: goalsData } = useQuery({ queryKey:['my-goals'], queryFn:() => managerAPI.myGoals().then(r => r.data), staleTime:0 })
  const { data: lb24Data }  = useQuery({ queryKey:['lb-24h'],   queryFn:() => partnerAPI.leaderboard('24h').then(r => r.data),  staleTime:5*60*1000 })
  const { data: lbAllData } = useQuery({ queryKey:['lb-all'],   queryFn:() => partnerAPI.leaderboard('all').then(r => r.data),  staleTime:10*60*1000 })
  const { data: pkgs } = useQuery({ queryKey:['packages'], queryFn:() => packageAPI.getAll().then(r => r.data.packages), staleTime:10*60*1000 })

  const myTips: any[]  = tipsData?.tips  || []
  const myGoals: any[] = goalsData?.goals || []
  const myManager = data?.manager || myTips[0]?.manager || myGoals[0]?.manager || null

  const stats = data?.stats
  const trend: any[] = data?.trend || []
  const topReferrals: any[] = data?.topReferrals || []
  const rank = data?.stats?.rank
  const sponsor = data?.sponsor
  const locked = data?.locked
  const packageComm: any[] = data?.packageCommissions || []

  const tier = (user?.packageTier || 'free') as Tier
  const tierCfg = TIER_CFG[tier]
  const tierNameMap: Record<string, string> = {}
  packageComm.forEach((p: any) => { if (p.tier) tierNameMap[p.tier.toLowerCase()] = p.name })
  const getTierName = (t?: string) => t ? (tierNameMap[t.toLowerCase()] || t) : '—'
  const l1 = stats?.l1Count || 0
  const l2 = stats?.l2Count || 0
  const l3 = stats?.l3Count || 0

  const copyCode = () => {
    navigator.clipboard.writeText(user?.affiliateCode || '')
    setCopied('code')
    toast.success('Code copied!')
    setTimeout(() => setCopied(null), 2000)
  }
  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink || `${process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'}?ref=${user?.affiliateCode}`)
    setCopied('link')
    toast.success('Link copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:96 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
      <Skeleton h={240} radius={28} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} h={110} radius={20} />)}
      </div>
      <Skeleton h={200} radius={22} />
      <Skeleton h={160} radius={22} />
      <Skeleton h={300} radius={24} />
    </div>
  )

  // ── Locked state ────────────────────────────────────────────────────────────
  if (locked) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'65vh', textAlign:'center', padding:'0 24px', paddingBottom:96 }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-10px)}}`}</style>
      <div style={{
        width:96, height:96, borderRadius:28,
        background:'rgba(139,92,246,0.1)',
        border:'1.5px solid rgba(139,92,246,0.3)',
        boxShadow:'0 0 60px rgba(139,92,246,0.2)',
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:28,
        animation:'float 3s ease-in-out infinite',
      }}>
        <Lock style={{ width:44, height:44, color:'#8b5cf6' }} />
      </div>
      <h2 style={{ color:'white', fontSize:28, fontWeight:900, marginBottom:10 }}>Partner Panel Locked</h2>
      <p style={{ color:'#4b5563', maxWidth:340, marginBottom:36, lineHeight:1.8, fontSize:14 }}>
        Purchase a package to unlock the Partner Panel and start earning commissions through referrals.
      </p>
      <Link href="/student/upgrade" style={{
        display:'inline-flex', alignItems:'center', gap:10, padding:'16px 36px',
        borderRadius:18, background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
        color:'white', fontWeight:800, fontSize:15, textDecoration:'none',
        boxShadow:'0 10px 40px rgba(124,58,237,0.5)',
      }}>
        <Sparkles style={{ width:18, height:18 }} />
        View Packages
        <ArrowRight style={{ width:16, height:16 }} />
      </Link>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-6px)}}
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.08)}66%{transform:translate(-20px,15px) scale(0.95)}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-25px,20px) scale(1.05)}66%{transform:translate(20px,-15px) scale(0.97)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .dash-section{animation:slideUp 0.4s ease both}
      `}</style>
      <div style={{ display:'flex', flexDirection:'column', gap:20, paddingBottom:96 }}>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="dash-section" style={{
          position:'relative', overflow:'hidden', borderRadius:28,
          padding:'28px 20px 22px',
          background:`linear-gradient(135deg, #0d0a1e 0%, #130d28 40%, #0a0d1e 100%)`,
          border:`1px solid ${tierCfg.color}30`,
          boxShadow:`0 16px 64px ${tierCfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}>
          {/* Animated gradient blobs */}
          <div style={{
            position:'absolute', top:-80, right:-80, width:320, height:320,
            borderRadius:'50%',
            background:`radial-gradient(circle, ${tierCfg.color}30 0%, transparent 70%)`,
            animation:'blob1 8s ease-in-out infinite', pointerEvents:'none',
          }} />
          <div style={{
            position:'absolute', bottom:-100, left:-60, width:280, height:280,
            borderRadius:'50%',
            background:'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)',
            animation:'blob2 10s ease-in-out infinite', pointerEvents:'none',
          }} />
          <div style={{
            position:'absolute', top:'30%', right:'20%', width:120, height:120,
            borderRadius:'50%',
            background:'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
            animation:'blob1 6s ease-in-out infinite 2s', pointerEvents:'none',
          }} />
          {/* Subtle grid overlay */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
            backgroundSize:'40px 40px',
            pointerEvents:'none',
          }} />

          {/* Top row */}
          <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            {/* Avatar + name */}
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" style={{
                    width:68, height:68, borderRadius:'50%', objectFit:'cover',
                    border:`3px solid ${tierCfg.color}70`,
                    boxShadow:`0 0 24px ${tierCfg.glow}`,
                  }} />
                ) : (
                  <div style={{
                    width:68, height:68, borderRadius:'50%',
                    background:`linear-gradient(135deg, ${tierCfg.color}50, ${tierCfg.color}20)`,
                    border:`3px solid ${tierCfg.color}60`,
                    boxShadow:`0 0 24px ${tierCfg.glow}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:28, fontWeight:900, color:'white',
                  }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{
                  position:'absolute', bottom:2, right:2, width:18, height:18,
                  borderRadius:'50%', background:'#22c55e',
                  border:'2.5px solid #0d0a1e',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:8, color:'white', fontWeight:700,
                }}>✓</div>
              </div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, margin:0, marginBottom:3 }}>Welcome back 👋</p>
                <h1 style={{ color:'white', fontSize:22, fontWeight:900, lineHeight:1.1, margin:0, marginBottom:10 }}>{user?.name}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <span style={{
                    background:`${tierCfg.color}25`, backdropFilter:'blur(8px)',
                    color:tierCfg.color, fontSize:11, fontWeight:800,
                    padding:'4px 12px', borderRadius:100,
                    border:`1px solid ${tierCfg.color}40`,
                    boxShadow:`0 0 12px ${tierCfg.glow}`,
                  }}>
                    {tierCfg.icon} {packageComm.find((p: any) => p.tier?.toLowerCase() === tier)?.name || tierCfg.label} Partner
                  </span>
                  {rank && (
                    <span style={{
                      background:'rgba(245,158,11,0.15)', color:'#fcd34d',
                      fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:100,
                      border:'1px solid rgba(245,158,11,0.3)',
                    }}>
                      🏆 #{rank} Rank
                    </span>
                  )}
                  {user?.kyc?.status === 'verified' && (
                    <span style={{
                      background:'rgba(34,197,94,0.15)', color:'#86efac',
                      fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100,
                      border:'1px solid rgba(34,197,94,0.25)',
                    }}>
                      <BadgeCheck style={{ width:11, height:11, display:'inline', marginRight:3 }} />KYC ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Partner code box */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{
                background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)',
                borderRadius:16, padding:'12px 16px',
                border:`1px solid ${tierCfg.color}30`,
                boxShadow:`0 4px 20px rgba(0,0,0,0.3)`,
              }}>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:1.8, marginBottom:5, margin:0 }}>Partner Code</p>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5 }}>
                  <span style={{ color:'white', fontWeight:900, fontSize:22, letterSpacing:5, fontFamily:'monospace' }}>{user?.affiliateCode}</span>
                  <button onClick={copyCode} style={{
                    color: copied === 'code' ? '#86efac' : 'rgba(255,255,255,0.5)',
                    padding:'5px 7px', borderRadius:9,
                    border:`1px solid ${copied === 'code' ? 'rgba(134,239,172,0.4)' : 'rgba(255,255,255,0.15)'}`,
                    background: copied === 'code' ? 'rgba(134,239,172,0.1)' : 'rgba(255,255,255,0.06)',
                    cursor:'pointer', transition:'all 0.2s',
                  }}>
                    {copied === 'code' ? <CheckCircle2 style={{ width:14, height:14 }} /> : <Copy style={{ width:14, height:14 }} />}
                  </button>
                </div>
              </div>
              <button onClick={copyLink} style={{
                display:'flex', alignItems:'center', gap:7,
                background: copied === 'link' ? 'rgba(134,239,172,0.12)' : 'rgba(255,255,255,0.08)',
                borderRadius:12, padding:'9px 14px',
                border: copied === 'link' ? '1px solid rgba(134,239,172,0.3)' : '1px solid rgba(255,255,255,0.18)',
                color: copied === 'link' ? '#86efac' : 'white',
                fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s',
                justifyContent:'center', backdropFilter:'blur(8px)',
              }}>
                <Link2 style={{ width:13, height:13 }} />
                {copied === 'link' ? '✓ Link Copied!' : 'Copy Referral Link'}
              </button>
            </div>
          </div>

          {/* Hero stats strip */}
          <div style={{
            position:'relative', display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
            gap:10, marginTop:22,
          }}>
            {[
              { label:'Total Earned', value:`₹${((stats?.totalEarnings || 0) + (stats?.industrialEarning || 0)).toLocaleString()}`, icon:'💰' },
              { label:'This Month',   value:`₹${(stats?.monthEarnings || stats?.monthly || 0).toLocaleString()}`, icon:'📅' },
              { label:'Wallet',       value:`₹${(user?.wallet || 0).toLocaleString()}`, icon:'👛' },
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(0,0,0,0.45)', backdropFilter:'blur(12px)',
                borderRadius:16, padding:'13px 10px',
                border:'1px solid rgba(255,255,255,0.1)',
                textAlign:'center',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:5, margin:0 }}>{s.icon} {s.label}</p>
                <p style={{ color:'white', fontWeight:900, fontSize:16, margin:0, marginTop:5 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ INDUSTRIAL EARNING BADGE ══════════════════════════════════════ */}
        {stats?.isIndustrialPartner && (stats?.industrialEarning || 0) > 0 && (
          <div className="dash-section" style={{
            position:'relative', overflow:'hidden', borderRadius:20,
            padding:'18px 20px',
            background:'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(139,92,246,0.1) 100%)',
            border:'1px solid rgba(245,158,11,0.4)',
            boxShadow:'0 0 40px rgba(245,158,11,0.12)',
          }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />

            <div style={{ position:'relative' }}>
              {/* Badge label */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                <span style={{
                  background:'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(139,92,246,0.25))',
                  color:'#fbbf24', fontSize:10, fontWeight:900, padding:'4px 12px',
                  borderRadius:100, border:'1px solid rgba(245,158,11,0.45)',
                  textTransform:'uppercase', letterSpacing:1.2,
                }}>🏭 Industrial + TruLearnix Earning</span>
                {stats?.industrialEarningSource && (
                  <span style={{ color:'rgba(251,191,36,0.55)', fontSize:10, fontWeight:600 }}>
                    via {stats.industrialEarningSource}
                  </span>
                )}
              </div>

              {/* Combined total */}
              <p style={{ color:'white', fontWeight:900, fontSize:28, margin:0, lineHeight:1 }}>
                ₹{((stats.industrialEarning || 0) + (stats.totalEarnings || 0)).toLocaleString()}
              </p>
              <p style={{ color:'rgba(251,191,36,0.55)', fontSize:11, margin:0, marginTop:5 }}>
                Lifetime Partner Earning · grows as you earn on TruLearnix
              </p>

              {/* Breakdown row */}
              <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
                <div style={{ background:'rgba(245,158,11,0.1)', borderRadius:10, padding:'8px 14px', border:'1px solid rgba(245,158,11,0.2)' }}>
                  <p style={{ color:'rgba(251,191,36,0.55)', fontSize:9, textTransform:'uppercase', letterSpacing:1, margin:0 }}>Industrial</p>
                  <p style={{ color:'#fbbf24', fontWeight:900, fontSize:15, margin:0, marginTop:2 }}>₹{(stats.industrialEarning || 0).toLocaleString()}</p>
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:9, margin:0 }}>prev. platform</p>
                </div>
                <div style={{ background:'rgba(139,92,246,0.1)', borderRadius:10, padding:'8px 14px', border:'1px solid rgba(139,92,246,0.2)' }}>
                  <p style={{ color:'rgba(167,139,250,0.7)', fontSize:9, textTransform:'uppercase', letterSpacing:1, margin:0 }}>TruLearnix</p>
                  <p style={{ color:'#a78bfa', fontWeight:900, fontSize:15, margin:0, marginTop:2 }}>₹{(stats.totalEarnings || 0).toLocaleString()}</p>
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:9, margin:0 }}>Partnership earnings</p>
                </div>
                <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:10, padding:'8px 14px', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:9, textTransform:'uppercase', letterSpacing:1, margin:0 }}>Wallet</p>
                  <p style={{ color:'white', fontWeight:900, fontSize:15, margin:0, marginTop:2 }}>₹{(user?.wallet || 0).toLocaleString()}</p>
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:9, margin:0 }}>withdrawable</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ DATE FILTER ═══════════════════════════════════════════════════ */}
        <div className="dash-section" style={{
          background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(139,92,246,0.15)', borderRadius:20, padding:'16px 20px',
        }}>
          <p style={{ color:'#4b5563', fontSize:10, textTransform:'uppercase', letterSpacing:1, marginBottom:12, margin:0 }}>Filter Period</p>
          <div style={{ marginTop:12 }}>
            <DashDateFilter period={period} setPeriod={setPeriod} from={from} setFrom={setFrom} to={to} setTo={setTo} />
          </div>
          {stats?.periodEarnings !== null && stats?.periodEarnings !== undefined && (
            <div style={{
              marginTop:14, padding:'12px 16px', borderRadius:14,
              background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <p style={{ color:'#4b5563', fontSize:10, textTransform:'uppercase', letterSpacing:0.8, margin:0 }}>Earnings in period</p>
                <p style={{ color:'#a78bfa', fontWeight:900, fontSize:22, margin:0, marginTop:4 }}>₹{(stats.periodEarnings || 0).toLocaleString()}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ color:'#4b5563', fontSize:10, margin:0 }}>Partnership earnings</p>
                <p style={{ color:'white', fontWeight:800, fontSize:18, margin:0, marginTop:4 }}>{stats.periodCount || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* ══ QUICK STATS 2x2 ═══════════════════════════════════════════════ */}
        <div className="dash-section" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          <GlassStatCard
            label="Total Earned" value={`₹${((stats?.totalEarnings || 0) + (stats?.industrialEarning || 0)).toLocaleString()}`}
            icon={Coins} color="#8b5cf6" glow="rgba(139,92,246,0.2)"
            sub={`${stats?.totalCommissions || 0} transactions`} trend="up"
          />
          <GlassStatCard
            label="Pending Payout" value={`₹${(stats?.pendingCommissions || 0).toLocaleString()}`}
            icon={CircleDollarSign} color="#06b6d4" glow="rgba(6,182,212,0.2)"
            sub="Awaiting release"
          />
          <GlassStatCard
            label="Team Size" value={(l1 + l2 + l3).toLocaleString()}
            icon={Users} color="#10b981" glow="rgba(16,185,129,0.2)"
            sub={`L1:${l1}  L2:${l2}  L3:${l3}`}
          />
          <GlassStatCard
            label="This Week" value={`₹${(stats?.weekly || 0).toLocaleString()}`}
            icon={TrendingUp} color="#f59e0b" glow="rgba(245,158,11,0.2)"
            sub={`Withdrawn: ₹${(stats?.totalWithdrawn || 0).toLocaleString()}`} trend="up"
          />
        </div>

        {/* ══ EARNINGS TREND ════════════════════════════════════════════════ */}
        <div className="dash-section" style={{
          background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(139,92,246,0.15)', borderRadius:24, padding:'22px',
          boxShadow:'0 4px 32px rgba(139,92,246,0.08)',
        }}>
          <SectionHeader
            icon={BarChart2} color="#8b5cf6"
            title="Earnings Trend" sub="Last 6 months performance"
            href="/partner/earnings" linkLabel="Full Report"
          />
          <EarningsChart trend={trend} />
          {trend.length > 0 && (
            <div style={{
              marginTop:16, padding:'12px 16px', borderRadius:14,
              background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.12)',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8,
            }}>
              {[
                { label:'Total (6m)', value:`₹${trend.slice(-6).reduce((s:number,t:any) => s + (t.earnings||t.total||0), 0).toLocaleString()}` },
                { label:'Avg/Month', value:`₹${Math.round(trend.slice(-6).reduce((s:number,t:any) => s + (t.earnings||t.total||0), 0) / Math.max(trend.slice(-6).length, 1)).toLocaleString()}` },
                { label:'Best Month', value:`₹${Math.max(...trend.slice(-6).map((t:any) => t.earnings||t.total||0), 0).toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <p style={{ color:'#4b5563', fontSize:10, textTransform:'uppercase', letterSpacing:0.8, margin:0 }}>{label}</p>
                  <p style={{ color:'#a78bfa', fontWeight:800, fontSize:14, margin:0, marginTop:2 }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ NETWORK OVERVIEW ══════════════════════════════════════════════ */}
        <div className="dash-section" style={{
          background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(6,182,212,0.15)', borderRadius:24, padding:'22px',
          boxShadow:'0 4px 32px rgba(6,182,212,0.06)',
        }}>
          <SectionHeader
            icon={GitBranch} color="#06b6d4"
            title="Network Overview" sub="Your referral tree structure"
            href="/partner/m-type" linkLabel="View Tree"
          />
          <NetworkRings l1={l1} l2={l2} l3={l3} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:18 }}>
            {[
              { v:l1 + l2 + l3, label:'Total Team', color:'#8b5cf6' },
              { v: rank ? `#${rank}` : '—', label:'Your Rank', color:'#f59e0b' },
              { v:`₹${((stats?.totalEarnings || 0) + (stats?.industrialEarning || 0)).toLocaleString()}`, label:'Total Earned', color:'#10b981' },
            ].map(({ v, label, color }) => (
              <div key={label} style={{
                textAlign:'center', padding:'12px 6px', borderRadius:14,
                background:'rgba(255,255,255,0.02)',
                border:`1px solid ${color}15`,
              }}>
                <p style={{ color, fontWeight:900, fontSize:16, margin:0 }}>{v}</p>
                <p style={{ color:'#374151', fontSize:10, marginTop:4, margin:0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ LEADERBOARD ═══════════════════════════════════════════════════ */}
        <div className="dash-section">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:11,
                background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Trophy style={{ width:17, height:17, color:'#f59e0b' }} />
              </div>
              <div>
                <h3 style={{ color:'white', fontWeight:800, fontSize:14, margin:0 }}>Leaderboard</h3>
                <p style={{ color:'#4b5563', fontSize:11, margin:0 }}>Compete with top partners</p>
              </div>
            </div>
            <Link href="/partner/leaderboard" style={{
              color:'#f59e0b', fontSize:11, fontWeight:700, textDecoration:'none',
              display:'flex', alignItems:'center', gap:5,
              background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)',
              padding:'6px 12px', borderRadius:100,
            }}>
              Full View <ArrowUpRight style={{ width:11, height:11 }} />
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <LeaderboardMini
              title="Today" icon="⚡" accent="#f59e0b"
              resetLabel="Resets at midnight"
              data={lb24Data?.leaderboard || []}
              myRank={lb24Data?.myRank || 0}
              myEarnings={lb24Data?.myPeriodEarnings || 0}
              userId={(user as any)?._id || user?.id}
              tierNameMap={tierNameMap}
            />
            <LeaderboardMini
              title="All Time" icon="👑" accent="#8b5cf6"
              data={lbAllData?.leaderboard || []}
              myRank={lbAllData?.myRank || 0}
              myEarnings={lbAllData?.myPeriodEarnings || 0}
              userId={(user as any)?._id || user?.id}
              tierNameMap={tierNameMap}
            />
          </div>
        </div>

        {/* ══ COMMISSION TABLE ══════════════════════════════════════════════ */}
        {packageComm.length > 0 && (
          <div className="dash-section" style={{
            background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(245,158,11,0.12)', borderRadius:24, padding:'22px',
            boxShadow:'0 4px 32px rgba(245,158,11,0.05)',
          }}>
            <SectionHeader
              icon={Zap} color="#f59e0b"
              title="Partnership earning Rates" sub="Your earnings per referral sale"
            />
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:340 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', color:'#4b5563', fontSize:10, fontWeight:700, paddingBottom:12, paddingRight:12, textTransform:'uppercase', letterSpacing:0.8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Package</th>
                    <th style={{ textAlign:'right', paddingBottom:12, paddingRight:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ background:'rgba(139,92,246,0.15)', color:'#a78bfa', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8 }}>L1</span>
                    </th>
                    <th style={{ textAlign:'right', paddingBottom:12, paddingRight:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ background:'rgba(6,182,212,0.15)', color:'#67e8f9', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8 }}>L2</span>
                    </th>
                    <th style={{ textAlign:'right', paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ background:'rgba(245,158,11,0.15)', color:'#fcd34d', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:8 }}>L3</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packageComm.map((pkg: any) => (
                    <tr key={pkg.packageId} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding:'12px 12px 12px 0' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:10, height:10, borderRadius:'50%',
                            background: TIER_CFG[(pkg.tier?.toLowerCase()) as Tier]?.color || '#4b5563',
                            boxShadow:`0 0 8px ${TIER_CFG[(pkg.tier?.toLowerCase()) as Tier]?.glow || 'transparent'}`,
                            flexShrink:0,
                          }} />
                          <div>
                            <p style={{ color:'rgba(255,255,255,0.85)', fontWeight:600, fontSize:13, margin:0 }}>{pkg.name}</p>
                            <p style={{ color:'#374151', fontSize:11, margin:0 }}>₹{(pkg.price || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', paddingRight:12 }}>
                        <span style={{ color:'#c4b5fd', fontWeight:700, fontSize:12, background:'rgba(139,92,246,0.1)', padding:'4px 9px', borderRadius:9, display:'inline-block' }}>
                          {pkg.l1Earn > 0 ? `₹${pkg.l1Earn.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', paddingRight:12 }}>
                        <span style={{ color:'#67e8f9', fontWeight:700, fontSize:12, background:'rgba(6,182,212,0.1)', padding:'4px 9px', borderRadius:9, display:'inline-block' }}>
                          {pkg.l2Earn > 0 ? `₹${pkg.l2Earn.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <span style={{ color:'#fcd34d', fontWeight:700, fontSize:12, background:'rgba(245,158,11,0.1)', padding:'4px 9px', borderRadius:9, display:'inline-block' }}>
                          {pkg.l3Earn > 0 ? `₹${pkg.l3Earn.toLocaleString()}` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ PLAN UPGRADE SECTION ══════════════════════════════════════════ */}
        <div className="dash-section">
          <PlanSection currentTier={tier} packageComm={packageComm} />
        </div>

        {/* ══ QUICK ACTIONS ═════════════════════════════════════════════════ */}
        <div className="dash-section" style={{
          background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(249,115,22,0.12)', borderRadius:24, padding:'22px',
        }}>
          <SectionHeader icon={Flame} color="#f97316" title="Quick Actions" sub="Navigate to key features" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <QuickAction href="/partner/link-generator" icon={Link2}       label={'Partner\nLink'}   color="#8b5cf6" bg="rgba(139,92,246,0.06)" />
            <QuickAction href="/partner/kyc"            icon={ShieldCheck} label={`KYC\n${user?.kyc?.status === 'verified' ? '✓ Done' : 'Pending'}`} color="#f59e0b" bg="rgba(245,158,11,0.06)" />
            <QuickAction href="/partner/crm"            icon={Users}       label={'My\nLeads'}         color="#3b82f6" bg="rgba(59,130,246,0.06)" />
            <QuickAction href="/partner/m-type"         icon={Network}     label={'Network\nTree'}     color="#06b6d4" bg="rgba(6,182,212,0.06)" />
            <QuickAction href="/partner/achievements"   icon={Award}       label={'Achieve-\nments'}   color="#ec4899" bg="rgba(236,72,153,0.06)" />
            <QuickAction href="/partner/qualification"  icon={Trophy}      label={'Qualifi-\ncation'}  color="#10b981" bg="rgba(16,185,129,0.06)" />
          </div>
        </div>

        {/* ══ RECENT ACTIVITY / TOP REFERRALS ══════════════════════════════ */}
        {topReferrals.length > 0 && (
          <div className="dash-section" style={{
            background:'rgba(13,13,20,0.95)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,0.06)', borderRadius:24, padding:'22px',
          }}>
            <SectionHeader
              icon={Star} color="#f59e0b"
              title="Recent Activity" sub="Latest Partnership earnings & referrals"
              href="/partner/referrals" linkLabel="See All"
            />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {topReferrals.slice(0, 5).map((r: any, i: number) => {
                const GRAD_PAIRS = [
                  ['#7c3aed','#4f46e5'], ['#0891b2','#0e7490'], ['#059669','#047857'],
                  ['#d97706','#b45309'], ['#e11d48','#be185d'],
                ]
                const [g1, g2] = GRAD_PAIRS[i % 5]
                return (
                  <div key={r._id} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', borderRadius:16,
                    background:'rgba(255,255,255,0.02)',
                    border:'1px solid rgba(255,255,255,0.05)',
                    transition:'all 0.2s',
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:12, flexShrink:0,
                      background:`linear-gradient(135deg, ${g1}, ${g2})`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize: i < 3 ? 18 : 14, fontWeight:800,
                      boxShadow:`0 4px 12px ${g1}40`,
                    }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : r.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:'rgba(255,255,255,0.9)', fontSize:13, fontWeight:600, margin:0 }} className="truncate">{r.name}</p>
                      <p style={{ color:'#4b5563', fontSize:11, margin:0 }}>{getTierName(r.packageTier)}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ color:'#4ade80', fontSize:14, fontWeight:900, margin:0 }}>+₹{(r.contribution || 0).toLocaleString()}</p>
                      <p style={{ color:'#374151', fontSize:10, margin:0 }}>Partnership earning</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ MANAGER CARD ══════════════════════════════════════════════════ */}
        {myManager && (
          <div className="dash-section" style={{
            background:'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(13,148,136,0.04))',
            border:'1px solid rgba(16,185,129,0.2)', borderRadius:24, padding:'22px',
            backdropFilter:'blur(12px)',
          }}>
            <p style={{ color:'#374151', fontSize:11, textTransform:'uppercase', letterSpacing:1.5, marginBottom:16, margin:0 }}>Your Manager</p>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, marginTop:16 }}>
              <div style={{
                width:54, height:54, borderRadius:16, flexShrink:0,
                background:'rgba(16,185,129,0.18)', border:'1.5px solid rgba(16,185,129,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#34d399', fontSize:24, fontWeight:900,
                boxShadow:'0 0 20px rgba(16,185,129,0.15)',
              }}>
                {myManager.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:'white', fontWeight:700, fontSize:15, margin:0 }}>{myManager.name}</p>
                <p style={{ color:'#6b7280', fontSize:12, margin:0 }}>{myManager.email || myManager.phone}</p>
              </div>
              <div style={{
                width:40, height:40, borderRadius:12,
                background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <UserCog style={{ width:18, height:18, color:'#34d399' }} />
              </div>
            </div>

            {myTips.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: myGoals.filter((g: any) => g.status === 'active').length > 0 ? 16 : 0 }}>
                <p style={{ fontSize:11, color:'#4b5563', fontWeight:600, display:'flex', alignItems:'center', gap:6, marginBottom:6, margin:0 }}>
                  <MessageSquare style={{ width:13, height:13 }} /> Latest Tips
                </p>
                {myTips.slice(0, 2).map((tip: any) => (
                  <div key={tip._id} style={{
                    background:'rgba(0,0,0,0.35)', borderRadius:14, padding:'12px 14px',
                    display:'flex', gap:10, alignItems:'flex-start',
                    border:'1px solid rgba(16,185,129,0.08)',
                  }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>
                      {tip.category === 'motivation' ? '🔥' : tip.category === 'warning' ? '⚠️' : tip.category === 'feedback' ? '💬' : tip.category === 'update' ? '📢' : '💡'}
                    </span>
                    <p style={{ color:'#d1d5db', fontSize:13, flex:1, lineHeight:1.7, margin:0 }}>{tip.message}</p>
                  </div>
                ))}
              </div>
            )}

            {myGoals.filter((g: any) => g.status === 'active').length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontSize:11, color:'#4b5563', fontWeight:600, display:'flex', alignItems:'center', gap:6, marginBottom:6, margin:0, marginTop: myTips.length > 0 ? 0 : 0 }}>
                  <Target style={{ width:13, height:13 }} /> Active Goals
                </p>
                {myGoals.filter((g: any) => g.status === 'active').slice(0, 2).map((goal: any) => {
                  const pct = Math.min(100, Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100))
                  return (
                    <div key={goal._id} style={{
                      background:'rgba(0,0,0,0.35)', borderRadius:14, padding:'14px',
                      border:'1px solid rgba(16,185,129,0.08)',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                        <p style={{ color:'white', fontSize:13, fontWeight:600, margin:0 }}>{goal.title}</p>
                        <span style={{
                          color:'#34d399', fontSize:12, fontWeight:800,
                          background:'rgba(52,211,153,0.12)', padding:'2px 8px', borderRadius:100,
                        }}>{pct}%</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                        <div style={{
                          height:6, borderRadius:3,
                          background:'linear-gradient(90deg,#10b981,#06b6d4)',
                          width:`${pct}%`, transition:'width 1s ease',
                          boxShadow:'0 0 8px rgba(16,185,129,0.5)',
                        }} />
                      </div>
                      <p style={{ color:'#4b5563', fontSize:11, marginTop:7, margin:0 }}>
                        {goal.currentValue || 0} / {goal.targetValue} {goal.unit}{goal.reward ? ` · 🎁 ${goal.reward}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ SPONSOR CARD ══════════════════════════════════════════════════ */}
        {sponsor && (
          <div className="dash-section" style={{
            background:'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(79,70,229,0.04))',
            border:'1px solid rgba(139,92,246,0.2)', borderRadius:24, padding:'22px',
            backdropFilter:'blur(12px)',
          }}>
            <p style={{ color:'#374151', fontSize:11, textTransform:'uppercase', letterSpacing:1.5, marginBottom:16, margin:0 }}>Your Sponsor</p>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:16 }}>
              <div style={{
                width:54, height:54, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:900, fontSize:24,
                boxShadow:'0 0 20px rgba(124,58,237,0.3)',
              }}>
                {sponsor.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ color:'white', fontWeight:700, fontSize:15, margin:0 }}>{sponsor.name}</p>
                <p style={{ color:'#6b7280', fontSize:12, margin:0 }}>
                  {sponsor.phone}
                  {sponsor.packageTier && <> · <span style={{ color:'#a78bfa' }}>{getTierName(sponsor.packageTier)}</span></>}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
