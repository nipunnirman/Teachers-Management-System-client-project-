import { tr } from '../../utils/i18n'
import { useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Avatar, Modal, PageLoader, EmptyState, Badge } from '../../components/common'
import TeacherRecord, { teacherDetails } from '../../components/common/TeacherRecord'
import { resizePhoto } from '../../utils/photo'
import { useDataRefresh } from '../../utils/useDataRefresh'
import { teacherAPI, authAPI } from '../../api'
import toast from 'react-hot-toast'
import { Camera, KeyRound, Plus, Printer, Search, Edit2, Trash2, Eye, X } from 'lucide-react'
import { STATUS_LABELS, formatDate } from '../../utils/locale'

const EMPLOYMENT_TYPES = ['permanent','temporary','part-time']
const blankForm = {
  name:'', email:'', password:'', employmentType:'permanent',
  phone:'', department:'', subjects:'', grades:'',
  nic:'', dateOfBirth:'', appointmentDate:'', qualificationsText:'', street:'', profilePhoto:'',
}

export default function Teachers() {
  const { version } = useDataRefresh()
  const [teachers, setTeachers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(blankForm)
  const [saving, setSaving]       = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const load = async () => {
    try {
      const { data } = await teacherAPI.getAll()
      setTeachers(data.teachers)
    } catch { toast.error(tr('ගුරු දත්ත ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [version])

  const filtered = teachers.filter(t =>
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setEditing(null); setForm(blankForm); setModalOpen(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({
      name: t.user?.name || '', email: t.user?.email || '', password: '',
      employmentType: t.employmentType || 'permanent',
      phone: t.phone || '', department: t.department || '',
      subjects: (t.subjects || []).join(', '),
      grades:   (t.grades || []).join(', '),
      nic: t.nic || '',
      dateOfBirth: t.dateOfBirth?.slice(0, 10) || '',
      appointmentDate: t.appointmentDate?.slice(0, 10) || '',
      qualificationsText: t.qualificationsText || '',
      street: t.address?.street || '',
      profilePhoto: t.profilePhoto || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error(tr('නම සහ ඊමේල් ලිපිනය අවශ්‍යයි'))
    setSaving(true)
    const profile = {
      employmentType: form.employmentType,
      phone: form.phone, department: form.department,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      grades:   form.grades.split(',').map(s => s.trim()).filter(Boolean),
      nic: form.nic,
      dateOfBirth: form.dateOfBirth,
      appointmentDate: form.appointmentDate,
      qualificationsText: form.qualificationsText,
      address: { ...editing?.address, street: form.street },
      profilePhoto: form.profilePhoto,
    }
    try {
      if (editing) {
        await teacherAPI.update(editing._id, profile)
        toast.success(tr('ගුරු තොරතුරු යාවත්කාලීන විය'))
      } else {
        await authAPI.register({ name: form.name, email: form.email, password: form.password, role: 'teacher', profile })
        toast.success(tr('ගුරුවරයා ලියාපදිංචි විය'))
      }
      setModalOpen(false); load()
    } catch (err) {
      toast.error(err.response?.data?.message || tr('සුරැකීමට නොහැකි විය'))
    } finally { setSaving(false) }
  }

  const handleDelete = async (t) => {
    if (!confirm(tr('{name} ඉවත් කරන්නද? මෙය ආපසු හැරවිය නොහැක.', { name: t.user?.name }))) return
    try { await teacherAPI.remove(t._id); toast.success(tr('ගුරුවරයා ඉවත් කරන ලදී')); load() }
    catch { toast.error(tr('ඉවත් කිරීමට නොහැකි විය')) }
  }

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const profilePhoto = await resizePhoto(file)
      setForm(f => ({ ...f, profilePhoto }))
    } catch { toast.error(tr('ඡායාරූපය සුරැකීමට නොහැකි විය')) }
  }

  const resetPassword = async () => {
    if (newPassword.length < 8) return toast.error(tr('නව මුරපදයේ අවම වශයෙන් අක්ෂර 8ක් තිබිය යුතුය'))
    try {
      const { data } = await authAPI.adminReset(viewModal.user._id, { newPassword })
      toast.success(data.message)
      setNewPassword('')
    } catch (err) { toast.error(err.response?.data?.message || tr('මුරපදය වෙනස් කිරීමට නොහැකි විය')) }
  }


  if (loading) return <AppLayout title={tr('ගුරුවරු')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('ගුරුවරු')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('ගුරුවරු')}</h1>
          <p className="page-subtitle">{tr('ගුරුවරු {count}', { count: teachers.length })}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> {tr('ගුරුවරයෙකු එක් කරන්න')}</button>
        </div>
      </div>

      <div className="card">
        {/* Search row */}
        <div className="toolbar">
          <div className="search-bar">
            <Search size={16}/>
            <input placeholder={tr('නම, ඊමේල් හෝ අංශය සොයන්න…')} value={search} onChange={e => setSearch(e.target.value)}/>
            {search && <button className="search-clear" aria-label={tr('සෙවුම මකන්න')} onClick={() => setSearch('')}><X size={14}/></button>}
          </div>
                  </div>

        {/* DESKTOP TABLE */}
        <div className="table-wrap">
          {filtered.length === 0 ? <EmptyState message={tr('ගුරුවරු හමු නොවීය')}/> : (
            <table>
              <thead>
                <tr>
                  <th>{tr('ගුරුවරයා')}</th><th>{tr('අංකය')}</th><th>{tr('අංශය')}</th>
                  <th>{tr('විෂයයන්')}</th><th>{tr('වර්ගය')}</th><th>{tr('තත්ත්වය')}</th><th>{tr('ක්‍රියා')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={t.user?.name} photo={t.profilePhoto} />
                        <div>
                          <div style={{ fontWeight:500 }}>{t.user?.name}</div>
                          <div className="text-sm text-muted">{t.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-muted">{t.teacherId}</span></td>
                    <td>{t.department || <span className="text-muted">—</span>}</td>
                    <td>
                      {t.subjects?.length > 0
                        ? <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                            {t.subjects.slice(0,3).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                            {t.subjects.length > 3 && <span className="badge badge-gray">+{t.subjects.length-3}</span>}
                          </div>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td><Badge status={t.employmentType}/></td>
                    <td><Badge status={t.user?.isActive ? 'active' : 'inactive'}/></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setNewPassword(''); setViewModal(t) }} title={tr('බලන්න')} aria-label={tr('බලන්න')}><Eye size={14}/></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => openEdit(t)} title={tr('සංස්කරණය')} aria-label={tr('සංස්කරණය')}><Edit2 size={14}/></button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(t)} title={tr('මකන්න')} aria-label={tr('මකන්න')}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARD LIST */}
        <div className="mobile-list">
          {filtered.length === 0 ? <EmptyState message={tr('ගුරුවරු හමු නොවීය')}/> : (
            filtered.map(t => (
              <div key={t._id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={t.user?.name} photo={t.profilePhoto} size={40} />
                    <div>
                      <div className="mobile-card-title">{t.user?.name}</div>
                      <div className="mobile-card-sub">{t.user?.email}</div>
                    </div>
                  </div>
                  <Badge status={t.user?.isActive ? 'active' : 'inactive'}/>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('අංකය')}</span>
                  <span className="mobile-card-value">{t.teacherId}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('අංශය')}</span>
                  <span className="mobile-card-value">{t.department || '—'}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('වර්ගය')}</span>
                  <span className="mobile-card-value"><Badge status={t.employmentType}/></span>
                </div>
                {t.subjects?.length > 0 && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{tr('විෂයයන්')}</span>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {t.subjects.slice(0,2).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                      {t.subjects.length > 2 && <span className="badge badge-gray">+{t.subjects.length-2}</span>}
                    </div>
                  </div>
                )}
                <div className="mobile-card-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => { setNewPassword(''); setViewModal(t) }}><Eye size={13}/> {tr('බලන්න')}</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(t)}><Edit2 size={13}/> {tr('සංස්කරණය')}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t)}><Trash2 size={13}/> {tr('මකන්න')}</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? tr('ගුරු තොරතුරු සංස්කරණය') : tr('නව ගුරුවරයෙකු එක් කිරීම')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{tr('අවලංගු කරන්න')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? tr('සුරකිමින්…') : editing ? tr('සුරකින්න') : tr('ලියාපදිංචි කරන්න')}
          </button>
        </>}>
        {!editing && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{tr('සම්පූර්ණ නම *')}</label>
              <input className="form-input" placeholder={tr('කමලා පෙරේරා')} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">{tr('ඊමේල් ලිපිනය *')}</label>
              <input className="form-input" type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/>
            </div>
          </div>
        )}
        {!editing && (
          <div className="form-group">
            <label className="form-label">{tr('මුරපදය *')}</label>
            <input className="form-input" type="password" placeholder={tr('අවම වශයෙන් අක්ෂර 8ක්')} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}/>
          </div>
        )}
        <div className="form-group photo-field">
          <Avatar name={form.name || editing?.user?.name} photo={form.profilePhoto} size={52} />
          <label className="btn btn-sm btn-ghost">
            <Camera size={14}/> {tr('ඡායාරූපය')}
            <input type="file" accept="image/*" hidden onChange={choosePhoto} />
          </label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('ජාතික හැඳුනුම්පත් අංකය')}</label>
            <input className="form-input" value={form.nic} onChange={e => setForm(f=>({...f,nic:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('උපන් දිනය')}</label>
            <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm(f=>({...f,dateOfBirth:e.target.value}))}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('ලිපිනය')}</label>
          <input className="form-input" value={form.street} onChange={e => setForm(f=>({...f,street:e.target.value}))}/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('පත්වීම් දිනය')}</label>
            <input className="form-input" type="date" value={form.appointmentDate} onChange={e => setForm(f=>({...f,appointmentDate:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('සුදුසුකම්')}</label>
            <input className="form-input" placeholder={tr('උපාධිය, ඩිප්ලෝමාව')} value={form.qualificationsText} onChange={e => setForm(f=>({...f,qualificationsText:e.target.value}))}/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('අංශය')}</label>
            <input className="form-input" placeholder={tr('විද්‍යාව')} value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('දුරකථන අංකය')}</label>
            <input className="form-input" type="tel" placeholder="+94 71 234 5678" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('විෂයයන් (කොමා යොදා වෙන් කරන්න)')}</label>
            <input className="form-input" placeholder={tr('ගණිතය, විද්‍යාව')} value={form.subjects} onChange={e => setForm(f=>({...f,subjects:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('ශ්‍රේණි (කොමා යොදා වෙන් කරන්න)')}</label>
            <input className="form-input" placeholder={tr('9 ශ්‍රේණිය, 10 ශ්‍රේණිය')} value={form.grades} onChange={e => setForm(f=>({...f,grades:e.target.value}))}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('සේවා වර්ගය')}</label>
          <select className="form-select" value={form.employmentType} onChange={e => setForm(f=>({...f,employmentType:e.target.value}))}>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{STATUS_LABELS[t]}</option>)}
          </select>
        </div>
      </Modal>

      {/* View Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={tr('ගුරු පැතිකඩ')}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setViewModal(null)}>{tr('වසන්න')}</button>
            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={15}/> {tr('මුද්‍රණය කරන්න')}</button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <Avatar name={viewModal.user?.name} photo={viewModal.profilePhoto} size={52} />
              <div>
                <div style={{ fontWeight:600, fontSize:16 }}>{viewModal.user?.name}</div>
                <div className="text-muted text-sm">{viewModal.user?.email}</div>
                <div style={{ marginTop:4 }}><Badge status={viewModal.employmentType}/></div>
              </div>
            </div>
            {teacherDetails(viewModal).map(([k,v]) => (
              <div key={k} className="detail-row">
                <span className="text-muted">{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="reset-password">
              <label className="form-label" htmlFor="reset-password">{tr('මෙම ගුරුවරයාගේ මුරපදය යළි සකසන්න')}</label>
              <div className="relief-assign">
                <input id="reset-password" className="form-input" type="password" autoComplete="new-password" placeholder={tr('අවම වශයෙන් අක්ෂර 8ක්')} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button className="btn btn-ghost" onClick={resetPassword}><KeyRound size={15}/> {tr('යළි සකසන්න')}</button>
              </div>
            </div>
          </div>
          <TeacherRecord teacher={viewModal} />
        </Modal>
      )}
    </AppLayout>
  )
}
