import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { BellRing, Camera, Printer } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, PageLoader } from '../components/common'
import TeacherRecord, { teacherDetails } from '../components/common/TeacherRecord'
import { authAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { tr } from '../utils/i18n'
import { ROLE_LABELS } from '../utils/locale'
import { resizePhoto } from '../utils/photo'
import { disablePush, enablePush, getSubscription, isPushSupported } from '../utils/push'

function PushCard() {
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const supported = isPushSupported()

  useEffect(() => {
    getSubscription().then(sub => setOn(Boolean(sub))).catch(() => {})
  }, [])

  const toggle = async () => {
    setBusy(true)
    try {
      if (on) {
        await disablePush()
        setOn(false)
        toast.success(tr('දුරකථන දැනුම්දීම් අක්‍රීය විය'))
      } else {
        const result = await enablePush()
        if (result === 'on') { setOn(true); toast.success(tr('දුරකථන දැනුම්දීම් සක්‍රීය විය')) }
        else if (result === 'denied') toast.error(tr('දුරකථනයේ සැකසුම් තුළින් දැනුම්දීම්වලට අවසර දෙන්න'))
        else toast.error(tr('මෙම උපාංගයේ දැනුම්දීම් ලබාගත නොහැක'))
      }
    } catch { toast.error(tr('දැනුම්දීම් සැකසීමට නොහැකි විය')) }
    finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2 className="card-title"><BellRing size={16} className="title-icon"/> {tr('දුරකථන දැනුම්දීම්')}</h2>
      <p className="card-sub" style={{ marginBottom: 14 }}>
        {supported
          ? tr('යෙදුම වසා ඇති විටත් නිවාඩු, කාලසටහන් සහ නිවේදන පිළිබඳව දැනුම්දීම් ලබාගන්න.')
          : tr('iPhone සඳහා, පළමුව මෙම යෙදුම මුල් තිරයට එක් කරන්න. මෙම බ්‍රව්සරයේ දැනුම්දීම් ලබාගත නොහැක.')}
      </p>
      {supported && (
        <button className={`btn ${on ? 'btn-ghost' : 'btn-primary'}`} onClick={toggle} disabled={busy}>
          {on ? tr('දැනුම්දීම් අක්‍රීය කරන්න') : tr('දැනුම්දීම් සක්‍රීය කරන්න')}
        </button>
      )}
    </div>
  )
}

function PasswordCard() {
  const blank = { currentPassword: '', newPassword: '', confirm: '' }
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!form.currentPassword || !form.newPassword) return toast.error(tr('කරුණාකර සියලු තොරතුරු ඇතුළත් කරන්න'))
    if (form.newPassword.length < 8) return toast.error(tr('නව මුරපදයේ අවම වශයෙන් අක්ෂර 8ක් තිබිය යුතුය'))
    if (form.newPassword !== form.confirm) return toast.error(tr('නව මුරපද දෙක එකිනෙකට නොගැළපේ'))
    setSaving(true)
    try {
      const { data } = await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success(data.message)
      setForm(blank)
    } catch (err) { toast.error(err.response?.data?.message || tr('මුරපදය වෙනස් කිරීමට නොහැකි විය')) }
    finally { setSaving(false) }
  }

  const field = (key, label, autoComplete) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`password-${key}`}>{label}</label>
      <input id={`password-${key}`} className="form-input" type="password" autoComplete={autoComplete} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
    </div>
  )

  return (
    <form className="card" onSubmit={save}>
      <h2 className="card-title" style={{ marginBottom: 14 }}>{tr('මුරපදය වෙනස් කිරීම')}</h2>
      {field('currentPassword', tr('වත්මන් මුරපදය'), 'current-password')}
      {field('newPassword', tr('නව මුරපදය'), 'new-password')}
      {field('confirm', tr('නව මුරපදය නැවත ඇතුළත් කරන්න'), 'new-password')}
      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? tr('සුරකිමින්…') : tr('මුරපදය වෙනස් කරන්න')}</button>
    </form>
  )
}

export default function Profile() {
  const { user, isAdmin } = useAuth()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(!isAdmin)
  const [form, setForm] = useState({ phone: '', street: '', contactName: '', contactPhone: '' })
  const [saving, setSaving] = useState(false)
  const photoInput = useRef(null)

  const fillForm = (t) => {
    setTeacher(t)
    setForm({
      phone: t.phone || '',
      street: t.address?.street || '',
      contactName: t.emergencyContact?.name || '',
      contactPhone: t.emergencyContact?.phone || '',
    })
  }

  useEffect(() => {
    if (isAdmin) return
    teacherAPI.getMe()
      .then(({ data }) => fillForm(data.teacher))
      .catch(() => toast.error(tr('පැතිකඩ ලබාගැනීමට නොහැකි විය')))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const saveDetails = async () => {
    setSaving(true)
    try {
      const { data } = await teacherAPI.update(teacher._id, {
        phone: form.phone,
        address: { ...teacher.address, street: form.street },
        emergencyContact: { ...teacher.emergencyContact, name: form.contactName, phone: form.contactPhone },
      })
      setTeacher(t => ({ ...data.teacher, user: t.user }))
      toast.success(tr('තොරතුරු සුරකින ලදී'))
    } catch (err) { toast.error(err.response?.data?.message || tr('සුරැකීමට නොහැකි විය')) }
    finally { setSaving(false) }
  }

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const profilePhoto = await resizePhoto(file)
      const { data } = await teacherAPI.update(teacher._id, { profilePhoto })
      setTeacher(t => ({ ...data.teacher, user: t.user }))
      toast.success(tr('ඡායාරූපය යාවත්කාලීන විය'))
    } catch (err) { toast.error(err.response?.data?.message || tr('ඡායාරූපය සුරැකීමට නොහැකි විය')) }
  }

  if (loading) return <AppLayout title={tr('මගේ පැතිකඩ')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('මගේ පැතිකඩ')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('මගේ පැතිකඩ')}</h1>
          <p className="page-subtitle">{user?.email}</p>
        </div>
        {teacher && (
          <div className="page-header-actions">
            <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16}/> {tr('මුද්‍රණය කරන්න')}</button>
          </div>
        )}
      </div>

      <div className="settings-stack">
        <div className="card">
          <div className="profile-head">
            <Avatar name={user?.name} photo={teacher?.profilePhoto} size={64} />
            <div className="schedule-main">
              <div className="profile-name">{user?.name}</div>
              <div className="schedule-meta">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            {teacher && (
              <>
                <input ref={photoInput} type="file" accept="image/*" hidden onChange={choosePhoto} />
                <button className="btn btn-sm btn-ghost" onClick={() => photoInput.current?.click()}><Camera size={14}/> {tr('ඡායාරූපය')}</button>
              </>
            )}
          </div>
          {teacher && (
            <div className="detail-list">
              {teacherDetails(teacher).map(([label, value]) => (
                <div key={label} className="detail-row">
                  <span className="text-muted">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {teacher && (
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>{tr('මගේ සම්බන්ධතා තොරතුරු')}</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">{tr('දුරකථන අංකය')}</label>
              <input id="profile-phone" className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-street">{tr('ලිපිනය')}</label>
              <input id="profile-street" className="form-input" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-contact">{tr('හදිසි අවස්ථාවක අමතන්න')}</label>
                <input id="profile-contact" className="form-input" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}/>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-contact-phone">{tr('එම දුරකථන අංකය')}</label>
                <input id="profile-contact-phone" className="form-input" type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}/>
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveDetails} disabled={saving}>{saving ? tr('සුරකිමින්…') : tr('සුරකින්න')}</button>
          </div>
        )}

        <PushCard />
        <PasswordCard />
      </div>

      {teacher && <TeacherRecord teacher={teacher} />}
    </AppLayout>
  )
}
