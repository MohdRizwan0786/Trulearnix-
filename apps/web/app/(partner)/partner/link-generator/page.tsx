'use client'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useState } from 'react'
import {
  Copy, Check, Share2, ExternalLink, ShoppingBag, BookOpen,
  Video, Calendar, Sparkles, Gift, PlayCircle, Link2, Tag,
  Zap, Home, Users, Globe,
  ArrowRight, Flame, Crown, Shield, Rocket, TrendingUp, ChevronDown
} from 'lucide-react'

function CopyBtn({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  if (size === 'md') {
    return (
      <button onClick={handleCopy}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-500 text-white scale-95' : 'bg-white/15 hover:bg-white/25 text-white'}`}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
    )
  }
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/8 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10'}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function WaShareBtn({ msg }: { msg: string }) {
  const link = `https://wa.me/?text=${encodeURIComponent(msg)}`
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 transition-all flex-shrink-0">
      <Share2 className="w-3.5 h-3.5" /> WhatsApp
    </a>
  )
}

function LinkRow({ label, url, waMsg, accent = 'violet' }: { label: string; url: string; waMsg: string; accent?: string }) {
  const [copied, setCopied] = useState(false)
  const accentMap: Record<string, string> = {
    violet: 'border-violet-500/20 bg-violet-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    rose: 'border-rose-500/20 bg-rose-500/5',
    cyan: 'border-cyan-500/20 bg-cyan-500/5',
  }
  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${accentMap[accent] || accentMap.violet}`}>
      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 border border-white/5">
        <Link2 className="w-3 h-3 text-gray-600 flex-shrink-0" />
        <span className="flex-1 text-[11px] text-gray-300 font-mono break-all leading-relaxed line-clamp-2">{url}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyBtn text={url} />
        <WaShareBtn msg={waMsg} />
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/8 transition-all">
          <ExternalLink className="w-3.5 h-3.5" /> Preview
        </a>
      </div>
    </div>
  )
}

const TIER_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType; glow: string }> = {
  starter: { label: 'Starter', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', icon: Zap, glow: 'shadow-sky-500/10' },
  pro:     { label: 'Pro',     color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: Rocket, glow: 'shadow-violet-500/10' },
  elite:   { label: 'Elite',   color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Crown, glow: 'shadow-amber-500/10' },
  supreme: { label: 'Supreme', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: Shield, glow: 'shadow-rose-500/10' },
}

const GENERAL_LINKS = [
  { key: 'home', label: 'Homepage', icon: Home, accent: 'bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-violet-500/25', iconColor: 'text-violet-400', desc: 'Landing page with ref code' },
  { key: 'courses', label: 'All Courses', icon: BookOpen, accent: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/25', iconColor: 'text-blue-400', desc: 'Browse all courses' },
  { key: 'packages', label: 'Packages', icon: ShoppingBag, accent: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/25', iconColor: 'text-emerald-400', desc: 'All partner packages' },
  { key: 'register', label: 'Register Link', icon: Users, accent: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/25', iconColor: 'text-amber-400', desc: 'Sign up with your ref' },
]

export default function LinkGeneratorPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['partner-link'],
    queryFn: () => partnerAPI.link().then(r => r.data)
  })

  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [activeSection, setActiveSection] = useState<'packages' | 'courses' | 'general' | 'webinar' | 'video'>('packages')
  const [copiedCode, setCopiedCode] = useState(false)

  const code = data?.affiliateCode || user?.affiliateCode || ''
  const packageLinks: any[] = data?.packageLinks || []
  const courseLinks: any[] = data?.courseLinks || []
  const webinar = data?.webinar || {}
  const presentationVideoLink = data?.presentationVideoLink || ''
  const generalLinks = data?.generalLinks || {}

  const selectedPkg = packageLinks.find(p => p.id === selectedPackageId) || packageLinks[0]
  const selectedCourse = courseLinks.find(c => c.id === selectedCourseId) || courseLinks[0]

  const baseWebUrl = 'https://peptly.in'
  const pkgUrl = selectedPkg ? `${baseWebUrl}/checkout?type=package&packageId=${selectedPkg.id}&promo=${code}` : ''
  const pkgRegUrl = `${baseWebUrl}/register?ref=${code}`
  const courseUrl = selectedCourse ? `${baseWebUrl}/courses/${selectedCourse.slug}?ref=${code}` : ''

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 rounded-3xl" />
      <div className="flex gap-2 overflow-x-auto pb-1">{[...Array(5)].map((_, i) => <div key={i} className="h-12 w-28 flex-shrink-0 bg-dark-800 rounded-xl" />)}</div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-dark-800 rounded-2xl" />)}
    </div>
  )

  const sections = [
    { key: 'packages', label: 'Packages', icon: ShoppingBag, color: 'emerald', available: packageLinks.length > 0 },
    { key: 'courses', label: 'Courses', icon: BookOpen, color: 'blue', available: courseLinks.length > 0 },
    { key: 'general', label: 'General', icon: Globe, color: 'violet', available: true },
    { key: 'webinar', label: 'Webinar', icon: Calendar, color: 'purple', available: true },
    { key: 'video', label: 'Video', icon: PlayCircle, color: 'rose', available: true },
  ] as const

  const sectionColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }

  return (
    <div className="space-y-5 pb-12">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 border border-violet-500/30 p-6 sm:p-8">
        {/* bg decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30">
              <Zap className="w-3 h-3 text-violet-300" />
              <span className="text-violet-300 text-[11px] font-bold uppercase tracking-wider">Your Referral Hub</span>
            </div>
          </div>

          <h1 className="text-white text-2xl sm:text-3xl font-black mb-1">Link Generator</h1>
          <p className="text-violet-200/70 text-sm mb-6">Share links — your promo code is pre-filled, discount auto-applied</p>

          {/* Promo Code Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">Your Promo Code</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest">{code}</span>
                    <div className="flex flex-col gap-1">
                      <div className="px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/30">
                        <span className="text-green-400 text-[10px] font-bold">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/50 text-[11px] mt-1">Buyers get instant discount at checkout</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                <button onClick={copyCode}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${copiedCode ? 'bg-green-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'}`}>
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`🎁 Use my promo code *${code}* on TruLearnix to get an instant discount!\n\n👉 Register here: ${baseWebUrl}/register?ref=${code}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/25 transition-all">
                  <Share2 className="w-4 h-4" /> Share
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Package Links', value: packageLinks.length, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Course Links', value: courseLinks.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'General Links', value: 4, icon: Globe, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'With Discount', value: packageLinks.filter((p: any) => p.promoDiscountPercent > 0).length, icon: Tag, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-3.5 ${bg}`}>
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Section Switcher ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map(({ key, label, icon: Icon, color }) => {
          const isActive = activeSection === key
          return (
            <button key={key} onClick={() => setActiveSection(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${isActive ? sectionColorMap[color] : 'bg-dark-800 text-gray-400 border-white/8 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* ── PACKAGES SECTION ── */}
      {activeSection === 'packages' && (
        <div className="space-y-4">
          {packageLinks.length === 0 ? (
            <div className="card text-center py-12">
              <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No packages available yet</p>
            </div>
          ) : (
            <>
              {/* Package dropdown */}
              <div className="relative">
                <select
                  value={selectedPackageId || (packageLinks[0]?.id ?? '')}
                  onChange={e => setSelectedPackageId(e.target.value)}
                  className="w-full appearance-none bg-dark-700 border border-white/12 rounded-xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-emerald-500/60 pr-10 cursor-pointer"
                >
                  {packageLinks.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id} className="bg-dark-700">
                      {pkg.name} — ₹{pkg.price?.toLocaleString()}{pkg.promoDiscountPercent > 0 ? ` (${pkg.promoDiscountPercent}% off)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Selected package summary chip */}
              {selectedPkg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${TIER_CFG[selectedPkg.tier || 'starter']?.bg} ${TIER_CFG[selectedPkg.tier || 'starter']?.border}`}>
                  {(() => { const cfg = TIER_CFG[selectedPkg.tier || 'starter'] || TIER_CFG.starter; const TierIcon = cfg.icon; return <TierIcon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} /> })()}
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm font-semibold">{selectedPkg.name}</span>
                    <span className={`ml-2 text-xs font-bold ${TIER_CFG[selectedPkg.tier || 'starter']?.color}`}>₹{selectedPkg.price?.toLocaleString()}</span>
                  </div>
                  {selectedPkg.promoDiscountPercent > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Tag className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs font-bold">{selectedPkg.promoDiscountPercent}% off</span>
                    </div>
                  )}
                </div>
              )}

              {/* Selected package links */}
              {selectedPkg && (
                <div className="rounded-2xl border border-white/10 bg-dark-800/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white text-sm font-semibold">Links for: {selectedPkg.name}</span>
                    {selectedPkg.promoDiscountPercent > 0 && (
                      <span className="ml-auto text-[11px] text-green-400 font-semibold">{selectedPkg.promoDiscountPercent}% discount pre-applied</span>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <LinkRow
                      label="Direct Checkout Link (with promo)"
                      url={pkgUrl}
                      accent="emerald"
                      waMsg={`🎓 Join *${selectedPkg.name}*${selectedPkg.promoDiscountPercent > 0 ? ` at ${selectedPkg.promoDiscountPercent}% OFF` : ''}!\n\n💰 Price: ₹${selectedPkg.price?.toLocaleString()}\n\n👉 Checkout now (promo pre-applied):\n${pkgUrl}\n\nYour code *${code}* is already in the link!`}
                    />
                    <LinkRow
                      label="Registration Link (for new users)"
                      url={pkgRegUrl}
                      accent="violet"
                      waMsg={`🚀 Join TruLearnix — India's fastest growing skill & earning platform!\n\n✅ Learn Digital Marketing, Partner Earning & more\n✅ Earn while you learn with our Partner Program\n\n👉 Register now: ${pkgRegUrl}\n\nUse code *${code}* at checkout for discount!`}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── COURSES SECTION ── */}
      {activeSection === 'courses' && (
        <div className="space-y-4">
          {courseLinks.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No courses available yet</p>
            </div>
          ) : (
            <>
              {/* Course dropdown */}
              <div className="relative">
                <select
                  value={selectedCourseId || (courseLinks[0]?.id ?? '')}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  className="w-full appearance-none bg-dark-700 border border-white/12 rounded-xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-blue-500/60 pr-10 cursor-pointer"
                >
                  {courseLinks.map((course: any) => (
                    <option key={course.id} value={course.id} className="bg-dark-700">
                      {course.title}{course.price > 0 ? ` — ₹${course.price.toLocaleString()}` : ' (Free)'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Selected course summary chip */}
              {selectedCourse && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-500/25 bg-blue-500/8">
                  {selectedCourse.thumbnail
                    ? <img src={selectedCourse.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    : <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  }
                  <span className="text-white text-sm font-semibold flex-1 truncate">{selectedCourse.title}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {selectedCourse.discountPercent > 0 && (
                      <>
                        <span className="text-xs text-gray-500 line-through">₹{selectedCourse.basePrice?.toLocaleString()}</span>
                        <span className="text-xs font-bold text-green-400">₹{selectedCourse.refPrice?.toLocaleString()}</span>
                        <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-bold">{selectedCourse.discountPercent}% OFF</span>
                      </>
                    )}
                    {!selectedCourse.discountPercent && (
                      <span className={`text-xs font-bold ${selectedCourse.price > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                        {selectedCourse.price > 0 ? `₹${selectedCourse.price.toLocaleString()}` : 'Free'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Selected course link */}
              {selectedCourse && courseUrl && (
                <div className="rounded-2xl border border-white/10 bg-dark-800/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-white text-sm font-semibold">Link for: {selectedCourse.title}</span>
                  </div>
                  <div className="p-4">
                    <LinkRow
                      label="Course Referral Link"
                      url={courseUrl}
                      accent="blue"
                      waMsg={`📚 Check out this course on TruLearnix!\n\n"${selectedCourse.title}"\n${selectedCourse.discountPercent > 0 ? `💰 Special Price: ~~₹${selectedCourse.basePrice?.toLocaleString()}~~ → *₹${selectedCourse.refPrice?.toLocaleString()}* (${selectedCourse.discountPercent}% OFF via my link!)` : selectedCourse.price > 0 ? `💰 Price: ₹${selectedCourse.price.toLocaleString()}` : '✅ Free Course'}\n\n👉 Enroll here: ${courseUrl}\n\nLearn & grow with TruLearnix! 🚀`}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── GENERAL LINKS ── */}
      {activeSection === 'general' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">Share any of these links — your referral code is embedded in each one</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GENERAL_LINKS.map(({ key, label, icon: Icon, accent, iconColor, desc }) => {
              const url = generalLinks[key] || `${baseWebUrl}/${key === 'home' ? '' : key}?ref=${code}`
              const waMsgMap: Record<string, string> = {
                home: `🌟 Check out TruLearnix — India's best skill & earning platform!\n\n👉 Visit: ${url}`,
                courses: `📚 Explore all courses on TruLearnix!\n\n👉 Browse here: ${url}`,
                packages: `💼 Check out TruLearnix Partner Packages and start earning!\n\n👉 View packages: ${url}`,
                register: `🚀 Join TruLearnix today and start your earning journey!\n\n👉 Register: ${url}\n\nUse code *${code}* at checkout for instant discount!`,
              }
              return (
                <div key={key} className={`rounded-2xl border p-4 ${accent}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-gray-500 text-[11px]">{desc}</p>
                    </div>
                  </div>
                  <LinkRow label={`${label} URL`} url={url} accent={key === 'home' ? 'violet' : key === 'courses' ? 'blue' : key === 'packages' ? 'emerald' : 'amber'} waMsg={waMsgMap[key] || `👉 ${url}`} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEBINAR ── */}
      {activeSection === 'webinar' && (
        <div className="space-y-4">
          {webinar.link || webinar.title ? (
            <>
              {/* Webinar info banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/60 to-violet-900/40 border border-purple-500/30 p-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Live Webinar</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold">UPCOMING</span>
                    </div>
                    {webinar.title && <p className="text-white font-bold text-lg leading-snug">{webinar.title}</p>}
                    {webinar.date && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 text-sm font-medium">{webinar.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {webinar.link && (
                <div className="rounded-2xl border border-white/10 bg-dark-800/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-white text-sm font-semibold">Webinar Join Link</span>
                    <span className="ml-auto text-[11px] text-gray-500">Share with prospects</span>
                  </div>
                  <div className="p-4">
                    <LinkRow
                      label="Webinar Registration / Join Link"
                      url={webinar.link}
                      accent="violet"
                      waMsg={`🎓 Join our FREE webinar on TruLearnix!\n\n${webinar.title ? `📌 *${webinar.title}*\n` : ''}${webinar.date ? `📅 ${webinar.date}\n` : ''}\n👉 Register/Join: ${webinar.link}\n\n⚠️ Seats are limited — book yours now!`}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-200/80 text-sm"><span className="font-bold text-amber-300">Pro tip:</span> Webinar attendees convert 3-5x better than cold leads. Share this link broadly!</p>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-14">
              <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No webinar scheduled yet</p>
              <p className="text-gray-500 text-sm">Check back soon — admin will add upcoming webinar details</p>
            </div>
          )}
        </div>
      )}

      {/* ── PRESENTATION VIDEO ── */}
      {activeSection === 'video' && (
        <div className="space-y-4">
          {presentationVideoLink ? (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900/60 to-orange-900/40 border border-rose-500/30 p-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                    <PlayCircle className="w-7 h-7 text-rose-300" />
                  </div>
                  <div>
                    <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-1">Sales / Presentation Video</p>
                    <p className="text-white font-bold text-base">TruLearnix Opportunity Video</p>
                    <p className="text-white/50 text-xs mt-0.5">Send this to prospects before your pitch call</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-dark-800/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-white text-sm font-semibold">Presentation Video Link</span>
                </div>
                <div className="p-4 space-y-3">
                  <LinkRow
                    label="Video Link"
                    url={presentationVideoLink}
                    accent="rose"
                    waMsg={`🎥 Watch this short video to understand the TruLearnix earning opportunity!\n\n👉 ${presentationVideoLink}\n\nAfter watching, I'll help you get started right away! 🚀`}
                  />
                  <a href={presentationVideoLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-semibold transition-all">
                    <PlayCircle className="w-4 h-4" /> Watch Video <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Flame className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-200/80 text-sm"><span className="font-bold text-blue-300">Strategy:</span> Send this video first, wait 30 minutes, then follow up. Educated prospects close 2x faster.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-14">
              <Video className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No presentation video yet</p>
              <p className="text-gray-500 text-sm">Admin will configure the presentation video soon</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tips ── */}
      <div className="rounded-2xl border border-white/8 bg-dark-800/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <h2 className="text-white font-bold">Tips to Maximize Earnings</h2>
        </div>
        <div className="p-4 grid sm:grid-cols-2 gap-2.5">
          {[
            { icon: '💬', tip: 'Share package checkout links — promo discount motivates buyers to act fast' },
            { icon: '🎥', tip: 'Send the presentation video first to educate and warm up prospects' },
            { icon: '🎓', tip: 'Webinar attendees convert 3-5x better — share widely' },
            { icon: '📸', tip: 'Post reels showing your earnings to attract new referrals organically' },
            { icon: '📊', tip: 'Track all leads and follow-ups in your CRM for higher closure rates' },
            { icon: '🏆', tip: 'Higher tier packages = higher commission % — upsell wisely' },
          ].map(({ icon, tip }) => (
            <div key={tip} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-gray-400 text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
