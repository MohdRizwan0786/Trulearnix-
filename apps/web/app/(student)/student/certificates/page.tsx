'use client'
import { useQuery } from '@tanstack/react-query'
import { certAPI } from '@/lib/api'
import { Award, Download, Share2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export default function CertificatesPage() {
  const { data } = useQuery({ queryKey: ['certificates'], queryFn: () => certAPI.mine().then(r => r.data) })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Certificates</h1>
        <p className="text-gray-400 mt-1">All your earned certificates</p>
      </div>

      {data?.certificates?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.certificates.map((cert: any) => (
            <div key={cert._id} className="card hover:border-primary-500/30">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{cert.courseName}</h3>
                  <p className="text-sm text-gray-400 mt-1">Issued on {format(new Date(cert.issuedAt), 'dd MMMM yyyy')}</p>
                  {cert.score && <p className="text-sm text-green-400 mt-1">Score: {cert.score}%</p>}
                  <p className="text-xs text-gray-500 mt-1 font-mono">ID: {cert.certificateId}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 btn-primary text-sm py-2 px-4">
                  <Download className="w-4 h-4" /> Download
                </a>
                <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 btn-secondary text-sm py-2 px-4">
                  <ExternalLink className="w-4 h-4" /> Verify
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No certificates yet</h3>
          <p className="text-gray-400">Complete a course to earn your certificate</p>
        </div>
      )}
    </div>
  )
}
