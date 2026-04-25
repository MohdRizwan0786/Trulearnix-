'use client'
import { useEffect, useRef, useState } from 'react'
import { meetingsAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, Video, VideoOff, Users, MessageSquare, Send,
  LogOut, X, PhoneOff, Monitor, MonitorOff, Pencil,
} from 'lucide-react'
import { Room, RoomEvent, Track, ParticipantEvent } from 'livekit-client'

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }
interface RemoteUser { identity: string; name: string; hasVideo: boolean; hasAudio: boolean; videoTrack?: any; audioTrack?: any }

function nowStr() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
function fmt(s: number) {
  return `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function MeetingRoomView({ meetingId, backPath }: { meetingId: string; backPath: string }) {
  const { user } = useAuthStore()
  const router   = useRouter()
  const isAdmin  = ['admin', 'superadmin', 'manager'].includes(user?.role || '')
  const [isHost, setIsHost] = useState(false)
  const canDraw  = isAdmin || isHost

  const roomRef      = useRef<Room | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  const [loading, setLoading]       = useState(true)
  const [micOn, setMicOn]           = useState(true)
  const [camOn, setCamOn]           = useState(true)
  const [screenOn, setScreenOn]     = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [panelTab, setPanelTab]     = useState<'participants' | 'chat'>('participants')
  const [panelOpen, setPanelOpen]   = useState(true)
  const [chatInput, setChatInput]   = useState('')
  const [chatMsgs, setChatMsgs]     = useState<ChatMsg[]>([])
  const [timer, setTimer]           = useState(0)
  const [meetingTitle, setMeetingTitle] = useState('Meeting')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    initRoom()
    return () => { roomRef.current?.disconnect() }
  }, [meetingId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  const initRoom = async () => {
    try {
      setLoading(true)
      const res  = await meetingsAPI.livekitToken(meetingId)
      const data = res.data
      if (!data.success) { toast.error(data.message || 'Failed to get token'); return }
      setMeetingTitle(data.meetingTitle || 'Meeting')
      setIsHost(!!data.isHost)

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        publishDefaults: { videoCodec: 'vp9', dtx: false, red: true },
      })
      roomRef.current = room

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        const identity = participant.identity
        const name     = participant.name || identity
        setRemoteUsers(prev => prev.find(u => u.identity === identity) ? prev : [...prev, { identity, name, hasVideo: false, hasAudio: false }])
        setChatMsgs(p => [...p, { id: Date.now(), name: 'System', msg: `${name} joined`, time: nowStr() }])

        participant.on(ParticipantEvent.TrackSubscribed, (track) => {
          const isVideo = track.kind === Track.Kind.Video
          const isAudio = track.kind === Track.Kind.Audio
          setRemoteUsers(prev => prev.map(u => u.identity === identity
            ? { ...u, hasVideo: isVideo ? true : u.hasVideo, hasAudio: isAudio ? true : u.hasAudio, videoTrack: isVideo ? track : u.videoTrack, audioTrack: isAudio ? track : u.audioTrack }
            : u))
          if (isVideo) { setTimeout(() => { const el = document.getElementById(`rv-${identity}`) as HTMLVideoElement | null; if (el) track.attach(el) }, 200) }
          if (isAudio) { const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el) }
        })

        participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
          track.detach()
          setRemoteUsers(prev => prev.map(u => u.identity === identity
            ? { ...u, hasVideo: track.kind === Track.Kind.Video ? false : u.hasVideo, hasAudio: track.kind === Track.Kind.Audio ? false : u.hasAudio }
            : u))
        })
      })

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteUsers(prev => prev.filter(u => u.identity !== participant.identity))
        setChatMsgs(p => [...p, { id: Date.now(), name: 'System', msg: `${participant.name || participant.identity} left`, time: nowStr() }])
      })

      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload))
          if (msg.type === 'chat') setChatMsgs(p => [...p, { id: Date.now(), name: msg.name, msg: msg.text, time: nowStr() }])
        } catch {}
      })

      await room.connect(data.livekitUrl, data.token)

      // Load participants already in the room before we joined
      room.remoteParticipants.forEach((participant) => {
        const identity = participant.identity
        const name     = participant.name || identity
        setRemoteUsers(prev => prev.find(u => u.identity === identity) ? prev : [...prev, { identity, name, hasVideo: false, hasAudio: false }])

        participant.on(ParticipantEvent.TrackSubscribed, (track) => {
          const isVideo = track.kind === Track.Kind.Video
          const isAudio = track.kind === Track.Kind.Audio
          setRemoteUsers(prev => prev.map(u => u.identity === identity
            ? { ...u, hasVideo: isVideo ? true : u.hasVideo, hasAudio: isAudio ? true : u.hasAudio, videoTrack: isVideo ? track : u.videoTrack, audioTrack: isAudio ? track : u.audioTrack }
            : u))
          if (isVideo) { setTimeout(() => { const el = document.getElementById(`rv-${identity}`) as HTMLVideoElement | null; if (el) track.attach(el) }, 200) }
          if (isAudio) { const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el) }
        })

        // Attach already-published tracks
        participant.trackPublications.forEach((pub) => {
          const track = pub.track
          if (!track) return
          if (track.kind === Track.Kind.Video) {
            setRemoteUsers(prev => prev.map(u => u.identity === identity ? { ...u, hasVideo: true, videoTrack: track } : u))
            setTimeout(() => { const el = document.getElementById(`rv-${identity}`) as HTMLVideoElement | null; if (el) track.attach(el) }, 300)
          }
          if (track.kind === Track.Kind.Audio) {
            setRemoteUsers(prev => prev.map(u => u.identity === identity ? { ...u, hasAudio: true, audioTrack: track } : u))
            const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el)
          }
        })
      })

      try { await room.localParticipant.setMicrophoneEnabled(true) } catch {}
      try {
        await room.localParticipant.setCameraEnabled(true)
        setTimeout(() => {
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
          if (pub?.videoTrack && localVideoRef.current) pub.videoTrack.attach(localVideoRef.current)
        }, 300)
      } catch {}

      setChatMsgs([{ id: Date.now(), name: 'System', msg: 'You joined the meeting', time: nowStr() }])
    } catch (err: any) {
      toast.error('Failed to join: ' + (err?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const toggleMic = async () => {
    try { const e = !micOn; await roomRef.current?.localParticipant.setMicrophoneEnabled(e); setMicOn(e) }
    catch { toast.error('Mic not available') }
  }
  const toggleCam = async () => {
    try {
      const e = !camOn
      await roomRef.current?.localParticipant.setCameraEnabled(e)
      if (e) setTimeout(() => {
        const pub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Camera)
        if (pub?.videoTrack && localVideoRef.current) pub.videoTrack.attach(localVideoRef.current)
      }, 100)
      setCamOn(e)
    } catch { toast.error('Camera not available') }
  }
  const toggleScreen = async () => {
    try {
      const e = !screenOn
      await roomRef.current?.localParticipant.setScreenShareEnabled(e)
      setScreenOn(e)
      if (e) {
        setTimeout(() => {
          const pub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.ScreenShare)
          if (pub?.videoTrack && localVideoRef.current) pub.videoTrack.attach(localVideoRef.current)
        }, 300)
      } else {
        // restore camera feed to local tile
        const pub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Camera)
        if (pub?.videoTrack && localVideoRef.current) pub.videoTrack.attach(localVideoRef.current)
      }
    } catch { toast.error('Screen share not available'); setScreenOn(false) }
  }
  const sendChat = async () => {
    if (!chatInput.trim() || !roomRef.current) return
    const msg = { type: 'chat', name: user?.name || 'Me', text: chatInput }
    await roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true })
    setChatMsgs(p => [...p, { id: Date.now(), name: user?.name || 'Me', msg: chatInput, time: nowStr(), isMe: true }])
    setChatInput('')
  }
  const handleLeave = async () => {
    await roomRef.current?.disconnect(); roomRef.current = null; router.push(backPath)
  }
  const handleEnd = async () => {
    if (!confirm('End meeting for everyone?')) return
    try { await meetingsAPI.end(meetingId); toast.success('Meeting ended') } catch {}
    await roomRef.current?.disconnect(); roomRef.current = null; router.push(backPath)
  }

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Joining meeting...</p>
      </div>
    </div>
  )

  const allCount = remoteUsers.length + 1

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 h-13 bg-slate-900 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-violet-400 text-xs font-bold">LIVE</span>
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-[280px]">{meetingTitle}</span>
          <span className="text-xs font-mono text-green-400 hidden sm:block">{fmt(timer)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs hidden sm:flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {allCount}</span>
          <button onClick={handleLeave}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
          {isAdmin && (
            <button onClick={handleEnd}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              <PhoneOff className="w-3.5 h-3.5" /> End Meeting
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">
        {/* Video grid */}
        <div className="flex-1 min-w-0 min-h-0 bg-black flex flex-col">
          <div className="flex-1 flex flex-col gap-2 p-3 min-h-0 overflow-auto">
            {(() => {
              const total = remoteUsers.length + 1
              const cols  = total === 1 ? 'grid-cols-1' : total === 2 ? 'grid-cols-2' : total <= 4 ? 'grid-cols-2' : total <= 6 ? 'grid-cols-3' : 'grid-cols-4'
              return (
                <div className={`grid ${cols} gap-2 flex-1`}>
                  {/* Local */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-800 min-h-0 aspect-video">
                    <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    {!camOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
                        <div className="w-14 h-14 bg-violet-500/30 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-violet-300">{(user?.name || 'U')[0].toUpperCase()}</span>
                        </div>
                        <span className="text-gray-400 text-xs">Camera off</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                      {micOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                      {user?.name || 'You'} (You)
                    </div>
                  </div>
                  {/* Remote */}
                  {remoteUsers.map((ru) => (
                    <div key={ru.identity} className="relative rounded-2xl overflow-hidden bg-slate-800 min-h-0 aspect-video">
                      <video id={`rv-${ru.identity}`} className="w-full h-full object-cover" autoPlay playsInline />
                      {!ru.hasVideo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
                          <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-300">{(ru.name || 'P')[0].toUpperCase()}</span>
                          </div>
                          <span className="text-gray-500 text-xs">Camera off</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                        {ru.hasAudio ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                        {ru.name || 'Participant'}
                      </div>
                    </div>
                  ))}
                  {remoteUsers.length === 0 && (
                    <div className="flex items-center justify-center text-gray-600 text-sm col-span-full">
                      Waiting for others to join...
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-white/5 flex-shrink-0">
            <button onClick={toggleMic}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}>
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleCam}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${camOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}>
              {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleScreen}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${screenOn ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title={screenOn ? 'Stop sharing' : 'Share screen'}>
              {screenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>
            {canDraw && (
              <button onClick={() => window.open('/air-drawer', '_blank', 'noopener,noreferrer')}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white transition-all"
                title="Open Air Drawer whiteboard in a new tab — share its tab via screen share to show students">
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => { setPanelTab('chat'); setPanelOpen(v => panelTab === 'chat' ? !v : true) }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button onClick={() => { setPanelTab('participants'); setPanelOpen(v => panelTab === 'participants' ? !v : true) }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all">
              <Users className="w-5 h-5" />
            </button>
            <button onClick={handleLeave}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white transition-all">
              <LogOut className="w-5 h-5" />
            </button>
            {isAdmin && (
              <button onClick={handleEnd}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all">
                <PhoneOff className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900/95 border-l border-white/5 min-h-0">
            <div className="flex items-center border-b border-white/5 flex-shrink-0">
              <button onClick={() => setPanelTab('participants')}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${panelTab === 'participants' ? 'text-white border-b-2 border-violet-500' : 'text-gray-500 hover:text-gray-300'}`}>
                Participants ({allCount})
              </button>
              <button onClick={() => setPanelTab('chat')}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${panelTab === 'chat' ? 'text-white border-b-2 border-violet-500' : 'text-gray-500 hover:text-gray-300'}`}>
                Chat
              </button>
              <button onClick={() => setPanelOpen(false)} className="px-3 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {panelTab === 'participants' ? (
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                <div className="flex items-center gap-2 p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{user?.name || 'You'}</p>
                    <p className="text-[10px] text-violet-400 capitalize">{user?.role} (You)</p>
                  </div>
                  <div className="flex gap-1">
                    {micOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                    {camOn ? <Video className="w-3 h-3 text-blue-400" /> : <VideoOff className="w-3 h-3 text-gray-600" />}
                  </div>
                </div>
                {remoteUsers.map((ru) => (
                  <div key={ru.identity} className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-gray-300 text-xs font-bold">
                      {(ru.name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{ru.name || 'Participant'}</p></div>
                    <div className="flex gap-1">
                      {ru.hasAudio ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                      {ru.hasVideo ? <Video className="w-3 h-3 text-blue-400" /> : <VideoOff className="w-3 h-3 text-gray-600" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {chatMsgs.map(msg => (
                    <div key={msg.id} className={msg.name === 'System' ? 'text-center' : ''}>
                      {msg.name === 'System' ? (
                        <p className="text-gray-600 text-[10px]">{msg.msg}</p>
                      ) : (
                        <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-gray-500 text-[10px] mb-0.5">{msg.name} · {msg.time}</span>
                          <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.isMe ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-200'}`}>
                            {msg.msg}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex items-center gap-2 p-3 border-t border-white/5 flex-shrink-0">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500" />
                  <button onClick={sendChat} className="p-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-white transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
