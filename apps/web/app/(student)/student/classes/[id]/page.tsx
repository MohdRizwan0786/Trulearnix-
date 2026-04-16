'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { classAPI, quizAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { toast } from 'react-hot-toast'
import {
  Mic, MicOff, MessageSquare, Users, Hand,
  ThumbsUp, Heart, Star, Send, ArrowLeft,
  Video, VideoOff, Volume2, VolumeX, Radio,
  FileQuestion, Trophy, CheckCircle2, ChevronRight, BarChart2
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { Room, RoomEvent, Track, ParticipantEvent } from 'livekit-client'

interface ChatMsg { id: number; name: string; msg: string; time: string; isMe?: boolean }
interface QuizOption { text: string; _id?: string }
interface QuizQuestion { _id: string; question: string; options: QuizOption[]; correctAnswer?: number }
interface Quiz { _id: string; title: string; questions: QuizQuestion[] }
interface LeaderboardEntry { studentId: string; name: string; score: number; timeTaken?: number }

export default function StudentClassRoom({ params }: { params: { id: string } }) {
  const { user } = useAuthStore()
  const chatEndRef = useRef<HTMLDivElement>(null)

  // LiveKit refs
  const roomRef = useRef<Room | null>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  const mentorVideoContainerRef = useRef<HTMLVideoElement>(null)
  const localVideoContainerRef = useRef<HTMLVideoElement>(null)
  const pingIntervalRef = useRef<any>(null)
  const quizPollRef = useRef<any>(null)
  const controlPollRef = useRef<any>(null)
  const prevControlRef = useRef({ mutedAll: false, camOffAll: false, adminInRoom: false })
  const micOnRef = useRef(false)
  const camOnRef = useRef(false)
  const isHostRef = useRef(false)

  // LiveKit state
  const [joined, setJoined] = useState(false)
  const [classKicked, setClassKicked] = useState(false)
  const [mentorOnline, setMentorOnline] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [muted, setMuted] = useState(false)
  const [mentorMutedAll, setMentorMutedAll] = useState(false)
  const [mentorCamOff, setMentorCamOff] = useState(false)

  // Poll state
  const [activePoll, setActivePoll] = useState<any>(null)
  const [pollTotal, setPollTotal] = useState(0)
  const [myVote, setMyVote] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [newPollAlert, setNewPollAlert] = useState(false)
  const prevPollIdRef = useRef<string | null>(null)

  // Keep refs in sync with state for use inside intervals (avoid stale closure)
  const setMicOnSync = (v: boolean) => { micOnRef.current = v; setMicOn(v) }
  const setCamOnSync = (v: boolean) => { camOnRef.current = v; setCamOn(v) }
  const setIsHostSync = (v: boolean) => { isHostRef.current = v; setIsHost(v) }

  // UI state
  const [handRaised, setHandRaised] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'quiz' | 'poll'>('chat')
  const [panelOpen, setPanelOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: 1, name: 'System', msg: '🎉 Welcome! Joining live class...', time: now() }
  ])
  const [reactions, setReactions] = useState({ like: 0, heart: 0, star: 0 })
  const [flyingReaction, setFlyingReaction] = useState<string | null>(null)
  const [attendancePercent, setAttendancePercent] = useState(0)

  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myScore, setMyScore] = useState<number | null>(null)
  const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null)

  // Fetch LiveKit token
  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['livekit-token-student', params.id],
    queryFn: () => classAPI.livekitToken(params.id).then(r => r.data),
    retry: false,
  })

  // Attendance heartbeat
  useEffect(() => {
    pingIntervalRef.current = setInterval(async () => {
      try {
        const res = await classAPI.attendancePing(params.id).then((r: any) => r.data)
        setAttendancePercent(res.percent || 0)
      } catch {}
    }, 30000)
    return () => clearInterval(pingIntervalRef.current)
  }, [])

  // Poll room control every 3s — enforce mentor's mute/cam commands
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await classAPI.getRoomControl(params.id).then((r: any) => r.data)
        const prev = prevControlRef.current

        // Mentor muted all
        if (res.mutedAll && !prev.mutedAll) {
          setMentorMutedAll(true)
          if (micOnRef.current) {
            try { await roomRef.current?.localParticipant.setMicrophoneEnabled(false) } catch {}
            setMicOnSync(false)
          }
          toast('🔇 Mentor muted your mic', { duration: 3000 })
        }
        if (!res.mutedAll && prev.mutedAll) {
          setMentorMutedAll(false)
          toast('🔊 You can unmute now', { duration: 3000 })
        }

        // Mentor stopped all cams
        if (res.camOffAll && !prev.camOffAll) {
          setMentorCamOff(true)
          if (camOnRef.current) {
            try { await roomRef.current?.localParticipant.setCameraEnabled(false) } catch {}
            setCamOnSync(false)
          }
          toast('📷 Mentor turned off your camera', { duration: 3000 })
        }
        if (!res.camOffAll && prev.camOffAll) {
          setMentorCamOff(false)
          toast('📷 You can turn camera on now', { duration: 3000 })
        }

        // Admin joined/left
        if (res.adminInRoom && !prev.adminInRoom) {
          const aName = res.adminName || 'Admin'
          toast(`🛡️ ${aName} has joined as observer`, { duration: 5000, icon: '👁️' })
          setChatMsgs((p: ChatMsg[]) => [...p, { id: Date.now(), name: 'System', msg: `🛡️ ${aName} (Admin) is now observing this class`, time: now() }])
        } else if (!res.adminInRoom && prev.adminInRoom) {
          setChatMsgs((p: ChatMsg[]) => [...p, { id: Date.now(), name: 'System', msg: 'Admin has left the class', time: now() }])
        }

        prevControlRef.current = { mutedAll: res.mutedAll, camOffAll: res.camOffAll, adminInRoom: !!res.adminInRoom }

        // Check if class has ended — kick students out
        if (res.classStatus === 'ended' || res.classStatus === 'cancelled') {
          clearInterval(controlPollRef.current)
          await roomRef.current?.disconnect()
          setClassKicked(true)
        }
      } catch {}
    }
    controlPollRef.current = setInterval(poll, 3000)
    return () => clearInterval(controlPollRef.current)
  }, [params.id])

  // Poll for active polls every 4s
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await classAPI.getPoll(params.id).then((r: any) => r.data)
        if (res.poll) {
          setActivePoll(res.poll)
          setPollTotal(res.total || 0)
          if (res.hasVoted) { setHasVoted(true); setMyVote(res.myVote ?? null) }
          // New poll alert
          if (res.poll.id !== prevPollIdRef.current && res.poll.active) {
            setNewPollAlert(true)
            setActiveTab('quiz') // reuse panel, but show poll
            setPanelOpen(true)
            toast('📊 Mentor launched a poll!', { duration: 3000 })
            prevPollIdRef.current = res.poll.id
          }
        } else {
          setActivePoll(null)
        }
      } catch {}
    }
    fetchPoll()
    const t = setInterval(fetchPoll, 4000)
    return () => clearInterval(t)
  }, [params.id])

  // Poll for quizzes every 15s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await classAPI.quizzes(params.id).then((r: any) => r.data)
        const list: Quiz[] = res.quizzes || []
        setQuizzes(list)
      } catch {}
    }
    poll()
    quizPollRef.current = setInterval(poll, 15000)
    return () => { clearInterval(quizPollRef.current); clearInterval(controlPollRef.current) }
  }, [params.id])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  // Init LiveKit
  useEffect(() => {
    if (!tokenData?.livekitUrl || !tokenData?.token) return
    initLiveKit(tokenData)
    return () => { leaveChannel() }
  }, [tokenData])

  const initLiveKit = async (data: any) => {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
        publishDefaults: {
          videoCodec: 'vp9',
          audioPreset: { maxBitrate: 320_000 },
          dtx: false,
          red: true,
        },
      })
      roomRef.current = room

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Video) {
          setMentorOnline(true)
          setTimeout(() => {
            if (mentorVideoContainerRef.current) track.attach(mentorVideoContainerRef.current)
          }, 200)
          addSystemMsg('🎥 Mentor started video')
        }
        if (track.kind === Track.Kind.Audio) {
          setMentorOnline(true)
          if (!muted) {
            const el = track.attach()
            el.style.display = 'none'
            document.body.appendChild(el)
          }
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        if (track.kind === Track.Kind.Video) setMentorOnline(false)
      })

      room.on(RoomEvent.ParticipantDisconnected, () => {
        setMentorOnline(false)
        addSystemMsg('📢 Mentor left the class')
      })

      await room.connect(data.livekitUrl, data.token)
      setJoined(true)
      addSystemMsg('✅ Connected! Waiting for mentor...')
    } catch (err: any) {
      toast.error('Could not join: ' + (err.message || 'Check permissions'))
    }
  }

  const leaveChannel = async () => {
    await roomRef.current?.disconnect()
    roomRef.current = null
  }

  // Toggle mic
  const toggleMic = async () => {
    if (mentorMutedAll && !micOnRef.current) {
      toast('🔇 Mentor has muted the class', { duration: 2000 }); return
    }
    try {
      const room = roomRef.current
      if (!room) return
      const enable = !micOnRef.current
      await room.localParticipant.setMicrophoneEnabled(enable)
      setMicOnSync(enable)
      toast(enable ? 'Microphone on' : 'Microphone off', { duration: 1500 })
    } catch (err: any) {
      toast.error('Mic error: ' + (err.message || 'Device not found'))
    }
  }

  // Toggle camera
  const toggleCam = async () => {
    if (mentorCamOff && !camOnRef.current) {
      toast('📷 Mentor has turned off cameras', { duration: 2000 }); return
    }
    try {
      const room = roomRef.current
      if (!room) return
      const enable = !camOnRef.current
      await room.localParticipant.setCameraEnabled(enable)
      if (enable) {
        setTimeout(() => {
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
          if (pub?.videoTrack && localVideoContainerRef.current) pub.videoTrack.attach(localVideoContainerRef.current)
        }, 100)
      }
      setCamOnSync(enable)
      toast(enable ? 'Camera on' : 'Camera off', { duration: 1500 })
    } catch (err: any) {
      toast.error('Camera error: ' + (err.message || 'Device not found'))
    }
  }

  function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
  function addSystemMsg(msg: string) {
    setChatMsgs(prev => [...prev, { id: Date.now(), name: 'System', msg, time: now() }])
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMsgs(prev => [...prev, { id: Date.now(), name: user?.name || 'Student', msg: chatInput, time: now(), isMe: true }])
    setChatInput('')
  }

  const sendReaction = (emoji: string, key: keyof typeof reactions) => {
    setReactions(prev => ({ ...prev, [key]: prev[key] + 1 }))
    setFlyingReaction(emoji)
    setTimeout(() => setFlyingReaction(null), 1200)
    toast(emoji, { duration: 800, position: 'top-center' })
  }

  const toggleHand = () => {
    setHandRaised(v => !v)
    toast(handRaised ? 'Hand lowered' : '✋ Hand raised! Mentor will see it.', { duration: 2000 })
  }

  // Open a quiz
  const openQuiz = async (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setSelectedAnswers({})
    setQuizSubmitted(false)
    setLeaderboard([])
    setMyScore(null)
    setQuizTimeLeft(null)
    setActiveTab('quiz')
    setPanelOpen(true)
  }

  // Submit quiz
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!activeQuiz) throw new Error('No quiz')
      const answers = activeQuiz.questions.map((q, i) => ({
        questionIndex: i,
        selectedOption: selectedAnswers[q._id] ?? -1
      }))
      return quizAPI.submit(activeQuiz._id, answers).then(r => r.data)
    },
    onSuccess: (data: any) => {
      setQuizSubmitted(true)
      setMyScore(data.score ?? null)
      setLeaderboard(data.leaderboard || [])
      toast.success(`Quiz submitted! Score: ${data.score ?? '?'}`, { duration: 3000 })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Submit failed')
  })

  const canSubmitQuiz = activeQuiz && !quizSubmitted &&
    activeQuiz.questions.every(q => selectedAnswers[q._id] !== undefined)

  if (classKicked) return (
    <div className="h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Class Has Ended</h3>
        <p className="text-gray-400 text-sm mb-6">The mentor has ended this class. Thank you for attending!</p>
        <Link href="/student/classes" className="btn-primary text-sm px-6 py-2.5">Back to Classes</Link>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Joining live class...</p>
      </div>
    </div>
  )

  if (error || !tokenData) return (
    <div className="h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Cannot Join Class</h3>
        <p className="text-gray-400 text-sm mb-6">The class may have ended or you're not enrolled.</p>
        <Link href="/student/classes" className="btn-primary text-sm px-6 py-2.5">Back to Classes</Link>
      </div>
    </div>
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden">

      {flyingReaction && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl z-50 pointer-events-none animate-bounce">
          {flyingReaction}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-12 landscape:h-10 bg-dark-800 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/student/classes" className="text-gray-400 hover:text-white flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" href="/" />
          <div className="hidden sm:flex items-center gap-1.5 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${mentorOnline ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="text-white font-semibold text-sm truncate max-w-[180px]">{tokenData?.classTitle || 'Live Class'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {attendancePercent > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" />{attendancePercent}%
            </span>
          )}
          {quizzes.length > 0 && (
            <button onClick={() => { setActiveTab('quiz'); setPanelOpen(true) }}
              className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
              <FileQuestion className="w-3 h-3" />
              <span className="hidden sm:inline">Quiz</span>
              <span className="w-4 h-4 bg-yellow-500 text-black rounded-full text-[10px] font-bold flex items-center justify-center">{quizzes.length}</span>
            </button>
          )}
          <button onClick={() => setPanelOpen(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${panelOpen ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">

        {/* Video area — always visible, panel overlays on mobile/landscape */}
        <div className="flex-1 min-w-0 min-h-0 bg-black flex flex-col relative">
          {!joined ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Connecting...</p>
            </div>
          ) : (
            <div className="flex-1 relative min-h-0">
              <video ref={mentorVideoContainerRef} className="w-full h-full object-cover" autoPlay playsInline />
              {!mentorOnline && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900 gap-4">
                  <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <Radio className="w-10 h-10 text-primary-400 animate-pulse" />
                  </div>
                  <p className="text-gray-400 text-sm">Waiting for mentor to start video...</p>
                </div>
              )}
              {mentorOnline && (
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Mentor • Live
                </div>
              )}
            </div>
          )}

          {/* Local video pip */}
          {camOn && (
            <div className="absolute bottom-14 right-3 w-28 h-20 sm:w-36 sm:h-24 bg-dark-800 rounded-xl overflow-hidden border-2 border-primary-500/50 shadow-xl">
              <video ref={localVideoContainerRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <div className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 px-1.5 rounded">You</div>
            </div>
          )}
        </div>

        {/* Side panel — overlay on mobile/landscape, sidebar on desktop */}
        {panelOpen && (
          <div className="absolute sm:relative inset-y-0 right-0 z-20 w-72 landscape:w-64 lg:w-80 flex-shrink-0 flex flex-col bg-dark-800/95 landscape:bg-dark-800/90 backdrop-blur-sm border-l border-white/5 min-h-0 shadow-2xl sm:shadow-none">
            {/* Tabs */}
            <div className="flex border-b border-white/5 flex-shrink-0">
              {(['chat', 'participants', 'poll', 'quiz'] as const).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'poll') setNewPollAlert(false) }}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-colors relative ${activeTab === tab ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'chat' && <><MessageSquare className="w-3 h-3 inline mr-0.5" />Chat</>}
                  {tab === 'participants' && <><Users className="w-3 h-3 inline mr-0.5" />People</>}
                  {tab === 'poll' && (
                    <span className="flex items-center justify-center gap-0.5 relative">
                      <BarChart2 className="w-3 h-3" />Poll
                      {(newPollAlert || activePoll?.active) && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                    </span>
                  )}
                  {tab === 'quiz' && (
                    <span className="flex items-center justify-center gap-0.5">
                      <FileQuestion className="w-3 h-3" />Quiz
                      {quizzes.length > 0 && <span className="w-3 h-3 bg-yellow-500 text-black rounded-full text-[9px] font-bold flex items-center justify-center">{quizzes.length}</span>}
                    </span>
                  )}
                </button>
              ))}
              <button onClick={() => setPanelOpen(false)} className="px-3 text-gray-500 hover:text-white text-sm">✕</button>
            </div>

            {/* Chat */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {chatMsgs.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && <span className="text-[11px] text-gray-500 mb-0.5 px-1">{msg.name}</span>}
                      <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                        msg.name === 'System' ? 'bg-green-500/10 text-green-300 text-xs w-full text-center' :
                        msg.isMe ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-200'}`}>
                        {msg.msg}
                      </div>
                      <span className="text-[10px] text-gray-600 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex-shrink-0">
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Ask a question..."
                      className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50" />
                    <button onClick={sendChat} className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-xl flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Participants */}
            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                <div className="flex items-center gap-3 p-2.5 bg-dark-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-bold flex-shrink-0">M</div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white">Mentor</p><p className="text-xs text-green-400">{mentorOnline ? 'Live' : 'Waiting'}</p></div>
                  {mentorOnline && <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-primary-400">You</p>
                      {micOn && <Mic className="w-3 h-3 text-green-400" />}
                      {camOn && <Video className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                  {handRaised && <Hand className="w-4 h-4 text-yellow-400 animate-bounce flex-shrink-0" />}
                </div>
              </div>
            )}

            {/* Quiz tab */}
            {/* Poll tab */}
            {activeTab === 'poll' && (
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {!activePoll ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <BarChart2 className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="text-gray-400 text-sm">No active poll</p>
                    <p className="text-gray-600 text-xs">Mentor will launch a poll during class</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className={`text-xs font-semibold flex items-center gap-1.5 mb-2 ${activePoll.active ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${activePoll.active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        {activePoll.active ? 'Live Poll' : 'Poll Ended'}
                        <span className="text-gray-500 font-normal">· {pollTotal} vote{pollTotal !== 1 ? 's' : ''}</span>
                      </p>
                      <p className="text-white font-bold text-sm leading-snug">{activePoll.question}</p>
                    </div>

                    {!hasVoted && activePoll.active ? (
                      /* Voting options */
                      <div className="space-y-2">
                        {activePoll.options.map((opt: any, i: number) => (
                          <button key={i}
                            onClick={async () => {
                              try {
                                const res = await classAPI.votePoll(params.id, i).then((r: any) => r.data)
                                setHasVoted(true); setMyVote(i)
                                setActivePoll(res.poll); setPollTotal(res.total || 0)
                                toast.success('Vote submitted!', { duration: 1500 })
                              } catch (e: any) {
                                toast.error(e.response?.data?.message || 'Vote failed')
                              }
                            }}
                            className="w-full text-left px-4 py-3 bg-dark-700 hover:bg-primary-500/20 border border-white/5 hover:border-primary-500/40 rounded-xl text-sm text-gray-200 transition-all font-medium">
                            <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>{opt.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Results after voting */
                      <div className="space-y-2.5">
                        {hasVoted && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> You voted</p>}
                        {activePoll.options.map((opt: any, i: number) => {
                          const pct = pollTotal > 0 ? Math.round((opt.votes / pollTotal) * 100) : 0
                          const isLeading = opt.votes === Math.max(...activePoll.options.map((o: any) => o.votes)) && opt.votes > 0
                          const isMyVote = myVote === i
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-medium flex items-center gap-1 ${isMyVote ? 'text-primary-400' : isLeading ? 'text-white' : 'text-gray-400'}`}>
                                  {isMyVote && <CheckCircle2 className="w-3 h-3" />}
                                  {opt.text}
                                </span>
                                <span className={`font-bold ${isLeading ? 'text-white' : 'text-gray-500'}`}>{pct}%</span>
                              </div>
                              <div className="h-2.5 bg-dark-600 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${isMyVote ? 'bg-primary-500' : isLeading ? 'bg-white/30' : 'bg-dark-400'}`}
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[10px] text-gray-600">{opt.votes} vote{opt.votes !== 1 ? 's' : ''}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="flex-1 overflow-y-auto min-h-0">
                {!activeQuiz ? (
                  /* Quiz list */
                  <div className="p-3 space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold px-1">Available Quizzes</p>
                    {quizzes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                        <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                          <FileQuestion className="w-7 h-7 text-yellow-400" />
                        </div>
                        <p className="text-gray-400 text-sm">No quizzes yet</p>
                        <p className="text-gray-600 text-xs">Mentor will launch a quiz during class</p>
                      </div>
                    ) : quizzes.map(q => (
                      <button key={q._id} onClick={() => openQuiz(q)}
                        className="w-full flex items-center gap-3 p-3 bg-dark-700 hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500/30 rounded-xl transition-colors text-left">
                        <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileQuestion className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{q.title}</p>
                          <p className="text-xs text-gray-500">{q.questions?.length || 0} questions</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : quizSubmitted ? (
                  /* Results & Leaderboard */
                  <div className="p-3 space-y-4">
                    <button onClick={() => { setActiveQuiz(null); setQuizSubmitted(false) }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
                      <ArrowLeft className="w-3.5 h-3.5" />Back to quizzes
                    </button>

                    {/* Score card */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                      </div>
                      <p className="text-white font-bold text-lg">Quiz Complete!</p>
                      {myScore !== null && (
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-yellow-400">{myScore}</span>
                          <span className="text-gray-400 text-sm"> / {activeQuiz.questions.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Leaderboard */}
                    {leaderboard.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold px-1 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-yellow-400" />Leaderboard
                        </p>
                        {leaderboard.slice(0, 10).map((entry, i) => (
                          <div key={entry.studentId || i}
                            className={`flex items-center gap-3 p-2.5 rounded-xl ${entry.studentId === user?.id ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-700/50'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-dark-600 text-gray-400'
                            }`}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${entry.studentId === user?.id ? 'text-primary-400' : 'text-white'}`}>
                                {entry.name}{entry.studentId === user?.id ? ' (You)' : ''}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-white flex-shrink-0">{entry.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Quiz questions */
                  <div className="p-3 space-y-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveQuiz(null)}
                        className="text-gray-400 hover:text-white flex-shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{activeQuiz.title}</p>
                        <p className="text-xs text-gray-500">{activeQuiz.questions.length} questions</p>
                      </div>
                    </div>

                    {activeQuiz.questions.map((q, qi) => (
                      <div key={q._id} className="space-y-2">
                        <p className="text-sm font-semibold text-white">
                          <span className="text-primary-400 mr-1.5">Q{qi + 1}.</span>{q.question}
                        </p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oi) => (
                            <button key={oi}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [q._id]: oi }))}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                                selectedAnswers[q._id] === oi
                                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                                  : 'bg-dark-700/50 border-white/5 text-gray-300 hover:border-white/20'
                              }`}>
                              <span className="font-medium mr-2 text-gray-500">{String.fromCharCode(65 + oi)}.</span>
                              {opt.text || String(opt)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => submitMutation.mutate()}
                      disabled={!canSubmitQuiz || submitMutation.isPending}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl transition-colors text-sm">
                      {submitMutation.isPending ? 'Submitting...' : `Submit Quiz (${Object.keys(selectedAnswers).length}/${activeQuiz.questions.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14 landscape:h-10 bg-dark-800 border-t border-white/5 flex-shrink-0">
        {/* Left — mic + cam */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <SBtn active={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label="Mic"
              offStyle={mentorMutedAll ? 'bg-red-900/30 text-red-600 cursor-not-allowed opacity-50' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}
              onStyle="bg-green-500/20 text-green-400" />
            {mentorMutedAll && !micOn && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-dark-800" title="Muted by mentor" />
            )}
          </div>
          <div className="relative">
            <SBtn active={camOn} onClick={toggleCam} icon={camOn ? Video : VideoOff} label="Cam"
              offStyle={mentorCamOff ? 'bg-red-900/30 text-red-600 cursor-not-allowed opacity-50' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}
              onStyle="bg-blue-500/20 text-blue-400" />
            {mentorCamOff && !camOn && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-dark-800" title="Camera off by mentor" />
            )}
          </div>
          <SBtn active={!muted} onClick={() => setMuted(v => !v)} icon={muted ? VolumeX : Volume2} label="Audio"
            offStyle="bg-red-500/20 text-red-400" onStyle="bg-dark-700 hover:bg-white/10 text-gray-500" />
        </div>

        {/* Center reactions */}
        <div className="flex items-center gap-1">
          <button onClick={() => sendReaction('👍', 'like')}
            className="flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-colors">
            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[10px] mt-0.5">{reactions.like}</span>
          </button>
          <button onClick={() => sendReaction('❤️', 'heart')}
            className="flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[10px] mt-0.5">{reactions.heart}</span>
          </button>
          <button onClick={() => sendReaction('⭐', 'star')}
            className="flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-yellow-500/20 hover:text-yellow-400 text-gray-400 transition-colors">
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[10px] mt-0.5">{reactions.star}</span>
          </button>
          <button onClick={toggleHand}
            className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-xl transition-colors ${handRaised ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-700 hover:bg-yellow-500/10 text-gray-400'}`}>
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[10px] mt-0.5">{handRaised ? 'Lower' : 'Raise'}</span>
          </button>
          <button onClick={() => setPanelOpen(v => !v)}
            className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-xl transition-colors ${panelOpen ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-700 hover:bg-white/10 text-gray-400'}`}>
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block text-[10px] mt-0.5">Chat</span>
          </button>
        </div>

        {/* Right — leave */}
        <Link href="/student/classes"
          className="flex items-center gap-1.5 bg-dark-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-white/5 transition-colors">
          Leave
        </Link>
      </div>
    </div>
  )
}

function SBtn({ active, onClick, icon: Icon, label, offStyle, onStyle }: any) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-colors ${active ? (onStyle || 'bg-dark-700 hover:bg-white/10 text-white') : offStyle}`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:block landscape:hidden text-[10px] text-gray-400">{label}</span>
    </button>
  )
}
