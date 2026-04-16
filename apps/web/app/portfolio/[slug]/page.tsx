'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Linkedin, Globe, Award, BookOpen, FolderGit2, Zap, Star, Github, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function PortfolioPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    api.get(`/users/portfolio/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !data?.user) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: '#0a0a0f' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <Star className="w-8 h-8 text-violet-400 opacity-40" />
      </div>
      <p className="text-white font-bold text-xl">Portfolio Not Found</p>
      <p className="text-gray-500 text-sm">This learner hasn't set up their portfolio yet</p>
      <Link href="/" className="mt-2 text-sm text-violet-400 hover:underline">Go to TruLearnix →</Link>
    </div>
  )

  const { user, certs = [], projects = [], enrollments = [] } = data

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#fff' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.1) 50%, transparent 100%)' }} />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '3px solid rgba(124,58,237,0.4)' }}>
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                : <span className="text-white font-black text-3xl">{user.name?.[0]?.toUpperCase()}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black text-white">{user.name}</h1>
              {user.bio && <p className="text-gray-400 mt-2 leading-relaxed max-w-xl">{user.bio}</p>}

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/20">
                  <Zap className="w-3 h-3" /> {user.xpPoints || 0} XP · Level {user.level || 1}
                </span>
                {user.packageTier && user.packageTier !== 'free' && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold text-amber-400 bg-amber-500/15 border border-amber-500/20 capitalize">
                    {user.packageTier} Member
                  </span>
                )}
                {user.socialLinks?.linkedin && (
                  <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                <a href="https://peptly.in" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                  <Globe className="w-3 h-3" /> peptly.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-10">
        {/* Skills */}
        {(user.expertise || []).length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" /> Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.expertise.map((s: string) => (
                <span key={s} className="text-sm px-3 py-1.5 rounded-xl font-medium text-violet-300 bg-violet-500/12 border border-violet-500/22">{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {certs.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Certificates ({certs.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certs.map((c: any) => (
                <div key={c._id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Award className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{c.course?.title || 'Course'}</p>
                    <p className="text-xs text-amber-400/70">Certified by TruLearnix</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-green-400" /> Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((p: any) => (
                <div key={p._id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {p.thumbnail && <img src={p.thumbnail} className="w-full aspect-video object-cover" alt={p.title} />}
                  <div className="p-4">
                    <p className="font-bold text-white mb-1">{p.title}</p>
                    {p.description && <p className="text-gray-500 text-xs line-clamp-2">{p.description}</p>}
                    {(p.techStack || []).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {p.techStack.slice(0, 4).map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-gray-400">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Live
                        </a>
                      )}
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:underline">
                          <Github className="w-3 h-3" /> Code
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        {enrollments.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" /> Learning Journey
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrollments.map((e: any) => (
                <div key={e._id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {e.course?.thumbnail
                    ? <img src={e.course.thumbnail} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-blue-400" /></div>
                  }
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{e.course?.title || 'Course'}</p>
                    <p className="text-xs text-blue-400/70">{e.completedAt ? '✓ Completed' : `${(e.progress || []).length} lessons done`}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <p className="text-gray-400 text-sm mb-3">Portfolio powered by</p>
          <a href="https://peptly.in" target="_blank" rel="noopener noreferrer"
            className="text-xl font-black text-violet-400 hover:text-violet-300 transition-colors">TruLearnix</a>
          <p className="text-gray-600 text-xs mt-1">India's leading digital skills platform</p>
        </div>
      </div>
    </div>
  )
}
