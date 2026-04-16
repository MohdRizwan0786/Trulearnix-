'use client'
import { useQuery } from '@tanstack/react-query'
import { certAPI } from '@/lib/api'
import { Award, Download, Share2, ExternalLink, Star, Trophy } from 'lucide-react'
import { format } from 'date-fns'

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => certAPI.mine().then(r => r.data)
  })

  return (
    <>
      <style>{`
        @keyframes certShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.2), 0 0 0 1px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 40px rgba(251,191,36,0.35), 0 0 0 1px rgba(251,191,36,0.5); }
        }
        .cert-card { animation: goldPulse 3s ease-in-out infinite; }
        .shimmer-bg {
          background: linear-gradient(90deg, rgba(251,191,36,0.08) 25%, rgba(251,191,36,0.15) 50%, rgba(251,191,36,0.08) 75%);
          background-size: 200% 100%;
          animation: certShimmer 3s infinite;
        }
      `}</style>

      <div className="space-y-8 max-w-4xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1), rgba(217,119,6,0.08))',
          border: '1px solid rgba(251,191,36,0.3)',
          boxShadow: '0 8px 40px rgba(245,158,11,0.1)'
        }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.2)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(251,191,36,0.12)' }} />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))',
              border: '1px solid rgba(251,191,36,0.4)',
              boxShadow: '0 8px 25px rgba(245,158,11,0.25)'
            }}>
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">My Certificates</h1>
              <p className="text-amber-400/70 text-sm mt-0.5">
                {data?.certificates?.length || 0} certificate{(data?.certificates?.length || 0) !== 1 ? 's' : ''} earned
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : data?.certificates?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.certificates.map((cert: any) => (
              <div key={cert._id} className="cert-card rounded-2xl overflow-hidden relative" style={{
                background: 'linear-gradient(135deg, rgba(13,13,20,0.98), rgba(20,15,30,0.98))',
              }}>
                {/* Shimmer top bar */}
                <div className="shimmer-bg h-1.5 w-full" />

                <div className="p-6">
                  {/* Corner decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5"
                    style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))',
                      border: '1px solid rgba(251,191,36,0.35)'
                    }}>
                      <Award className="w-8 h-8 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/60">Certificate of Completion</span>
                      </div>
                      <h3 className="font-black text-white text-lg leading-tight">{cert.courseName}</h3>
                      <p className="text-sm text-amber-400/60 mt-0.5">Issued on {format(new Date(cert.issuedAt), 'dd MMMM yyyy')}</p>
                      {cert.score && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-amber-300">{cert.score}% Score</span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1 font-mono">ID: {cert.certificateId}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <ExternalLink className="w-4 h-4" /> Verify
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl text-center py-20 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
              border: '1px solid rgba(251,191,36,0.2)'
            }}>
              <Award className="w-12 h-12 text-amber-400/40" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">No certificates yet</h3>
            <p className="text-gray-400 text-sm">Complete a course to earn your first certificate</p>
          </div>
        )}
      </div>
    </>
  )
}
