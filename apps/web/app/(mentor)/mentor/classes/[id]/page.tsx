'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { classAPI, quizAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Users,
  ThumbsUp, Heart, Star, Smile, Send, Square, Copy, FileQuestion,
  Trophy, Play, X, CheckCircle2, BarChart2, Plus, Trash2, BarChart, Pencil
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Room, RoomEvent, Track, ParticipantEvent } from 'livekit-client'

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }
interface RemoteUser { identity: string; name: string; hasVideo: boolean; hasAudio: boolean; videoTrack?: any; audioTrack?: any }
type Tab = 'chat' | 'participants' | 'quiz' | 'poll'

// ── IndexedDB helpers for crash-safe recording ──────────────────────────────
const IDB_NAME = 'trulearnix-rec'
const IDB_STORE = 'chunks'

function openRecDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function idbSaveChunk(classId: string, chunk: Blob) {
  try {
    const db = await openRecDB()
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).add({ classId, chunk, ts: Date.now() })
      tx.oncomplete = () => { db.close(); res() }
      tx.onerror = () => { db.close(); rej(tx.error) }
    })
  } catch {}
}
async function idbLoadChunks(classId: string): Promise<Blob[]> {
  try {
    const db = await openRecDB()
    return await new Promise<Blob[]>((res) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).getAll()
      req.onsuccess = () => { db.close(); res((req.result || []).filter((r: any) => r.classId === classId).map((r: any) => r.chunk)) }
      req.onerror = () => { db.close(); res([]) }
    })
  } catch { return [] }
}
async function idbClearChunks(classId: string) {
  try {
    const db = await openRecDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    const req = store.openCursor()
    req.onsuccess = (e: any) => {
      const c = e.target.result
      if (c) { if (c.value.classId === classId) c.delete(); c.continue() }
      else db.close()
    }
  } catch {}
}

export default function MentorClassRoom({ params }: { params: { id: string } }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const roomRef = useRef<Room | null>(null)
  const localVideoTrackRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localScreenTrackRef = useRef<any>(null)
  const localVideoContainerRef = useRef<HTMLVideoElement>(null)
  const pipCameraRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])

  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [mutedStudents, setMutedStudents] = useState<Set<string>>(new Set())
  const [hiddenVideos, setHiddenVideos] = useState<Set<string>>(new Set())
  const [allMicMuted, setAllMicMuted] = useState(false)
  const [allCamHidden, setAllCamHidden] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [panelOpen, setPanelOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: 1, name: 'System', msg: '🎉 Class started! Students can now join.', time: now() }
  ])
  const [timer, setTimer] = useState(0)
  const [showReactions, setShowReactions] = useState(false)
  const [flyingReaction, setFlyingReaction] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [classEnded, setClassEnded] = useState(false)
  const [recordingSaved, setRecordingSaved] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const [rejoining, setRejoining] = useState(false)
  const [leftTemporarily, setLeftTemporarily] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [quizScores, setQuizScores] = useState<{ name: string; score: number }[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [activePoll, setActivePoll] = useState<any>(null)
  const [pollTotal, setPollTotal] = useState(0)
  const pollIntervalRef = useRef<any>(null)

  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['livekit-token-mentor', params.id],
    queryFn: () => classAPI.livekitToken(params.id).then(r => r.data),
    retry: false,
    staleTime: Infinity,       // never refetch automatically
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const { data: quizzesData } = useQuery({
    queryKey: ['class-quizzes', params.id],
    queryFn: () => classAPI.quizzes(params.id).then(r => r.data),
  })

  const endMutation = useMutation({
    mutationFn: () => classAPI.end(params.id),
    onSuccess: async () => {
      // Disconnect from room if still connected
      if (roomRef.current) await leaveChannel()
      setLeftTemporarily(false)
      setDisconnected(false)
      setClassEnded(true)
      classAPI.summary(params.id).catch(() => {})
      setIsUploading(true)
      classAPI.stopEgress(params.id)
        .then(() => { setRecordingSaved(true); setIsUploading(false) })
        .catch(e => { console.warn('Egress stop:', e?.response?.data?.message || e?.message); setRecordingSaved(true); setIsUploading(false) })
    }
  })

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])
  useEffect(() => {
    if (!tokenData?.livekitUrl || !tokenData?.token) return
    if (roomRef.current) return   // already connected, don't reinit
    initLiveKit(tokenData)
  }, [tokenData])

  // Poll for admin presence
  useEffect(() => {
    let prevAdmin = false
    const interval = setInterval(async () => {
      try {
        const res = await classAPI.getRoomControl(params.id).then((r: any) => r.data)
        if (res.adminInRoom && !prevAdmin) {
          prevAdmin = true
          const name = res.adminName || 'Admin'
          toast(`🛡️ ${name} has joined as observer`, { duration: 5000, icon: '👁️' })
          addSysMsg(`🛡️ ${name} (Admin) is now observing this class`)
        } else if (!res.adminInRoom && prevAdmin) {
          prevAdmin = false
          addSysMsg('Admin has left the class')
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const initLiveKit = async (data: any) => {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 2560, height: 1440, frameRate: 30 }, // 2K
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
        publishDefaults: {
          videoCodec: 'vp9',
          videoEncoding: { maxBitrate: 8_000_000, maxFramerate: 30 },
          audioPreset: { maxBitrate: 320_000 }, // 320kbps — best audio
          dtx: false,   // disable discontinuous transmission for constant audio quality
          red: true,    // redundant audio encoding — reduces packet loss artifacts
          simulcast: true,
        },
      })
      roomRef.current = room

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        const identity = participant.identity
        const name = participant.name || identity
        setRemoteUsers(prev => prev.find(u => u.identity === identity) ? prev : [...prev, { identity, name, hasVideo: false, hasAudio: false }])
        addSysMsg(`👋 ${name} joined`)

        participant.on(ParticipantEvent.TrackSubscribed, (track, pub) => {
          const isVideo = track.kind === Track.Kind.Video
          const isAudio = track.kind === Track.Kind.Audio
          setRemoteUsers(prev => prev.map(u => u.identity === identity
            ? { ...u, hasVideo: isVideo ? true : u.hasVideo, hasAudio: isAudio ? true : u.hasAudio, videoTrack: isVideo ? track : u.videoTrack, audioTrack: isAudio ? track : u.audioTrack }
            : u))
          if (isVideo) setTimeout(() => { const el = document.getElementById(`rv-${identity}`) as HTMLVideoElement | null; if (el) track.attach(el) }, 200)
          if (isAudio && !mutedStudents.has(identity)) { const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el) }
        })

        participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
          track.detach()
          const isVideo = track.kind === Track.Kind.Video
          const isAudio = track.kind === Track.Kind.Audio
          setRemoteUsers(prev => prev.map(u => u.identity === identity
            ? { ...u, hasVideo: isVideo ? false : u.hasVideo, hasAudio: isAudio ? false : u.hasAudio, videoTrack: isVideo ? undefined : u.videoTrack, audioTrack: isAudio ? undefined : u.audioTrack }
            : u))
        })
      })

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteUsers(prev => prev.filter(u => u.identity !== participant.identity))
        addSysMsg(`${participant.name || participant.identity} left`)
      })

      room.on(RoomEvent.Disconnected, () => {
        if (!classEnded) {
          setJoined(false)
          setDisconnected(true)
        }
      })

      await room.connect(data.livekitUrl, data.token)

      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        const audioPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
        if (audioPub?.audioTrack) localAudioTrackRef.current = audioPub.audioTrack
      } catch { setMicOn(false); toast('⚠️ Mic not found', { duration: 2000 }) }

      try {
        await room.localParticipant.setCameraEnabled(true)
        const videoPub = room.localParticipant.getTrackPublication(Track.Source.Camera)
        if (videoPub?.videoTrack) {
          localVideoTrackRef.current = videoPub.videoTrack
          setTimeout(() => { if (localVideoContainerRef.current) videoPub.videoTrack!.attach(localVideoContainerRef.current) }, 100)
        }
      } catch { setCamOn(false); toast('⚠️ Camera not found', { duration: 2000 }) }

      setJoined(true)
      addSysMsg('✅ You are live!')

      // Start server-side egress recording
      classAPI.startEgress(params.id).catch(e => console.warn('Egress start failed:', e?.response?.data?.message || e?.message))
    } catch (err: any) { toast.error('Connection error: ' + (err?.message || 'Unknown')) }
  }

  const leaveChannel = async () => {
    await roomRef.current?.disconnect()
    roomRef.current = null
  }

  const leaveTemporarily = async () => {
    await leaveChannel()
    setJoined(false)
    setLeftTemporarily(true)
  }

  const rejoin = async () => {
    setRejoining(true)
    setDisconnected(false)
    setLeftTemporarily(false)
    try {
      // Fetch a fresh token for reconnection
      const freshData = await classAPI.livekitToken(params.id).then((r: any) => r.data)
      roomRef.current = null  // ensure initLiveKit runs fresh
      await initLiveKit(freshData)
    } catch { setDisconnected(true) }
    finally { setRejoining(false) }
  }

  const startRecording = async () => {
    try {
      const mediaTracks: MediaStreamTrack[] = []
      const room = roomRef.current
      if (room) {
        const videoPub = room.localParticipant.getTrackPublication(Track.Source.Camera)
        const audioPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
        if (videoPub?.videoTrack?.mediaStreamTrack) mediaTracks.push(videoPub.videoTrack.mediaStreamTrack)
        if (audioPub?.audioTrack?.mediaStreamTrack) mediaTracks.push(audioPub.audioTrack.mediaStreamTrack)
      }
      if (mediaTracks.length === 0) return

      // Load any chunks saved before a refresh/crash
      const saved = await idbLoadChunks(params.id)
      if (saved.length > 0) {
        recordingChunksRef.current = saved
        toast('🔄 Resuming recording from before refresh', { duration: 3000 })
      } else {
        recordingChunksRef.current = []
      }

      const stream = new MediaStream(mediaTracks)
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
      const opts: MediaRecorderOptions = { videoBitsPerSecond: 1_000_000 }
      if (mimeType) opts.mimeType = mimeType
      const recorder = new MediaRecorder(stream, opts)
      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data)
          await idbSaveChunk(params.id, e.data) // persist so refresh doesn't lose it
        }
      }
      recorder.start(10000) // collect every 10s, persist each chunk
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (e) { console.warn('Recording not supported or failed to start', e) }
  }

  const stopAndUploadRecording = (): Promise<void> => new Promise((resolve) => {
    const recorder = mediaRecorderRef.current

    const doUpload = async () => {
      // Also load any chunks that were saved to IndexedDB but not in memory
      // (e.g. from before a refresh earlier in the session)
      const idbChunks = await idbLoadChunks(params.id)
      // Merge: idb has all saved chunks; in-memory may have new ones not yet in idb
      // Since we write to idb on every ondataavailable, idbChunks should be complete
      const chunks = idbChunks.length > 0 ? idbChunks : recordingChunksRef.current
      if (chunks.length === 0) { resolve(); return }
      const blob = new Blob(chunks, { type: 'video/webm' })
      if (blob.size < 50000) { await idbClearChunks(params.id); resolve(); return }
      setIsUploading(true)
      setUploadProgress(0)
      try {
        const fd = new FormData()
        fd.append('recording', blob, `class-${params.id}.webm`)
        await classAPI.uploadRecording(params.id, fd, (pct) => setUploadProgress(pct))
        await idbClearChunks(params.id)
        toast.success('Recording saved!')
      } catch (uploadErr: any) {
        const msg = uploadErr?.response?.data?.message || uploadErr?.message || 'Unknown error'
        toast.error(`Recording upload failed: ${msg}`)
        console.error('Recording upload error:', uploadErr)
        // Don't clear IndexedDB — chunks survive for a retry
      } finally {
        setIsUploading(false)
        resolve()
      }
    }

    if (!recorder || recorder.state === 'inactive') {
      // Recorder never started or already stopped — still try to upload from IndexedDB
      doUpload()
      return
    }
    recorder.onstop = () => doUpload()
    recorder.stop()
    setIsRecording(false)
  })

  function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  function addSysMsg(msg: string) { setChatMsgs(p => [...p, { id: Date.now(), name: 'System', msg, time: now() }]) }
  function fmt(s: number) { return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

  const toggleMic = async () => {
    try {
      const room = roomRef.current
      if (!room) return
      const enabled = !micOn
      await room.localParticipant.setMicrophoneEnabled(enabled)
      setMicOn(enabled)
    } catch { toast.error('Microphone not available') }
  }

  const toggleCam = async () => {
    try {
      const room = roomRef.current
      if (!room) return
      const enabled = !camOn
      await room.localParticipant.setCameraEnabled(enabled)
      if (enabled) {
        setTimeout(() => {
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
          if (pub?.videoTrack && localVideoContainerRef.current) pub.videoTrack.attach(localVideoContainerRef.current)
        }, 100)
      }
      setCamOn(enabled)
    } catch { toast.error('Camera not available') }
  }

  const toggleScreenShare = async () => {
    const room = roomRef.current
    if (!room) return
    if (screenSharing) {
      await room.localParticipant.setScreenShareEnabled(false)
      // Restore camera to main container
      setTimeout(() => {
        const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
        if (pub?.videoTrack && localVideoContainerRef.current) pub.videoTrack.attach(localVideoContainerRef.current)
      }, 100)
      setScreenSharing(false)
      toast('Screen sharing stopped')
    } else {
      try {
        await room.localParticipant.setScreenShareEnabled(true, {
          resolution: { width: 1920, height: 1080, frameRate: 15 },
          contentHint: 'detail',  // optimized for text/slides (sharp, not motion-blurred)
        })
        setTimeout(() => {
          const screenPub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare)
          if (screenPub?.videoTrack && localVideoContainerRef.current) screenPub.videoTrack.attach(localVideoContainerRef.current)
          if (camOn) {
            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera)
            if (camPub?.videoTrack && pipCameraRef.current) camPub.videoTrack.attach(pipCameraRef.current)
          }
        }, 150)
        setScreenSharing(true)
        toast.success('Screen sharing started')
        // Auto-stop when user closes browser share dialog
        room.localParticipant.on(ParticipantEvent.LocalTrackUnpublished, (pub) => {
          if (pub.source === Track.Source.ScreenShare && screenSharing) setScreenSharing(false)
        })
      } catch { toast.error('Screen share cancelled or not supported') }
    }
  }

  const muteStudent = (identity: string) => {
    const ru = remoteUsers.find(u => u.identity === identity)
    if (!ru) return
    if (mutedStudents.has(identity)) {
      ru.audioTrack?.attach()
      setMutedStudents(prev => { const s = new Set(prev); s.delete(identity); return s })
      toast('🔊 Student unmuted')
    } else {
      ru.audioTrack?.detach()
      setMutedStudents(prev => { const s = new Set(prev); s.add(identity); return s })
      toast('🔇 Student muted')
    }
  }

  const hideStudentCam = (identity: string) => {
    const ru = remoteUsers.find(u => u.identity === identity)
    if (!ru) return
    if (hiddenVideos.has(identity)) {
      const el = document.getElementById(`rv-${identity}`) as HTMLVideoElement | null
      if (el) ru.videoTrack?.attach(el)
      setHiddenVideos(prev => { const s = new Set(prev); s.delete(identity); return s })
      toast('📷 Student camera shown')
    } else {
      ru.videoTrack?.detach()
      setHiddenVideos(prev => { const s = new Set(prev); s.add(identity); return s })
      toast('🚫 Student camera hidden')
    }
  }

  const toggleMuteAll = async () => {
    if (allMicMuted) {
      remoteUsers.forEach(ru => { if (ru.audioTrack) ru.audioTrack.attach() })
      setMutedStudents(new Set())
      setAllMicMuted(false)
      await classAPI.setRoomControl(params.id, { mutedAll: false }).catch(() => {})
      toast.success('🔊 All students unmuted')
      addSysMsg('🔊 All students unmuted')
    } else {
      remoteUsers.forEach(ru => { if (ru.audioTrack) ru.audioTrack.detach() })
      setMutedStudents(new Set(remoteUsers.map(ru => ru.identity)))
      setAllMicMuted(true)
      await classAPI.setRoomControl(params.id, { mutedAll: true }).catch(() => {})
      toast.success('🔇 All students muted')
      addSysMsg('🔇 All students muted by mentor')
    }
  }

  const toggleHideAllCams = async () => {
    if (allCamHidden) {
      remoteUsers.forEach(ru => {
        if (ru.videoTrack) {
          const el = document.getElementById(`rv-${ru.identity}`) as HTMLVideoElement | null
          if (el) ru.videoTrack.attach(el)
        }
      })
      setHiddenVideos(new Set())
      setAllCamHidden(false)
      await classAPI.setRoomControl(params.id, { camOffAll: false }).catch(() => {})
      toast.success('📷 All cameras shown')
      addSysMsg('📷 All cameras shown')
    } else {
      remoteUsers.forEach(ru => { if (ru.videoTrack) ru.videoTrack.detach() })
      setHiddenVideos(new Set(remoteUsers.filter(ru => ru.hasVideo).map(ru => ru.identity)))
      setAllCamHidden(true)
      await classAPI.setRoomControl(params.id, { camOffAll: true }).catch(() => {})
      toast.success('🚫 All cameras stopped')
      addSysMsg('🚫 All cameras stopped by mentor')
    }
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMsgs(p => [...p, { id: Date.now(), name: user?.name || 'Mentor', msg: chatInput, time: now(), isMe: true }])
    setChatInput('')
  }

  const launchQuiz = async (quiz: any) => {
    try {
      const full = await quizAPI.get(quiz._id).then(r => r.data.quiz)
      setActiveQuiz(full)
      setShowLeaderboard(false)
      setActiveTab('quiz')
      toast.success(`Quiz "${quiz.title}" launched!`)
      addSysMsg(`📝 Quiz launched: ${quiz.title}`)
    } catch { toast.error('Could not load quiz') }
  }

  // Poll — refresh live results every 3s when active
  useEffect(() => {
    if (!activePoll) { clearInterval(pollIntervalRef.current); return }
    const refresh = async () => {
      try {
        const res = await classAPI.getPoll(params.id).then((r: any) => r.data)
        if (res.poll) { setActivePoll(res.poll); setPollTotal(res.total || 0) }
      } catch {}
    }
    pollIntervalRef.current = setInterval(refresh, 3000)
    return () => clearInterval(pollIntervalRef.current)
  }, [activePoll?.id])

  const createPoll = async () => {
    const opts = pollOptions.filter(o => o.trim())
    if (!pollQuestion.trim() || opts.length < 2) {
      toast.error('Add a question and at least 2 options'); return
    }
    try {
      const res = await classAPI.createPoll(params.id, { question: pollQuestion.trim(), options: opts }).then((r: any) => r.data)
      setActivePoll(res.poll)
      setPollTotal(0)
      setPollQuestion('')
      setPollOptions(['', ''])
      setActiveTab('poll')
      toast.success('Poll launched!')
      addSysMsg('📊 Poll launched by mentor')
    } catch { toast.error('Failed to create poll') }
  }

  const endPoll = async () => {
    try {
      await classAPI.endPoll(params.id)
      setActivePoll((p: any) => p ? { ...p, active: false } : null)
      addSysMsg('📊 Poll ended')
    } catch {}
  }

  if (isLoading) return (
    <div className="h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Setting up classroom...</p>
      </div>
    </div>
  )

  // Class fully ended — show Mark as Complete (must be before leftTemporarily check)
  if (classEnded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-900 gap-6 p-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Square className="w-8 h-8 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Class Ended</h2>
          <p className="text-gray-400 text-sm">
            {isUploading ? 'Saving recording, please wait...' : recordingSaved ? 'Recording saved successfully!' : 'Class has been ended.'}
          </p>
        </div>
        {isUploading && (
          <div className="flex items-center gap-3 text-yellow-400">
            <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Saving recording...</span>
          </div>
        )}
        {recordingSaved && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
            Recording saved
          </div>
        )}
        <button
          onClick={() => router.push('/mentor/classes')}
          disabled={isUploading}
          className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-wait text-white font-semibold text-sm transition-colors">
          {isUploading ? 'Please wait...' : 'Mark as Complete'}
        </button>
      </div>
    )
  }

  // Temporarily left — rejoin or end
  if (leftTemporarily || disconnected) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-900 gap-6 p-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Square className="w-8 h-8 text-yellow-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {disconnected ? 'Connection Lost' : 'You Left the Class'}
          </h2>
          <p className="text-gray-400 text-sm">
            {disconnected ? 'You were disconnected. Class is still running for students.' : 'Class is still running. Students are still in the room.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={rejoin}
            disabled={rejoining}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {rejoining
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rejoining...</>
              : 'Rejoin Class'}
          </button>
          <button
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            End Class
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden">

      {flyingReaction && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl z-50 pointer-events-none animate-bounce">{flyingReaction}</div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 sm:px-5 h-12 landscape:h-10 bg-dark-800 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="/" />
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${joined ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="text-white font-semibold text-sm truncate max-w-[160px]">{tokenData?.classTitle || 'Live Class'}</span>
            {joined && <span className="hidden sm:block text-xs font-mono text-green-400">{fmt(timer)}</span>}
          {isRecording && <span className="hidden sm:flex items-center gap-1 text-xs text-red-400"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />REC</span>}
          {isUploading && <span className="hidden sm:flex items-center gap-1 text-xs text-yellow-400">Saving {uploadProgress}%</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/student/classes/${params.id}`); toast.success('Invite link copied!') }}
            className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 px-2.5 py-1.5 rounded-lg">
            <Copy className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={leaveTemporarily}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg">
            Leave
          </button>
          <button onClick={() => endMutation.mutate()} disabled={endMutation.isPending}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            <Square className="w-3 h-3" /> End
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">

        {/* Video — always visible, panel overlays on mobile/landscape */}
        <div className="flex-1 min-w-0 min-h-0 bg-black flex flex-col">
          {!joined ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Connecting to classroom...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1 p-1 min-h-0 overflow-hidden">
              {/* Main video area */}
              <div className="flex-1 relative rounded-xl overflow-hidden bg-dark-900 min-h-0">

                {/* Main container — screen share OR camera */}
                <video ref={localVideoContainerRef} className="w-full h-full object-cover" autoPlay playsInline muted />

                {/* No cam + no screen = avatar placeholder */}
                {!camOn && !screenSharing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800 gap-3">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-600/30 to-purple-600/30 rounded-full flex items-center justify-center border border-primary-500/20">
                      <span className="text-4xl font-bold text-primary-400">{user?.name?.[0]}</span>
                    </div>
                    <p className="text-gray-500 text-sm">Camera is off</p>
                  </div>
                )}

                {/* Screen share label */}
                {screenSharing && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    <Monitor className="w-3 h-3" /> Screen sharing
                  </div>
                )}

                {/* Bottom-left label */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-xl">
                  <div className={`w-1.5 h-1.5 rounded-full ${micOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {user?.name} · Host
                </div>

                {/* Top-right status badges */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {!micOn && (
                    <div className="bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <MicOff className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white">Muted</span>
                    </div>
                  )}
                </div>

                {/* PiP camera — shows when screen sharing AND camera is on */}
                {screenSharing && camOn && (
                  <div className="absolute bottom-3 right-3 w-36 h-24 sm:w-48 sm:h-32 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-dark-800">
                    <video ref={pipCameraRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <div className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                      Camera
                    </div>
                  </div>
                )}
              </div>

              {/* Remote students */}
              {remoteUsers.length > 0 && (
                <div className="flex gap-1 h-32 flex-shrink-0 overflow-x-auto">
                  {remoteUsers.map((ru, i) => (
                    <div key={ru.identity} className="relative rounded-xl overflow-hidden bg-dark-700 flex-shrink-0 w-44">
                      <video id={`rv-${ru.identity}`} className="w-full h-full object-cover" autoPlay playsInline muted />
                      {hiddenVideos.has(ru.identity) && (
                        <div className="absolute inset-0 bg-dark-800 flex flex-col items-center justify-center gap-1">
                          <VideoOff className="w-5 h-5 text-gray-500" />
                          <span className="text-[10px] text-gray-500">Cam off</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                        <span className="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded truncate flex-1">{ru.name || `Student ${i + 1}`}</span>
                        <div className="flex gap-0.5">
                          <button onClick={() => muteStudent(ru.identity)} title={mutedStudents.has(ru.identity) ? 'Unmute' : 'Mute mic'}
                            className={`p-0.5 rounded ${mutedStudents.has(ru.identity) ? 'bg-red-500/90' : 'bg-black/60 hover:bg-red-500/70'}`}>
                            {mutedStudents.has(ru.identity) ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-white" />}
                          </button>
                          {ru.hasVideo && (
                            <button onClick={() => hideStudentCam(ru.identity)} title={hiddenVideos.has(ru.identity) ? 'Show cam' : 'Hide cam'}
                              className={`p-0.5 rounded ${hiddenVideos.has(ru.identity) ? 'bg-red-500/90' : 'bg-black/60 hover:bg-red-500/70'}`}>
                              {hiddenVideos.has(ru.identity) ? <VideoOff className="w-3 h-3 text-white" /> : <Video className="w-3 h-3 text-white" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel — overlay on mobile/landscape, sidebar on desktop */}
        {panelOpen && (
          <div className="absolute sm:relative inset-y-0 right-0 z-20 w-72 landscape:w-64 lg:w-80 flex-shrink-0 flex flex-col bg-dark-800/95 landscape:bg-dark-800/90 backdrop-blur-sm border-l border-white/5 min-h-0 shadow-2xl sm:shadow-none">
            {/* Tabs */}
            <div className="flex border-b border-white/5 flex-shrink-0 overflow-x-auto">
              {([
                { key: 'chat', icon: MessageSquare, label: 'Chat' },
                { key: 'participants', icon: Users, label: 'Students' },
                { key: 'poll', icon: BarChart2, label: 'Poll' },
                { key: 'quiz', icon: FileQuestion, label: 'Quiz' },
              ] as { key: Tab; icon: any; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${activeTab === t.key ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
              <button onClick={() => setPanelOpen(false)} className="px-2.5 text-gray-500 hover:text-white sm:hidden flex-shrink-0">✕</button>
            </div>

            {/* Chat */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {chatMsgs.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && <span className="text-[11px] text-gray-500 mb-0.5 px-1">{msg.name}</span>}
                      <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                        msg.name === 'System' ? 'bg-primary-500/10 text-primary-300 text-xs w-full text-center' :
                        msg.isMe ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-200'}`}>{msg.msg}</div>
                      <span className="text-[10px] text-gray-600 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex-shrink-0">
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Message students..." className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50" />
                    <button onClick={sendChat} className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-xl flex-shrink-0"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}

            {/* Participants */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">

                {/* Bulk controls */}
                {remoteUsers.length > 0 && (
                  <div className="flex gap-2 mb-1">
                    <button onClick={toggleMuteAll}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 border text-xs font-semibold rounded-xl transition-colors ${
                        allMicMuted
                          ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25'
                          : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                      }`}>
                      {allMicMuted ? <><Mic className="w-3.5 h-3.5" /> Unmute All</> : <><MicOff className="w-3.5 h-3.5" /> Mute All</>}
                    </button>
                    <button onClick={toggleHideAllCams}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 border text-xs font-semibold rounded-xl transition-colors ${
                        allCamHidden
                          ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25'
                          : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                      }`}>
                      {allCamHidden ? <><Video className="w-3.5 h-3.5" /> Show Cams</> : <><VideoOff className="w-3.5 h-3.5" /> Stop Cams</>}
                    </button>
                  </div>
                )}

                {/* Mentor */}
                <div className="flex items-center gap-3 p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{user?.name?.[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{user?.name}</p><p className="text-xs text-primary-400">You (Mentor)</p></div>
                  <div className="flex gap-1 flex-shrink-0">
                    {micOn ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                    {camOn ? <Video className="w-3.5 h-3.5 text-green-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
                {/* Students */}
                {remoteUsers.map((ru, i) => (
                  <div key={ru.identity} className="bg-dark-700/50 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{ru.name || `Student ${i + 1}`}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {ru.hasAudio && <span className="text-[10px] text-green-400 flex items-center gap-0.5"><Mic className="w-2.5 h-2.5" />Mic on</span>}
                          {ru.hasVideo && <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><Video className="w-2.5 h-2.5" />Cam on</span>}
                          {!ru.hasAudio && !ru.hasVideo && <span className="text-[10px] text-gray-500">Watching</span>}
                        </div>
                      </div>
                    </div>
                    {/* Controls row */}
                    <div className="flex gap-1.5">
                      <button onClick={() => muteStudent(ru.identity)} title={mutedStudents.has(ru.identity) ? 'Unmute mic' : 'Mute mic'}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          mutedStudents.has(ru.identity)
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-dark-600 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5'
                        }`}>
                        {mutedStudents.has(ru.identity) ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        {mutedStudents.has(ru.identity) ? 'Muted' : 'Mic'}
                      </button>
                      <button onClick={() => hideStudentCam(ru.identity)} title={hiddenVideos.has(ru.identity) ? 'Show camera' : 'Hide camera'}
                        disabled={!ru.hasVideo}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          hiddenVideos.has(ru.identity)
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-dark-600 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5'
                        }`}>
                        {hiddenVideos.has(ru.identity) ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                        {hiddenVideos.has(ru.identity) ? 'Cam off' : 'Cam'}
                      </button>
                    </div>
                  </div>
                ))}
                {remoteUsers.length === 0 && (
                  <div className="text-center py-8 space-y-1">
                    <Users className="w-8 h-8 text-gray-700 mx-auto" />
                    <p className="text-xs text-gray-600">No students have joined yet</p>
                    <p className="text-[11px] text-gray-700">Students with mic/cam on will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* Poll */}
            {activeTab === 'poll' && (
              <div className="flex-1 overflow-y-auto p-3 min-h-0 space-y-3">
                {activePoll ? (
                  /* Live poll results */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-snug">{activePoll.question}</p>
                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${activePoll.active ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${activePoll.active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                          {activePoll.active ? `Live · ${pollTotal} vote${pollTotal !== 1 ? 's' : ''}` : `Ended · ${pollTotal} votes`}
                        </p>
                      </div>
                      {activePoll.active && (
                        <button onClick={endPoll}
                          className="ml-2 p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex-shrink-0 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Results bars */}
                    <div className="space-y-2">
                      {activePoll.options.map((opt: any, i: number) => {
                        const pct = pollTotal > 0 ? Math.round((opt.votes / pollTotal) * 100) : 0
                        const isLeading = opt.votes === Math.max(...activePoll.options.map((o: any) => o.votes)) && opt.votes > 0
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-medium ${isLeading ? 'text-primary-400' : 'text-gray-300'}`}>{opt.text}</span>
                              <span className={`font-bold ${isLeading ? 'text-primary-400' : 'text-gray-400'}`}>{pct}% <span className="text-gray-600 font-normal">({opt.votes})</span></span>
                            </div>
                            <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-primary-500' : 'bg-dark-400'}`}
                                style={{ width: `${pct}%`, background: isLeading ? undefined : '#2d3748' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {!activePoll.active && (
                      <button onClick={() => { setActivePoll(null); setPollQuestion(''); setPollOptions(['', '']) }}
                        className="w-full py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-sm font-semibold rounded-xl transition-colors">
                        Create New Poll
                      </button>
                    )}
                  </div>
                ) : (
                  /* Create poll form */
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Create Poll</p>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Question</label>
                      <textarea
                        value={pollQuestion}
                        onChange={e => setPollQuestion(e.target.value)}
                        placeholder="Ask your students something..."
                        rows={2}
                        className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 block">Options</label>
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={opt}
                            onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o) }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                          />
                          {pollOptions.length > 2 && (
                            <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <button onClick={() => setPollOptions([...pollOptions, ''])}
                          className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 py-1">
                          <Plus className="w-3.5 h-3.5" /> Add option
                        </button>
                      )}
                    </div>
                    <button onClick={createPoll}
                      disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                      className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                      <BarChart className="w-4 h-4" /> Launch Poll
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz */}
            {activeTab === 'quiz' && (
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {showLeaderboard && activeQuiz ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard</h3>
                      <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    {quizScores.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No submissions yet</p>
                    ) : (
                      quizScores.sort((a, b) => b.score - a.score).map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-dark-700 rounded-xl">
                          <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>{i + 1}</span>
                          <div className="flex-1"><p className="text-sm text-white">{s.name}</p></div>
                          <span className="text-sm font-bold text-primary-400">{s.score}%</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : activeQuiz ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">{activeQuiz.title}</p>
                        <p className="text-xs text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live — {activeQuiz.questions?.length} questions</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setShowLeaderboard(true)} className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"><Trophy className="w-4 h-4" /></button>
                        <button onClick={() => { setActiveQuiz(null); addSysMsg('Quiz ended') }} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {activeQuiz.questions?.map((q: any, i: number) => (
                        <div key={i} className="bg-dark-700 rounded-xl p-3">
                          <p className="text-sm text-white mb-2 font-medium">Q{i + 1}. {q.question}</p>
                          <div className="space-y-1">
                            {q.options?.map((opt: string, j: number) => (
                              <div key={j} className={`text-xs px-2 py-1.5 rounded-lg flex items-center gap-2 ${j === q.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-gray-400'}`}>
                                {j === q.correctOption && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{q.marks} marks</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-3">Launch a quiz for students to answer live</p>
                    {quizzesData?.quizzes?.length === 0 && (
                      <p className="text-xs text-gray-600 text-center py-6">No quizzes linked to this course</p>
                    )}
                    {quizzesData?.quizzes?.map((q: any) => (
                      <div key={q._id} className="bg-dark-700 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileQuestion className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{q.title}</p>
                          <p className="text-xs text-gray-500">{q.questions?.length} questions</p>
                        </div>
                        <button onClick={() => launchQuiz(q)}
                          className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0">
                          <Play className="w-3 h-3" /> Launch
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14 landscape:h-10 bg-dark-800 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <TBtn active={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label="Mic" offCls="bg-red-500/20 text-red-400" />
          <TBtn active={camOn} onClick={toggleCam} icon={camOn ? Video : VideoOff} label="Cam" offCls="bg-red-500/20 text-red-400" />
          <TBtn active={!screenSharing} onClick={toggleScreenShare} icon={screenSharing ? MonitorOff : Monitor} label="Share" offCls="bg-blue-500/20 text-blue-400" />
          {/* AirDrawer (gesture whiteboard) — opens in a new tab; mentor screen-shares that tab */}
          <button onClick={() => window.open('/air-drawer', '_blank', 'noopener,noreferrer')}
            className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors bg-gradient-to-br from-cyan-500/20 to-violet-600/20 text-violet-300 hover:from-cyan-500/30 hover:to-violet-600/30"
            title="Open Air Drawer whiteboard in a new tab — share its tab to show students">
            <Pencil className="w-5 h-5" />
            <span className="hidden sm:block text-[10px]">Draw</span>
          </button>
          {/* Mute All / Unmute All */}
          <button onClick={toggleMuteAll}
            className={`flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors ${
              allMicMuted ? 'bg-red-500/20 text-red-400' : 'bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-gray-400'
            }`}>
            {allMicMuted
              ? <><Mic className="w-5 h-5" /><span className="hidden sm:block text-[10px]">Unmute All</span></>
              : <><MicOff className="w-5 h-5" /><span className="hidden sm:block text-[10px]">Mute All</span></>
            }
          </button>
          {/* Stop All Cams / Show All Cams */}
          <button onClick={toggleHideAllCams}
            className={`flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors ${
              allCamHidden ? 'bg-red-500/20 text-red-400' : 'bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-gray-400'
            }`}>
            {allCamHidden
              ? <><Video className="w-5 h-5" /><span className="hidden sm:block text-[10px]">Show Cams</span></>
              : <><VideoOff className="w-5 h-5" /><span className="hidden sm:block text-[10px]">Stop Cams</span></>
            }
          </button>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowReactions(v => !v)} className="flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-dark-700 hover:bg-white/10 text-yellow-400 transition-colors">
              <Smile className="w-5 h-5" />
              <span className="hidden sm:block text-[10px] text-gray-400">React</span>
            </button>
            {showReactions && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-dark-700 rounded-2xl p-3 flex gap-3 border border-white/10 shadow-xl z-50">
                {[['👍','L'],['❤️','V'],['😂','F'],['🎉','P'],['⭐','S'],['🔥','R']].map(([e]) => (
                  <button key={e} onClick={() => { setFlyingReaction(e); setTimeout(() => setFlyingReaction(null), 1500); setShowReactions(false) }} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setPanelOpen(v => !v); if (!panelOpen) setActiveTab('chat') }}
            className={`flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors ${panelOpen ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:block text-[10px]">Panel</span>
          </button>
          <button onClick={() => { setActiveTab('poll'); setPanelOpen(true) }}
            className={`flex flex-col items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-colors relative ${activeTab === 'poll' && panelOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}`}>
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block landscape:hidden text-[10px]">Poll</span>
            {activePoll?.active && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full" />}
          </button>
          <button onClick={() => { setActiveTab('quiz'); setPanelOpen(true) }}
            className={`flex flex-col items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-colors ${activeTab === 'quiz' && panelOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}`}>
            <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block landscape:hidden text-[10px]">Quiz</span>
          </button>
        </div>

        <button onClick={leaveTemporarily}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-gray-300 font-medium px-3 sm:px-4 py-2 rounded-xl text-sm">
          Leave
        </button>
        <button onClick={() => endMutation.mutate()} disabled={endMutation.isPending}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-bold px-3 sm:px-5 py-2 rounded-xl text-sm">
          <Square className="w-4 h-4" /><span className="hidden sm:block">End</span>
        </button>
      </div>
    </div>
  )
}

function TBtn({ active, onClick, icon: Icon, label, offCls }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-colors ${active ? 'bg-dark-700 hover:bg-white/10 text-white' : offCls}`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:block landscape:hidden text-[10px] text-gray-400">{label}</span>
    </button>
  )
}
