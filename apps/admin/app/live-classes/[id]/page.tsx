'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Video, VideoOff, Users, MessageSquare, Send,
  LogOut, Eye, ShieldCheck, X
} from 'lucide-react'

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }

export default function AdminClassRoom({ params }: { params: { id: string } }) {
  const router = useRouter()
  const adminName = (typeof window !== 'undefined' ? localStorage.getItem('adminName') : null) || 'Admin'

  const clientRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLDivElement>(null)

  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])
  const [panelOpen, setPanelOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: 1, name: 'System', msg: '🛡️ Admin observer joined. Class participants have been notified.', time: now() }
  ])
  const [timer, setTimer] = useState(0)

  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['agora-token-admin', params.id],
    queryFn: () => adminAPI.agoraToken(params.id).then(r => r.data),
    retry: false,
  })

  const { data: classDetail } = useQuery({
    queryKey: ['class-detail-admin', params.id],
    queryFn: () => adminAPI.getClass(params.id).then(r => r.data),
  })

  // Timer
  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Init Agora when token ready
  useEffect(() => {
    if (!tokenData?.appId) return
    initAgora(tokenData)
    return () => { handleLeave(false) }
  }, [tokenData])

  // Notify room that admin joined
  const notifyAdminJoin = async (inRoom: boolean) => {
    try {
      await adminAPI.setRoomControl(params.id, {
        adminInRoom: inRoom,
        adminName: inRoom ? adminName : '',
      })
    } catch {}
  }

  const initAgora = async (data: any) => {
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      clientRef.current = client
      await client.setClientRole('host')
      await client.join(data.appId, data.channelName, data.token || null, null)

      client.on('user-published', async (ru: any, mt: 'video' | 'audio') => {
        await client.subscribe(ru, mt)
        setRemoteUsers(prev => prev.find((u: any) => u.uid === ru.uid) ? prev.map((u: any) => u.uid === ru.uid ? ru : u) : [...prev, ru])
        if (mt === 'video') {
          setTimeout(() => {
            const el = document.getElementById(`admin-rv-${ru.uid}`)
            if (el) ru.videoTrack?.play(el)
          }, 200)
        }
        if (mt === 'audio') ru.audioTrack?.play()
      })
      client.on('user-left', (ru: any) => {
        setRemoteUsers(prev => prev.filter((u: any) => u.uid !== ru.uid))
      })

      setJoined(true)
      await notifyAdminJoin(true)
      toast.success('Joined as Admin Observer')
    } catch (err: any) {
      toast.error('Failed to join: ' + (err?.message || 'Unknown'))
    }
  }

  const handleLeave = async (navigate = true) => {
    localAudioTrackRef.current?.close()
    localVideoTrackRef.current?.close()
    localAudioTrackRef.current = null
    localVideoTrackRef.current = null
    await clientRef.current?.leave()
    await notifyAdminJoin(false)
    if (navigate) router.push('/live-classes')
  }

  const toggleMic = async () => {
    try {
      if (!localAudioTrackRef.current) {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const t = await AgoraRTC.createMicrophoneAudioTrack()
        localAudioTrackRef.current = t
        await clientRef.current?.publish([t])
        setMicOn(true)
      } else {
        await localAudioTrackRef.current.setEnabled(!micOn)
        setMicOn(v => !v)
      }
    } catch { toast.error('Mic not available') }
  }

  const toggleCam = async () => {
    try {
      if (!localVideoTrackRef.current) {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const t = await AgoraRTC.createCameraVideoTrack()
        localVideoTrackRef.current = t
        await clientRef.current?.publish([t])
        if (localVideoContainerRef.current) t.play(localVideoContainerRef.current)
        setCamOn(true)
      } else {
        await localVideoTrackRef.current.setEnabled(!camOn)
        setCamOn(v => !v)
      }
    } catch { toast.error('Camera not available') }
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMsgs(p => [...p, { id: Date.now(), name: adminName, msg: chatInput, time: now(), isMe: true }])
    setChatInput('')
  }

  function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  function fmt(s: number) { return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

  if (isLoading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Joining class as admin observer...</p>
      </div>
    </div>
  )

  const cls = classDetail?.liveClass

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-slate-900 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 text-xs font-bold">Admin Observer</span>
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-[220px]">{cls?.title || 'Live Class'}</span>
          {joined && <span className="text-xs font-mono text-green-400 hidden sm:block">{fmt(timer)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:block">{adminName}</span>
          <button onClick={() => handleLeave(true)}
            className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">

        {/* Main video grid */}
        <div className="flex-1 min-w-0 min-h-0 bg-black flex flex-col">
          {!joined ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Connecting...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1 p-2 min-h-0 overflow-auto">
              {/* Admin local video (if cam on) */}
              {camOn && (
                <div className="relative rounded-xl overflow-hidden bg-slate-900 w-48 h-32 flex-shrink-0 self-end">
                  <div ref={localVideoContainerRef} className="w-full h-full" />
                  <div className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                    {adminName} (You)
                  </div>
                </div>
              )}

              {/* Remote participants grid */}
              {remoteUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                  <Eye className="w-12 h-12 text-violet-400/30" />
                  <p className="text-gray-500">Observing class as admin</p>
                  <p className="text-gray-600 text-sm">Participants will appear here when they join</p>
                </div>
              ) : (
                <div className={`grid gap-2 flex-1 ${remoteUsers.length === 1 ? 'grid-cols-1' : remoteUsers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {remoteUsers.map((ru: any, i) => (
                    <div key={ru.uid} className="relative rounded-xl overflow-hidden bg-slate-900 min-h-0">
                      <div id={`admin-rv-${ru.uid}`} className="w-full h-full" />
                      {!ru.videoTrack && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
                          <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-violet-400">P{i + 1}</span>
                          </div>
                          <span className="text-xs text-gray-500">No camera</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg">
                        {ru.audioTrack ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                        Participant {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        {panelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900/95 border-l border-white/5 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-white text-sm font-semibold">Participants ({remoteUsers.length})</span>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participants list */}
            <div className="p-3 space-y-2 flex-shrink-0 border-b border-white/5 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                <div className="w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{adminName}</p>
                  <p className="text-[10px] text-violet-400">Admin Observer</p>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              </div>
              {remoteUsers.map((ru: any, i) => (
                <div key={ru.uid} className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                  <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-gray-300 text-xs font-bold">P{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">Participant {i + 1}</p>
                  </div>
                  <div className="flex gap-1">
                    {ru.audioTrack ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                    {ru.videoTrack ? <Video className="w-3 h-3 text-blue-400" /> : <VideoOff className="w-3 h-3 text-gray-600" />}
                  </div>
                </div>
              ))}
              {remoteUsers.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-2">No one else in the class</p>
              )}
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {chatMsgs.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  {!msg.isMe && <span className="text-[11px] text-gray-500 mb-0.5 px-1">{msg.name}</span>}
                  <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                    msg.name === 'System' ? 'bg-violet-500/10 text-violet-300 text-xs w-full text-center' :
                    msg.isMe ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-200'
                  }`}>{msg.msg}</div>
                  <span className="text-[10px] text-gray-600 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 flex-shrink-0">
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message participants..."
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
                <button onClick={sendChat} className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-xl flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 h-14 bg-slate-900 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={toggleMic}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors text-xs gap-0.5 ${micOn ? 'bg-slate-700 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-400'}`}>
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px]">Mic</span>
          </button>
          <button onClick={toggleCam}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors text-xs gap-0.5 ${camOn ? 'bg-slate-700 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-400'}`}>
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[10px]">Cam</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs px-3 py-1.5 rounded-lg">
            <Eye className="w-3.5 h-3.5" />
            Observing as Admin
          </div>
          <button onClick={() => setPanelOpen(v => !v)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors ${panelOpen ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700 text-gray-400 hover:bg-white/10'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Panel</span>
          </button>
        </div>

        <button onClick={() => handleLeave(true)}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Leave Class
        </button>
      </div>
    </div>
  )
}
