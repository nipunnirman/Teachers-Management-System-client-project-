import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/common'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo" style={{ flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'center', justifyContent: 'center' }}>
          <img src="/logo.jpg" alt="Kendagolla Secondary School Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <div className="auth-logo-text">
            <h2 style={{ fontSize: '1.3rem' }}>Kendagolla Secondary School</h2>
            <p style={{ marginTop: 2 }}>Badulla - Teacher Management System</p>
          </div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@school.edu"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
            {loading ? <Spinner size={16} /> : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-muted" style={{ marginTop: 24, textAlign: 'center' }}>
          Forgot your password? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
