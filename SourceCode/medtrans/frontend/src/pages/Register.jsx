import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import { useAuthStore } from '../store/auth'

export default function Register() {
  const [f, setF] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth); const nav = useNavigate()
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', f)
      setAuth(data.token, { username: data.username, email: data.email, role: data.role })
      toast.success('Account created!'); nav('/')
    } catch (err) { toast.error(err?.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-slate-500 text-sm mb-6">Start translating medical texts</p>
        {['username','email','password'].map(k => (
          <div key={k} className="mb-4">
            <label className="text-sm capitalize">{k}</label>
            <input type={k==='password'?'password':'text'} className="w-full mt-1 px-3 py-2 rounded-lg border bg-transparent dark:border-slate-700"
              value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} required />
          </div>
        ))}
        <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg font-medium">{loading?'Creating…':'Register'}</button>
        <p className="text-sm text-slate-500 mt-4">Have an account? <Link to="/login" className="text-brand-600">Sign in</Link></p>
      </form>
    </div>
  )
}
