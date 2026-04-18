import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState } from '../components/common'
import { timetableAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [1,2,3,4,5,6,7,8]
const COLORS = { Monday:'var(--gold)', Tuesday:'var(--green)', Wednesday:'var(--blue)', Thursday:'var(--amber)', Friday:'var(--red)', Saturday:'var(--text-2)' }

export default function Timetable() {
  const { isAdmin } = useAuth()
  const [entries, setEntries]   = useState([])
  const [weekly, setWeekly]     = useState({})
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [form, setForm] = useState({ teacher:'', subject:'', grade:'', className:'', day:'Monday', period:1, startTime:'08:00', endTime:'08:45', academicYear:'2025-2026' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      let fetchedEntries = []
      if (isAdmin) {
        const query = { academicYear }
        if (selectedTeacherId) query.teacherId = selectedTeacherId
        const { data } = await timetableAPI.getAll(query)
        fetchedEntries = data.entries
      } else {
        const { data } = await timetableAPI.getMe({ academicYear })
        fetchedEntries = data.entries
      }
      
      setEntries(fetchedEntries)
      // Build weekly grid mapping period to array of entries
      const w = {}
      DAYS.forEach(d => { w[d] = {} })
      fetchedEntries.forEach(e => { 
        if (w[e.day]) {
          if (!w[e.day][e.period]) w[e.day][e.period] = []
          w[e.day][e.period].push(e) 
        }
      })
      setWeekly(w)
    } catch { toast.error('Failed to load timetable') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [academicYear, isAdmin, selectedTeacherId])
  useEffect(() => { if (isAdmin) teacherAPI.getAll().then(r => setTeachers(r.data.teachers)).catch(()=>{}) }, [isAdmin])

  const handleCreate = async () => {
    if (!form.subject || !form.className) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await timetableAPI.create({ ...form, academicYear })
      toast.success('Timetable entry added')
      setModalOpen(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed — check for conflicts') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this entry?')) return
    try { await timetableAPI.remove(id); toast.success('Removed'); load() }
    catch { toast.error('Failed') }
  }

  if (loading) return <AppLayout title="Timetable"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Timetable">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? 'Timetable Management' : 'My Timetable'}</h1>
          <p className="page-subtitle">Academic Year {academicYear}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {isAdmin && (
            <select className="form-select" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} style={{ width:180 }}>
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name}</option>)}
            </select>
          )}
          <input className="form-input" style={{ width:140 }} placeholder="2025-2026" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
          {isAdmin && <button className="btn btn-primary" onClick={() => { setForm(f=>({...f, teacher: selectedTeacherId})); setModalOpen(true) }}><Plus size={15}/> Add Entry</button>}
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="card" style={{ overflowX:'auto' }}>
        <table style={{ minWidth:700 }}>
          <thead>
            <tr>
              <th style={{ width:70 }}>Period</th>
              {DAYS.map(d => <th key={d} style={{ color: COLORS[d] }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(p => (
              <tr key={p}>
                <td style={{ fontWeight:600, color:'var(--text-3)', fontSize:12, textAlign:'center' }}>{p}</td>
                {DAYS.map(d => {
                  const arr = weekly[d]?.[p] || []
                  return (
                    <td key={d} style={{ padding:'6px 8px', verticalAlign:'top' }}>
                      {arr.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {arr.map(e => (
                            <div key={e._id} style={{ background:`${COLORS[d]}14`, border:`1px solid ${COLORS[d]}30`, borderRadius:8, padding:'8px 10px', position:'relative', minHeight:56 }}>
                              <div style={{ fontWeight:600, fontSize:13, color: COLORS[d] }}>{e.subject}</div>
                              <div style={{ fontSize:11.5, color:'var(--text-2)', marginTop:2 }}>{e.className}</div>
                              {isAdmin && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{e.teacher?.user?.name}</div>}
                              <div style={{ fontSize:11, color:'var(--text-3)' }}>{e.startTime}–{e.endTime}</div>
                              {isAdmin && (
                                <button onClick={() => handleDelete(e._id)} style={{ position:'absolute', top:6, right:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:2, display:'flex' }}>
                                  <Trash2 size={12}/>
                                </button>
                              )}
                            </div>
                          ))}
                          {isAdmin && (
                            <button onClick={() => { setForm(f=>({...f, day:d, period:p, teacher: selectedTeacherId})); setModalOpen(true) }}
                              style={{ background:'none', border:'1px dashed var(--border)', borderRadius:8, width:'100%', height:32, cursor:'pointer', color:'var(--text-3)', fontSize:16, transition:'all 0.15s', marginTop:2 }}
                              onMouseEnter={e => e.target.style.borderColor='var(--gold)'}
                              onMouseLeave={e => e.target.style.borderColor='var(--border)'}
                            >+</button>
                          )}
                        </div>
                      ) : (
                        <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {isAdmin && (
                            <button onClick={() => { setForm(f=>({...f, day:d, period:p, teacher: selectedTeacherId})); setModalOpen(true) }}
                              style={{ background:'none', border:'1px dashed var(--border)', borderRadius:8, width:'100%', height:48, cursor:'pointer', color:'var(--text-3)', fontSize:18, transition:'all 0.15s' }}
                              onMouseEnter={e => e.target.style.borderColor='var(--gold)'}
                              onMouseLeave={e => e.target.style.borderColor='var(--border)'}
                            >+</button>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Timetable Entry"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Add Entry'}</button>
        </>}>
        {isAdmin && (
          <div className="form-group">
            <label className="form-label">Teacher *</label>
            <select className="form-select" value={form.teacher} onChange={e => setForm(f=>({...f,teacher:e.target.value}))}>
              <option value="">Select teacher…</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="form-input" placeholder="Mathematics" value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Class *</label>
            <input className="form-input" placeholder="Grade 10A" value={form.className} onChange={e => setForm(f=>({...f,className:e.target.value}))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Grade</label>
            <input className="form-input" placeholder="Grade 10" value={form.grade} onChange={e => setForm(f=>({...f,grade:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Day</label>
            <select className="form-select" value={form.day} onChange={e => setForm(f=>({...f,day:e.target.value}))}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Period</label>
            <select className="form-select" value={form.period} onChange={e => setForm(f=>({...f,period:+e.target.value}))}>
              {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input className="form-input" type="time" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">End Time</label>
          <input className="form-input" type="time" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))} />
        </div>
      </Modal>
    </AppLayout>
  )
}
