import { tr } from '../../utils/i18n'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/common'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { APP_NAME } from '../../utils/locale'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.title = APP_NAME }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error(tr('කරුණාකර සියලු තොරතුරු ඇතුළත් කරන්න'))
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success(tr('ඔබව සාදරයෙන් පිළිගනිමු!'))
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || tr('පිවිසීම අසාර්ථක විය'))
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">{APP_NAME}</div>

      <div className="auth-box">
        <h1 className="auth-heading">{tr('ආයුබෝවන්')}</h1>
        <p className="auth-subheading">{tr('ඉදිරියට යාමට ඔබගේ ගිණුමට පිවිසෙන්න')}</p>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">{tr('ඊමේල් ලිපිනය')}</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">{tr('මුරපදය')}</label>
            <div className="input-with-action">
              <input
                id="login-password"
                className="form-input"
                type={show ? 'text' : 'password'}
                placeholder={tr('ඔබගේ මුරපදය')}
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShow(s => !s)}
                aria-label={show ? tr('මුරපදය සඟවන්න') : tr('මුරපදය පෙන්වන්න')}
              >
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop:8 }}>
            {loading ? <Spinner size={16}/> : tr('පිවිසෙන්න')}
          </button>
        </form>

        <p className="auth-note">{tr('මුරපදය අමතක වූවාද? පාසල් පරිපාලකයා අමතන්න.')}</p>
      </div>
    </div>
  )
}
