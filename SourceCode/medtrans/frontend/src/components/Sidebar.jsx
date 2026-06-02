import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, open, onClose }) {
  const user = useAuthStore(s => s.user); const logout = useAuthStore(s => s.logout)
  const nav = useNavigate()
  const handleLogout = () => { logout(); nav('/login') }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:static z-40 inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform ${open?'translate-x-0':'-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button onClick={onNew} className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg font-medium">+ New chat</button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {conversations.length === 0 && <p className="text-xs text-slate-400 px-2 py-4">No conversations yet</p>}
          {conversations.map(c => (
            <div key={c.id} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${activeId===c.id?'bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-50':'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                 onClick={()=>onSelect(c.id)}>
              <span className="truncate text-sm">{c.title}</span>
              <button onClick={(e)=>{e.stopPropagation(); onDelete(c.id)}} className="opacity-0 group-hover:opacity-100 text-xs text-red-500">✕</button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white grid place-items-center font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-sm py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">Log out</button>
        </div>
      </aside>
    </>
  )
}
