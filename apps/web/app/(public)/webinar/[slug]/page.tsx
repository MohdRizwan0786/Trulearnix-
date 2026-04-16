'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Room, RoomEvent, Track } from 'livekit-client'
import {
  Radio, Mic, MicOff, Video, VideoOff, MessageSquare, Send,
  Users, LogOut, Clock, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react'
import { format } from 'date-fns'

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://api.peptly.in/api').replace(/\/api$/, '/api')

interface WebinarInfo {
  _id: string
  title: string
  description?: string
  type: 'webinar' | 'workshop'
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  scheduledAt: string
  duration: number
  chatEnabled: boolean
}

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }
interface RemoteUser { identity: string; name: string; hasVideo: boolean; hasAudio: boolean; videoTrack?: any; audioTrack?: any }

function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

type Stage = 'loading' | 'register' | 'waiting' | 'live' | 'ended' | 'cancelled' | 'error'

export default function WebinarJoinPage() {
  const params = useParams()
  const slug = params.slug as string

  const [stage, setStage] = useState<Stage>('loading')
  const [webinar, setWebinar] = useState<WebinarInfo | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  // Room state
  const roomRef = useRef<Room | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const participantIdRef = useRef<string>('')
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const controlPollRef = useRef<NodeJS.Timeout | null>(null)

  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(true)
  const [timer, setTimer] = useState(0)
  const [participantCount, setParticipantCount] = useState(0)

  // Fetch webinar info
  useEffect(() => {
    fetchWebinarInfo()
    const t = setInterval(fetchWebinarInfo, 15000) // poll for live status
    return () => clearInterval(t)
  }, [slug])

  // Room timer
  useEffect(() => {
    if (stage !== 'live') return
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  const fetchWebinarInfo = async () => {
    try {
      const { data } = await axios.get(`${API}/webinars/join/${slug}`)
      const w: WebinarInfo = data.webinar
      setWebinar(w)

      if (w.status === 'cancelled') { setStage('cancelled'); return }
      if (w.status === 'ended') { setStage('ended'); return }
      if (stage === 'loading') {
        setStage(w.status === 'live' ? 'register' : 'register')
      }
      // If we're waiting and session just went live, prompt to join
      if (stage === 'waiting' && w.status === 'live') {
        setStage('register')
      }
    } catch (e: any) {
      if (stage === 'loading') {
        setError(e.response?.data?.message || 'Session not found')
        setStage('error')
      }
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (webinar?.status === 'scheduled') { setStage('waiting'); return }

    setJoining(true)
    setError('')
    try {
      const { data } = await axios.post(`${API}/webinars/join/${slug}/token`, {
        name: name.trim(),
        email: email.trim() || undefined,
      })
      participantIdRef.current = data.participantId
      await connectToRoom(data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  const connectToRoom = async (tokenData: any) => {
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    room.on(RoomEvent.ParticipantConnected, () => { updateRemotes(room); setParticipantCount(room.remoteParticipants.size + 1) })
    room.on(RoomEvent.ParticipantDisconnected, () => { updateRemotes(room); setParticipantCount(room.remoteParticipants.size + 1) })
    room.on(RoomEvent.TrackSubscribed, (_track, _pub, _participant) => { updateRemotes(room) })
    room.on(RoomEvent.TrackUnsubscribed, () => updateRemotes(room))
    room.on(RoomEvent.TrackMuted, () => updateRemotes(room))
    room.on(RoomEvent.TrackUnmuted, () => updateRemotes(room))
    room.on(RoomEvent.Disconnected, () => {
      setStage('ended')
      stopPing()
    })
    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.type === 'chat') {
          setChatMsgs(prev => [...prev, { id: Date.now(), name: msg.name, msg: msg.msg, time: now() }])
        }
      } catch {}
    })

    await room.connect(tokenData.livekitUrl, tokenData.token)
    setStage('live')
    setParticipantCount(room.remoteParticipants.size + 1)
    setChatMsgs([{ id: 1, name: 'System', msg: `Welcome, ${name.trim()}! You joined the session.`, time: now() }])

    // Heartbeat ping
    pingIntervalRef.current = setInterval(() => {
      axios.post(`${API}/webinars/join/${slug}/ping`, { participantId: participantIdRef.current }).catch(() => {})
    }, 30000)

    // Poll room control
    controlPollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/webinars/join/${slug}/room-control`)
        if (data.webinarStatus === 'ended') {
          setStage('ended')
          room.disconnect()
          stopPing()
          return
        }
        if (data.mutedAll && room.localParticipant.isMicrophoneEnabled) {
          await room.localParticipant.setMicrophoneEnabled(false)
          setMicOn(false)
        }
        if (data.camOffAll && room.localParticipant.isCameraEnabled) {
          await room.localParticipant.setCameraEnabled(false)
          setCamOn(false)
        }
      } catch {}
    }, 5000)
  }

  const stopPing = () => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
    if (controlPollRef.current) clearInterval(controlPollRef.current)
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
    if (newVal && localVideoRef.current) {
      const track = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.track
      track?.attach(localVideoRef.current)
    }
  }

  const sendChat = () => {
    if (!chatInput.trim() || !roomRef.current) return
    const msg = { type: 'chat', name: name.trim(), msg: chatInput.trim() }
    roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true })
    setChatMsgs(prev => [...prev, { id: Date.now(), name: name.trim(), msg: chatInput.trim(), time: now(), isMe: true }])
    setChatInput('')
  }

  const handleLeave = () => {
    stopPing()
    roomRef.current?.disconnect()
    roomRef.current = null
    setStage('ended')
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── STAGES ────────────────────────────────────────────────────────────────────

  if (stage === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading session...</div>
    </div>
  )

  if (stage === 'error') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-white text-xl font-semibold mb-2">Session Not Found</h1>
        <p className="text-gray-400 text-sm">{error || 'This link may be invalid or expired.'}</p>
      </div>
    </div>
  )

  if (stage === 'cancelled') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-white text-xl font-semibold mb-2">Session Cancelled</h1>
        <p className="text-gray-400 text-sm">This {webinar?.type || 'session'} has been cancelled by the organiser.</p>
      </div>
    </div>
  )

  if (stage === 'ended') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h1 className="text-white text-xl font-semibold mb-2">Session Ended</h1>
        <p className="text-gray-400 text-sm">Thank you for attending! The session has ended.</p>
      </div>
    </div>
  )

  if (stage === 'waiting') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-white text-xl font-semibold mb-2">{webinar?.title}</h1>
        <p className="text-gray-400 text-sm mb-1">
          Hi <span className="text-white font-medium">{name}</span>, session hasn't started yet.
        </p>
        <p className="text-gray-500 text-sm">
          Scheduled: {webinar ? format(new Date(webinar.scheduledAt), 'dd MMM yyyy, hh:mm a') : ''}
        </p>
        <p className="text-violet-400 text-xs mt-4 animate-pulse">This page will update when session goes live...</p>
      </div>
    </div>
  )

  if (stage === 'register') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Radio className="w-4 h-4" />
            <span className="capitalize">{webinar?.type}</span>
            {webinar?.status === 'live' && (
              <span className="flex items-center gap-1 text-red-400 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                LIVE NOW
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{webinar?.title}</h1>
          {webinar?.description && <p className="text-gray-400 text-sm mt-2">{webinar.description}</p>}
          {webinar?.status === 'scheduled' && (
            <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(webinar.scheduledAt), 'dd MMM yyyy, hh:mm a')} · {webinar.duration} min
            </p>
          )}
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email <span className="text-gray-600">(optional)</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl text-white font-semibold transition-colors"
          >
            {joining ? 'Joining...' : webinar?.status === 'live' ? 'Join Now' : 'Register & Wait'}
          </button>
          <p className="text-center text-xs text-gray-500">
            No account needed · Free to join
          </p>
        </form>
      </div>
    </div>
  )

  // ── LIVE ROOM ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </div>
          <span className="text-white text-sm font-semibold truncate max-w-[200px]">{webinar?.title}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{participantCount}</span>
          <span className="text-gray-500">{fmtTime(timer)}</span>
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* Video area */}
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-auto">

          {/* Host video — largest */}
          {remoteUsers.filter(u => !u.identity.startsWith('guest-')).slice(0, 1).map(host => (
            <div key={host.identity} className="bg-gray-900 rounded-xl overflow-hidden aspect-video w-full border border-violet-500/30 relative">
              {host.hasVideo ? (
                <video
                  key={host.identity + '-video'}
                  ref={el => { if (el && host.videoTrack) { host.videoTrack.attach(el) } }}
                  autoPlay playsInline className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                      {host.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">{host.name}</div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5 text-xs text-white">{host.name} · Host</div>
            </div>
          ))}

          {remoteUsers.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Waiting for the host to connect...
            </div>
          )}

          {/* Bottom controls */}
          <div className="flex items-center justify-center gap-3 py-2">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full border transition-colors ${micOn ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-red-600/20 border-red-500/30 text-red-400'}`}
              title={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleCam}
              className={`p-3 rounded-full border transition-colors ${camOn ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-red-600/20 border-red-500/30 text-red-400'}`}
              title={camOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setChatOpen(o => !o)}
              className={`p-3 rounded-full border transition-colors ${chatOpen ? 'bg-violet-600/20 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={handleLeave}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && webinar?.chatEnabled && (
          <div className="w-72 bg-gray-900 border-l border-white/10 flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 text-sm text-gray-300">
              <MessageSquare className="w-4 h-4" /> Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMsgs.map(m => (
                <div key={m.id} className={`text-xs ${m.isMe ? 'text-right' : ''}`}>
                  <span className={`font-medium ${m.isMe ? 'text-violet-400' : m.name === 'System' ? 'text-gray-500 italic' : 'text-blue-400'}`}>{m.name}</span>
                  <span className="text-gray-500 ml-1">{m.time}</span>
                  <div className="mt-0.5 text-gray-300">{m.msg}</div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-white/10 flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Send message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button onClick={sendChat} className="p-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
