'use client'
import { useQuery } from '@tanstack/react-query'
import { certAPI } from '@/lib/api'
import { CheckCircle, XCircle, Award, Download } from 'lucide-react'
import { format } from 'date-fns'

export default function VerifyCertificatePage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-cert', params.id],
    queryFn: () => certAPI.verify(params.id).then(r => r.data)
  })

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {isLoading ? (
          <div className="card text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-400 mt-4">Verifying certificate...</p>
          </div>
        ) : isError ? (
          <div className="card text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Certificate Not Found</h2>
            <p className="text-gray-400">This certificate ID is invalid or does not exist.</p>
          </div>
        ) : (
          <div className="card border-green-500/30">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Certificate Verified ✓</h2>
              <p className="text-gray-400 mt-1">This is an authentic TruLearnix certificate</p>
            </div>

            <div className="space-y-4 bg-dark-700 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-primary-400" />
                <div>
                  <p className="text-xs text-gray-400">Student Name</p>
                  <p className="font-bold text-white">{data?.certificate?.studentName}</p>
                </div>
              </div>
              <hr className="border-white/10" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Course Completed</p>
                <p className="font-semibold text-white">{data?.certificate?.courseName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Instructor</p>
                <p className="text-white">{data?.certificate?.mentorName}</p>
              </div>
              {data?.certificate?.score && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Final Score</p>
                  <p className="text-green-400 font-bold">{data.certificate.score}%</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Issue Date</p>
                <p className="text-white">{format(new Date(data?.certificate?.issuedAt), 'dd MMMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Certificate ID</p>
                <p className="font-mono text-primary-400 text-sm">{data?.certificate?.certificateId}</p>
              </div>
            </div>

            <a href={data?.certificate?.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-4">
              <Download className="w-4 h-4" /> Download Certificate
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
