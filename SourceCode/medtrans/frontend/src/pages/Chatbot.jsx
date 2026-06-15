import { useEffect, useState, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import { useUiStore } from '../store/auth'
import { useChatbotStore } from '../store/chatbot'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export default function Chatbot() {
  const { dark, toggleDark } = useUiStore()
  const {
    conversations,
    currentConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage
  } = useChatbotStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendingMessage])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputText])

  const handleSend = () => {
    if (!inputText.trim() || sendingMessage) return
    sendMessage(inputText)
    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Đã sao chép vào bộ nhớ tạm')
  }

  const prompts = [
    "Tôi bị đau nửa đầu kèm buồn nôn, đây là triệu chứng của bệnh gì?",
    "Các lưu ý quan trọng khi sử dụng thuốc Paracetamol là gì?",
    "Làm sao để phòng ngừa các bệnh tim mạch ở người lớn tuổi?"
  ]

  const handlePromptClick = async (prompt) => {
    try {
      if (!currentConversationId) {
        await createConversation('New chat')
      }
      sendMessage(prompt)
    } catch (e) {
      toast.error('Failed to start chat')
    }
  }

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar
        conversations={conversations}
        activeId={currentConversationId}
        onSelect={(id) => { selectConversation(id); setSidebarOpen(false) }}
        onNew={() => createConversation('New chat')}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setSidebarOpen(true)} aria-label="Menu">☰</button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">Chatbot Y Tế RAG</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Active
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-lg border dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="Toggle theme">
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {!currentConversationId ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Trợ Lý Y Tế AI (RAG)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Hỏi về triệu chứng bệnh, chỉ dẫn sử dụng thuốc hoặc kiến thức y tế đã qua xác thực từ cơ sở dữ liệu chuyên ngành.
                </p>
              </div>
              <div className="w-full space-y-2">
                {prompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(p)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-slate-905 transition-colors text-sm text-slate-700 dark:text-slate-300"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
                </div>
              ) : (
                <>
                  {messages.map((m) => {
                    const isUser = m.senderType === 'USER'
                    return (
                      <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`group relative rounded-2xl px-4 py-3 max-w-[85%] shadow-sm ${
                            isUser
                              ? 'bg-brand-500 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {!isUser && (
                            <button
                              onClick={() => handleCopy(m.text)}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Sao chép"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          )}
                          {isUser ? (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                          ) : (
                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-2 pr-4">
                              <ReactMarkdown
                                components={{
                                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                  li: ({ node, ...props }) => <li className="text-slate-700 dark:text-slate-300" {...props} />,
                                  h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-1" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-2 mb-1" {...props} />,
                                  code: ({ node, inline, ...props }) => (
                                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs" {...props} />
                                  )
                                }}
                              >
                                {m.text}
                              </ReactMarkdown>
                            </div>
                          )}

                          {m.latencyMs !== undefined && m.latencyMs !== null && (
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1 select-none">
                              ⚡ {m.latencyMs}ms
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {sendingMessage && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                        <span>Trợ lý đang phản hồi...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form */}
        {currentConversationId && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 border border-slate-250 dark:border-slate-800">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nhập câu hỏi sức khỏe..."
                disabled={sendingMessage}
                className="flex-1 resize-none bg-transparent py-2 px-3 focus:outline-none text-sm text-slate-850 dark:text-slate-150 max-h-[180px]"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sendingMessage}
                className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition-colors"
                title="Gửi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
