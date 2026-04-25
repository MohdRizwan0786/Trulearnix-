'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Video, VideoOff, Users, MessageSquare, Send,
  LogOut, Radio, Copy, BarChart2, Clock, Download, ExternalLink,
  Play, Square, CheckCircle2, XCircle, ArrowLeft, Monitor, MonitorOff, Pencil,
} from 'lucide-react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { format } from 'date-fns'

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com').replace(/\/api$/, '')

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }
interface RemoteUser { identity: string; name: string; hasVideo: boolean; hasAudio: boolean; videoTrack?: any; audioTrack?: any }

function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export default function WebinarRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const adminName = (typeof window !== 'undefined' ? localStorage.getItem('adminName') : null) || 'Admin'

  const roomRef = useRef<Room | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

  const [tab, setTab] = useState<'room' | 'report'>('room')
  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: 1, name: 'System', msg: 'Admin joined the session.', time: now() }
  ])
  const [timer, setTimer] = useState(0)
  const [mutedAll, setMutedAll] = useState(false)
  const [camOffAll, setCamOffAll] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const { data: webinarData, refetch: refetchWebinar } = useQuery({
    queryKey: ['webinar-detail', params.id],
    queryFn: () => adminAPI.getWebinar(params.id).then(r => r.data),
    refetchInterval: 15000,
  })
  const webinar = webinarData?.webinar

  const { data: tokenData } = useQuery({
    queryKey: ['webinar-token', params.id],
    queryFn: () => adminAPI.webinarLivekitToken(params.id).then(r => r.data),
    enabled: !!webinar && webinar.status === 'live',
    retry: false,
  })

  const { data: reportData } = useQuery({
    queryKey: ['webinar-report', params.id],
    queryFn: () => adminAPI.getWebinarReport(params.id).then(r => r.data),
    enabled: tab === 'report',
  })
  const report = reportData?.report

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!tokenData?.token || !tokenData?.livekitUrl) return
    initLiveKit(tokenData)
    return () => { handleLeave(false) }
  }, [tokenData])

  const initLiveKit = async (data: any) => {
    try {
      const room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room

      room.on(RoomEvent.ParticipantConnected, () => updateRemotes(room))
      room.on(RoomEvent.ParticipantDisconnected, () => updateRemotes(room))
      room.on(RoomEvent.TrackSubscribed, () => updateRemotes(room))
      room.on(RoomEvent.TrackUnsubscribed, () => updateRemotes(room))
      room.on(RoomEvent.TrackMuted, () => updateRemotes(room))
      room.on(RoomEvent.TrackUnmuted, () => updateRemotes(room))
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload))
          if (msg.type === 'chat') {
            setChatMsgs(prev => [...prev, { id: Date.now(), name: msg.name, msg: msg.msg, time: now() }])
          }
        } catch {}
      })

      await room.connect(data.livekitUrl, data.token)
      setJoined(true)
      updateRemotes(room)
      // Start recording after host has joined (room now exists)
      adminAPI.startWebinarRecording(params.id).catch(e => {
        const msg = e?.response?.data?.message || e?.message || 'Unknown error'
        console.warn('Webinar recording start failed:', msg)
        toast.error(`⚠️ Recording start nahi hui: ${msg}. Webinar continue hoga but recording save nahi hogi.`, { duration: 8000 })
      })
    } catch (e: any) {
      toast.error('Failed to connect: ' + e.message)
    }
  }

  const updateRemotes = (room: Room) => {
    const users: RemoteUser[] = []
    room.remoteParticipants.forEach(p => {
      const ru: RemoteUser = { identity: p.identity, name: p.name || p.identity, hasVideo: false, hasAudio: false }
      p.trackPublications.forEach(pub => {
        if (pub.isSubscribed && pub.track && pub.kind === Track.Kind.Video && pub.source !== Track.Source.ScreenShare) {
          ru.hasVideo = true; ru.videoTrack = pub.track
        }
        if (pub.isSubscribed && pub.track && pub.kind === Track.Kind.Audio) {
          ru.hasAudio = true; ru.audioTrack = pub.track
        }
      })
      users.push(ru)
    })
    setRemoteUsers(users)
  }

  // Attach local camera track after video element mounts
  useEffect(() => {
    if (!camOn || !roomRef.current) return
    const timer = setTimeout(() => {
      const track = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Camera)?.track
      if (track && localVideoRef.current) track.attach(localVideoRef.current)
    }, 100)
    return () => clearTimeout(timer)
  }, [camOn])

  // Attach screen share track after video element mounts
  useEffect(() => {
    if (!screenOn || !roomRef.current) return
    const timer = setTimeout(() => {
      const track = roomRef.current?.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track
      if (track && screenVideoRef.current) track.attach(screenVideoRef.current)
    }, 100)
    return () => clearTimeout(timer)
  }, [screenOn])

  const toggleMic = async () => {
    if (!roomRef.current) return
    const newVal = !micOn
    await roomRef.current.localParticipant.setMicrophoneEnabled(newVal)
    setMicOn(newVal)
  }

  const toggleCam = async () => {
    if (!roomRef.current) return
    const newVal = !camOn
    await roomRef.current.localParticipant.setCameraEnabled(newVal)
    setCamOn(newVal)
  }

  const toggleScreen = async () => {
    if (!roomRef.current) return
    const newVal = !screenOn
    try {
      await roomRef.current.localParticipant.setScreenShareEnabled(newVal)
      setScreenOn(newVal)
    } catch {
      // User cancelled screen share dialog
    }
  }

  const handleLeave = (navigate = true) => {
    roomRef.current?.disconnect()
    roomRef.current = null
    setJoined(false)
    if (navigate) router.push('/webinars')
  }

  const sendChat = () => {
    if (!chatInput.trim() || !roomRef.current) return
    const msg = { type: 'chat', name: adminName, msg: chatInput.trim() }
    roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true })
    setChatMsgs(prev => [...prev, { id: Date.now(), name: adminName, msg: chatInput.trim(), time: now(), isMe: true }])
    setChatInput('')
  }

  const setRoomControl = async (key: 'mutedAll' | 'camOffAll', val: boolean) => {
    try {
      await adminAPI.setWebinarRoomControl(params.id, { [key]: val })
      if (key === 'mutedAll') setMutedAll(val)
      if (key === 'camOffAll') setCamOffAll(val)
      toast.success(val ? `All participants ${key === 'mutedAll' ? 'muted' : 'cameras off'}` : 'Control released')
    } catch { toast.error('Control failed') }
  }

  const handleStart = async () => {
    setActionLoading('start')
    try {
      await adminAPI.startWebinar(params.id)
      toast.success('Session is LIVE! Recording started automatically.')
      refetchWebinar()
      qc.invalidateQueries({ queryKey: ['webinar-token', params.id] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading('') }
  }

  const handleEnd = async () => {
    if (!confirm('End session? Recording will be saved automatically.')) return
    setActionLoading('end')
    try {
      await adminAPI.endWebinar(params.id)
      toast.success('Session ended and recording saved.')
      handleLeave(false)
      refetchWebinar()
      setTab('report')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading('') }
  }

  const copyJoinLink = () => {
    if (!webinar?.joinSlug) return
    navigator.clipboard.writeText(`${WEB_BASE}/webinar/${webinar.joinSlug}`)
    toast.success('Join link copied!')
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const fmtSeconds = (s: number) => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`

  if (!webinar) return (
    <AdminLayout>
      <div className="p-6 text-gray-400">Loading session...</div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-950">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/webinars')} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="font-semibold text-white text-sm">{webinar.title}</div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className={`capitalize px-1.5 py-0.5 rounded ${webinar.type === 'workshop' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>{webinar.type}</span>
                {webinar.status === 'live' && (
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE · {fmtTime(timer)}
                  </span>
                )}
                {webinar.status !== 'live' && <span className="capitalize text-gray-500">{webinar.status}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setTab('room')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === 'room' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Room
              </button>
              <button
                onClick={() => setTab('report')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === 'report' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Report
              </button>
            </div>

            {/* Copy join link */}
            {(webinar.status === 'live' || webinar.status === 'scheduled') && (
              <button
                onClick={copyJoinLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 text-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Share Link
              </button>
            )}
          </div>
        </div>

        {/* ── ROOM TAB ── */}
        {tab === 'room' && (
          <div className="flex-1 flex overflow-hidden">

            {/* Video Grid */}
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-auto">

              {/* Pre-live state */}
              {webinar.status === 'scheduled' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Radio className="w-8 h-8 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">Session not started yet</div>
                    <div className="text-gray-400 text-sm mt-1">Scheduled for {format(new Date(webinar.scheduledAt), 'dd MMM yyyy, hh:mm a')}</div>
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={actionLoading === 'start'}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" /> Go Live
                  </button>
                </div>
              )}

              {/* Ended state */}
              {webinar.status === 'ended' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <div className="text-white font-semibold text-lg">Session Ended</div>
                  {webinar.recordingUrl && (
                    <a
                      href={`${API_BASE}${webinar.recordingUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download Recording
                    </a>
                  )}
                  <button onClick={() => setTab('report')} className="text-violet-400 text-sm underline">View Report</button>
                </div>
              )}

              {/* Live room */}
              {webinar.status === 'live' && (
                <>
                  {/* Screen share (full width when active) */}
                  {screenOn && (
                    <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-blue-500/30">
                      <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-auto max-h-64 object-contain" />
                      <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5 text-xs text-blue-300 flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> Screen Share
                      </div>
                    </div>
                  )}

                  {/* Local (admin) camera */}
                  <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative max-h-48 border border-violet-500/30">
                    {camOn ? (
                      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <VideoOff className="w-8 h-8 mx-auto mb-1" />
                          <div className="text-xs">{adminName} (You)</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5 text-xs text-white">{adminName} (Host)</div>
                    {!micOn && <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1"><MicOff className="w-3 h-3 text-white" /></div>}
                  </div>

                  {/* Remote participants */}
                  {remoteUsers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                      Waiting for participants to join...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {remoteUsers.map(u => (
                        <div key={u.identity} className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative border border-white/5">
                          {u.hasVideo ? (
                            <video
                              key={u.identity + '-video'}
                              ref={el => { if (el && u.videoTrack) u.videoTrack.attach(el) }}
                              autoPlay playsInline className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5 text-xs text-white truncate max-w-[80%]">{u.name}</div>
                          {!u.hasAudio && <div className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5"><MicOff className="w-2.5 h-2.5 text-white" /></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Panel */}
            {webinar.status === 'live' && (
              <div className="w-72 bg-gray-900 border-l border-white/10 flex flex-col">

                {/* Controls */}
                <div className="p-3 border-b border-white/10 space-y-2">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Controls</div>

                  {/* Media */}
                  <div className="flex gap-2">
                    <button
                      onClick={toggleMic}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${micOn ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'}`}
                    >
                      {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      {micOn ? 'Mic On' : 'Mic Off'}
                    </button>
                    <button
                      onClick={toggleCam}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${camOn ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'}`}
                    >
                      {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      {camOn ? 'Cam On' : 'Cam Off'}
                    </button>
                  </div>
                  <button
                    onClick={toggleScreen}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${screenOn ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
                  >
                    {screenOn ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                    {screenOn ? 'Stop Screen Share' : 'Share Screen'}
                  </button>
                  <button
                    onClick={() => window.open('/air-drawer', '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors bg-gradient-to-r from-cyan-500/20 to-violet-600/20 text-violet-300 border border-violet-500/30 hover:from-cyan-500/30 hover:to-violet-600/30"
                    title="Open Air Drawer whiteboard in a new tab — share its tab to show attendees"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Air Drawer Whiteboard
                  </button>

                  {/* Room-wide controls */}
                  <button
                    onClick={() => setRoomControl('mutedAll', !mutedAll)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${mutedAll ? 'bg-orange-600/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                  >
                    {mutedAll ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {mutedAll ? 'Unmute All Participants' : 'Mute All Participants'}
                  </button>
                  <button
                    onClick={() => setRoomControl('camOffAll', !camOffAll)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${camOffAll ? 'bg-orange-600/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                  >
                    {camOffAll ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                    {camOffAll ? 'Allow Cameras Back' : 'Turn Off All Cameras'}
                  </button>

                  {/* End session */}
                  <button
                    onClick={handleEnd}
                    disabled={actionLoading === 'end'}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Square className="w-3.5 h-3.5" /> End Session
                  </button>

                  {/* Participants count */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Participants</span>
                    <span className="font-medium text-white">{remoteUsers.length}</span>
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-3 py-2 text-xs text-gray-400 font-medium uppercase tracking-wider border-b border-white/10 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMsgs.map(m => (
                      <div key={m.id} className={`text-xs ${m.isMe ? 'text-right' : ''}`}>
                        <span className={`font-medium ${m.isMe ? 'text-violet-400' : 'text-blue-400'}`}>{m.name}</span>
                        <span className="text-gray-500 ml-1">{m.time}</span>
                        <div className={`mt-0.5 ${m.isMe ? 'text-gray-200' : 'text-gray-300'}`}>{m.msg}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-white/10 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Send a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                    <button onClick={sendChat} className="p-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {tab === 'report' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {!report ? (
              <div className="text-gray-400">Loading report...</div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-violet-400" /> Session Report
                </h2>

                {/* Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Participants', value: report.stats.totalParticipants },
                    { label: 'Avg. Watch Time', value: fmtSeconds(report.stats.avgWatchSeconds) },
                    { label: 'Session Duration', value: fmtSeconds(report.stats.durationSeconds) },
                    { label: 'Completion Rate', value: `${report.stats.completionRate}%` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recording */}
                {report.webinar.recordingUrl && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Recording Available</div>
                      <div className="text-xs text-gray-400 mt-0.5">Saved automatically when session ended</div>
                    </div>
                    <a
                      href={`${API_BASE}${report.webinar.recordingUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                )}

                {/* Participants table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium text-sm">Participants ({report.participants.length})</span>
                  </div>
                  {report.participants.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">No participants joined this session</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Joined At</th>
                            <th className="px-4 py-3 text-left">Watch Time</th>
                            <th className="px-4 py-3 text-left">Completion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {report.participants.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                              <td className="px-4 py-3 text-gray-400">{p.email || '—'}</td>
                              <td className="px-4 py-3 text-gray-300">{format(new Date(p.joinedAt), 'hh:mm a')}</td>
                              <td className="px-4 py-3 text-gray-300">{fmtSeconds(p.watchSeconds)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-white/10 rounded-full h-1.5 max-w-[80px]">
                                    <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${p.watchPercent}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-400">{p.watchPercent}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function fmtSeconds(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}
