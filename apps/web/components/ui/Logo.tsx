import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 22, text: 'text-base',    sub: 'text-[7px]',  gap: 'gap-1.5' },
  md: { icon: 28, text: 'text-lg',      sub: 'text-[8px]',  gap: 'gap-2'   },
  lg: { icon: 34, text: 'text-2xl',     sub: 'text-[9px]',  gap: 'gap-2.5' },
}

export default function Logo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const s = sizes[size]

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`} style={{ textDecoration: 'none' }}>
      {/* Icon mark */}
      <span className="relative flex-shrink-0" style={{ width: s.icon, height: s.icon }}>
        {/* outer ring */}
        <span className="absolute inset-0 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #d946ef, #06b6d4)',
            padding: '1.5px',
          }}>
          <span className="block w-full h-full rounded-[7px]"
            style={{ background: '#08091a' }} />
        </span>
        {/* inner shape */}
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 20 20" fill="none">
            {/* stylised "T" spark */}
            <path d="M3 5h14M10 5v10" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="14" cy="13" r="2" fill="url(#lg2)" />
            <defs>
              <linearGradient id="lg1" x1="3" y1="5" x2="17" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a78bfa"/>
                <stop offset="1" stopColor="#06b6d4"/>
              </linearGradient>
              <linearGradient id="lg2" x1="12" y1="11" x2="16" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d946ef"/>
                <stop offset="1" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </span>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className={`font-black tracking-tight ${s.text}`}
          style={{
            background: 'linear-gradient(135deg, #e0d7ff 0%, #a78bfa 40%, #d946ef 70%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          TruLearnix
        </span>
        <span className={`${s.sub} font-bold tracking-[0.12em] uppercase`}
          style={{ color: 'rgba(167,139,250,0.55)', marginTop: '1px' }}>
          Learn · Grow · Earn
        </span>
      </span>
    </span>
  )

  if (!href) return inner
  return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
}
