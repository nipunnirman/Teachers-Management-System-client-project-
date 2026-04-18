import { useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge } from '../../components/common'
import { teacherAPI, authAPI } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, Eye, X } from 'lucide-react'

const EMPLOYMENT_TYPES = ['permanent','temporary','part-time']

const blankForm = {
  name:'', email:'', password:'', employmentType:'permanent',
  phone:'', department:'', subjects:'', grades:'',
}

export default function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(blankForm)
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    try {
      const { data } = await teacherAPI.getAll()
      setTeachers(data.teachers)
    } catch { toast.error('Failed to load teachers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

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
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required')
    setSaving(true)
    try {
      if (editing) {
        await teacherAPI.update(editing._id, {
          employmentType: form.employmentType,
          phone: form.phone, department: form.department,
          subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
          grades:   form.grades.split(',').map(s => s.trim()).filter(Boolean),
        })
        toast.success('Teacher updated')
      } else {
        await authAPI.register({ name: form.name, email: form.email, password: form.password, role: 'teacher' })
        toast.success('Teacher registered')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (t) => {
    if (!confirm(`Remove ${t.user?.name}? This action cannot be undone.`)) return
    try {
      await teacherAPI.remove(t._id)
      toast.success('Teacher removed')
      load()
    } catch { toast.error('Failed to remove') }
  }

  if (loading) return <AppLayout title="Teachers"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Teachers">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{teachers.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Teacher
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="search-bar">
            <Search size={15} style={{ color:'var(--text-3)', flexShrink:0 }} />
            <input placeholder="Search name, email, department…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', display:'flex' }}><X size={14}/></button>}
          </div>
          <span className="text-sm text-muted">{filtered.length} results</span>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? <EmptyState message="No teachers found" /> : (
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Subjects</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="user-avatar" style={{ width:32, height:32, fontSize:13 }}>
                          {t.user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
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
                    <td><Badge status={t.employmentType} /></td>
                    <td><Badge status={t.user?.isActive ? 'active' : 'inactive'} /></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-icon btn-ghost" onClick={() => setViewModal(t)} title="View"><Eye size={14}/></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => openEdit(t)} title="Edit"><Edit2 size={14}/></button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(t)} title="Remove"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Teacher' : 'Add New Teacher'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Register Teacher'}
          </button>
        </>}
      >
        {!editing && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Jane Doe" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="jane@school.edu" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
            </div>
          </div>
        )}
        {!editing && (
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" placeholder="Science" value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="+1 234 567 890" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Subjects (comma-separated)</label>
            <input className="form-input" placeholder="Math, Physics" value={form.subjects} onChange={e => setForm(f=>({...f,subjects:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Grades (comma-separated)</label>
            <input className="form-input" placeholder="Grade 9, Grade 10" value={form.grades} onChange={e => setForm(f=>({...f,grades:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Employment Type</label>
          <select className="form-select" value={form.employmentType} onChange={e => setForm(f=>({...f,employmentType:e.target.value}))}>
            {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
      </Modal>

      {/* View Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Teacher Profile"
          footer={<button className="btn btn-ghost" onClick={() => setViewModal(null)}>Close</button>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 0', borderBottom:'1px solid var(--border)' }}>
              <div className="user-avatar" style={{ width:52, height:52, fontSize:20 }}>
                {viewModal.user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:16 }}>{viewModal.user?.name}</div>
                <div className="text-muted text-sm">{viewModal.user?.email}</div>
                <div style={{ marginTop:4 }}><Badge status={viewModal.employmentType}/></div>
              </div>
            </div>
            {[
              ['Teacher ID', viewModal.teacherId],
              ['Department', viewModal.department || '—'],
              ['Phone', viewModal.phone || '—'],
              ['Subjects', viewModal.subjects?.join(', ') || '—'],
              ['Grades',   viewModal.grades?.join(', ') || '—'],
              ['Joined',   viewModal.joiningDate ? new Date(viewModal.joiningDate).toLocaleDateString() : '—'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13.5 }}>
                <span className="text-muted">{k}</span>
                <span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
