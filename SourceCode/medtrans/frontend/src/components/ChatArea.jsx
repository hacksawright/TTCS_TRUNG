import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import api from '../api/client'
import { useUiStore } from '../store/auth'

export default function ChatArea({ conversationId, onConversationCreated, onTitleUpdate }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const taRef = useRef(null)
  const direction = useUiStore(s => s.direction)

  useEffect(() => {
    if (!conversationId) { setMessages([]); return }
    setLoading(true)
    api.get(`/api/conversations/${conversationId}/messages`)
      .then(({data}) => setMessages(data))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [conversationId])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, sending])
  useEffect(() => { taRef.current?.focus() }, [conversationId])

  const autoResize = (el) => { el.style.height='auto'; el.style.height = Math.min(el.scrollHeight, 200)+'px' }

  const send = async () => {
    const value = text.trim(); if (!value || sending) return
    setSending(true)
    try {
      let convId = conversationId
      if (!convId) {
        const { data: c } = await api.post('/api/conversations', { title: value.slice(0, 60) })
        convId = c.id; onConversationCreated?.(c)
      }
      const userMsg = { id: 'tmp-'+Date.now(), senderType: 'USER', originalText: value, createdAt: new Date().toISOString() }
      setMessages(m => [...m, userMsg]); setText(''); if (taRef.current) taRef.current.style.height='auto'
      const { data } = await api.post('/api/messages/translate', { conversationId: convId, text: value, direction })
      setMessages(m => [...m, data])
      onTitleUpdate?.()
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Translation failed')
    } finally { setSending(false) }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {!conversationId && messages.length === 0 && (
            <div className="text-center mt-24">
              <h2 className="text-3xl font-semibold mb-2">Medical Translator</h2>
              <p className="text-slate-500">Translate clinical text between English and Vietnamese.</p>
            </div>
          )}
          {loading && <div className="space-y-3">{[...Array(3)].map((_,i)=>(
            <div key={i} className="h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          ))}</div>}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.senderType==='USER'?'justify-end':'justify-start'}`}>
              <div className={`max-w-[85%] ${m.senderType==='USER'?'bubble-user':'bubble-ai'}`}>
                {m.senderType === 'USER' ? (
                  <p className="whitespace-pre-wrap">{m.originalText}</p>
                ) : (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.translatedText || ''}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {m.latencyMs != null && <span>⚡ {m.latencyMs} ms</span>}
                      <button onClick={()=>{ navigator.clipboard.writeText(m.translatedText||''); toast.success('Copied') }}
                              className="hover:text-brand-600">Copy</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bubble-ai"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            placeholder="Enter medical text… (Shift+Enter for new line)"
            onChange={(e)=>{ setText(e.target.value); autoResize(e.target) }}
            onKeyDown={onKey}
            className="flex-1 resize-none px-4 py-3 rounded-2xl border bg-transparent dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-medium">
            Translate
          </button>
        </div>
        <p className="max-w-3xl mx-auto text-[11px] text-slate-400 mt-2 text-center">For research only — verify clinical translations with a professional.</p>
      </div>
    </div>
  )
}
