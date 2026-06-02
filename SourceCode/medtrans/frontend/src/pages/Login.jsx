import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth); const nav = useNavigate()
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      setAuth(data.token, { username: data.username, email: data.email, role: data.role })
      toast.success('Welcome back!'); nav('/')
    } catch (err) { toast.error(err?.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-slate-500 text-sm mb-6">MedTrans — Medical AI Translator</p>
        <label className="text-sm">Email</label>
        <input className="w-full mb-4 mt-1 px-3 py-2 rounded-lg border bg-transparent dark:border-slate-700" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label className="text-sm">Password</label>
        <input type="password" className="w-full mb-6 mt-1 px-3 py-2 rounded-lg border bg-transparent dark:border-slate-700" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg font-medium">{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-sm text-slate-500 mt-4">No account? <Link to="/register" className="text-brand-600">Register</Link></p>
      </form>
    </div>
  )
}
