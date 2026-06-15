import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Chat from './pages/Chat.jsx'
import Chatbot from './pages/Chatbot.jsx'
import { useAuthStore, useUiStore } from './store/auth'

function Protected({ children }) {
  const user = useAuthStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const applyDarkOnLoad = useUiStore(s => s.applyDarkOnLoad)
  useEffect(() => { applyDarkOnLoad() }, [applyDarkOnLoad])
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Chat /></Protected>} />
      <Route path="/chatbot" element={<Protected><Chatbot /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
