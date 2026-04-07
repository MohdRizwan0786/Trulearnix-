'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, User, BookOpen, Target, Brain } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

const suggestions = [
  'What course should I take next?',
  'Generate my weekly study plan',
  'Help me with digital marketing basics',
  'How can I earn more from the Earn Program?',
  'Review my progress and suggest improvements',
]

interface Msg { role: 'user' | 'ai'; content: string; ts: Date }

export default function AICoachPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', content: `Namaste ${user?.name?.split(' ')[0]}! 🎓 Main tumhara personal AI Coach hoon. Main tumhari learning journey mein madad karne ke liye yahan hoon. Kya poochhna chahte ho?`, ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/users/ai-coach', { message: text })
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || 'Samajh gaya! Yeh feature abhi implement ho raha hai — jald hi available hoga.', ts: new Date() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'AI Coach abhi configure ho raha hai. Jald hi GPT-4o se personalized guidance milegi! Abhi ke liye community mein apna sawaal poochh sakte ho.',
        ts: new Date()
      }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-0">
      {/* Header */}
      <div className="card mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">AI Coach <Sparkles className="w-4 h-4 text-yellow-400" /></h1>
            <p className="text-xs text-gray-400">Powered by GPT-4o • Personal RAG Mentor</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[{ icon: BookOpen, label: 'Courses' }, { icon: Target, label: 'Goals' }, { icon: Brain, label: 'Study Plan' }].map(({ icon: Icon, label }) => (
            <button key={label} onClick={() => sendMessage(`Help me with ${label.toLowerCase()}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-violet-500/20' : 'bg-primary-500/20'}`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-violet-400" /> : <User className="w-4 h-4 text-primary-400" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'ai' ? 'bg-dark-700 text-white rounded-tl-none' : 'bg-primary-500/20 text-white rounded-tr-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-violet-400" /></div>
            <div className="bg-dark-700 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 my-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-2 bg-white/5 hover:bg-primary-500/20 hover:text-primary-400 text-gray-400 rounded-xl transition-all border border-white/5 hover:border-primary-500/30">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 mt-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Kuch bhi poochho — courses, career, study plan..."
          className="flex-1 bg-dark-700 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="w-12 h-12 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 rounded-2xl flex items-center justify-center transition-colors">
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  )
}
