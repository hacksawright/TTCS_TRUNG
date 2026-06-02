import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'
import ChatArea from '../components/ChatArea.jsx'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function Chat() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const load = async () => {
    try { const { data } = await api.get('/api/conversations'); setConversations(data) }
    catch { toast.error('Failed to load conversations') }
  }
  useEffect(() => { load() }, [])

  const newChat = async () => {
    const { data } = await api.post('/api/conversations', { title: 'New chat' })
    setConversations(c => [data, ...c]); setActiveId(data.id); setSidebarOpen(false)
  }
  const remove = async (id) => {
    await api.delete(`/api/conversations/${id}`)
    setConversations(c => c.filter(x => x.id !== id))
    if (activeId === id) setActiveId(null)
  }

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id)=>{ setActiveId(id); setSidebarOpen(false) }}
        onNew={newChat}
        onDelete={remove}
        open={sidebarOpen}
        onClose={()=>setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenu={()=>setSidebarOpen(true)} />
        <ChatArea
          conversationId={activeId}
          onConversationCreated={(c)=>{ setConversations(prev=>[c,...prev]); setActiveId(c.id) }}
          onTitleUpdate={load}
        />
      </div>
    </div>
  )
}
