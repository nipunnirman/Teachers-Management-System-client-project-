import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState } from '../components/common'
import { timetableAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [1,2,3,4,5,6,7,8]
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const todayOrMonday = () => {
  const today = WEEKDAYS[new Date().getDay()]
  return DAYS.includes(today) ? today : 'Monday'
}

export default function Timetable() {
  const { isAdmin } = useAuth()
  const [entries, setEntries]               = useState([])
  const [weekly, setWeekly]                 = useState({})
  const [teachers, setTeachers]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [modalOpen, setModalOpen]           = useState(false)
  const [academicYear, setAcademicYear]     = useState('2025-2026')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [activeDay, setActiveDay]           = useState(todayOrMonday) // for mobile tab
  const [form, setForm] = useState({ teacher:'', subject:'', grade:'', className:'', day:'Monday', period:1, startTime:'08:00', endTime:'08:45', academicYear:'2025-2026' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      let fetched = []
      if (isAdmin) {
        const query = { academicYear }
        if (selectedTeacherId) query.teacherId = selectedTeacherId
        const { data } = await timetableAPI.getAll(query)
        fetched = data.entries
      } else {
        const { data } = await timetableAPI.getMe({ academicYear })
        fetched = data.entries
      }
      setEntries(fetched)
      const w = {}
      DAYS.forEach(d => { w[d] = {} })
      fetched.forEach(e => {
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
      toast.success('Entry added'); setModalOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed — check for conflicts') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this entry?')) return
    try { await timetableAPI.remove(id); toast.success('Removed'); load() }
    catch { toast.error('Failed') }
  }

  if (loading) return <AppLayout title="Timetable"><PageLoader /></AppLayout>

  // Classes for the current mobile day tab, in period order
  const dayClasses = PERIODS.flatMap(p => weekly[activeDay]?.[p] || [])
  const openAddFor = (day, period) => {
    setForm(f => ({ ...f, day, period, teacher: selectedTeacherId }))
    setModalOpen(true)
  }

  return (
    <AppLayout title="Timetable">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? 'Timetable Management' : 'My Timetable'}</h1>
          <p className="page-subtitle">Academic Year {academicYear}</p>
        </div>
        <div className="page-header-actions">
          {isAdmin && (
            <select className="form-select" aria-label="Filter by teacher" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name}</option>)}
            </select>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => openAddFor(activeDay, form.period)}>
              <Plus size={15}/> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP: full weekly grid */}
      <div className="card timetable-desktop">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="tt-period">Period</th>
                {DAYS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(p => (
                <tr key={p}>
                  <td className="tt-period">{p}</td>
                  {DAYS.map(d => {
                    const arr = weekly[d]?.[p] || []
                    return (
                      <td key={d}>
                        {arr.length > 0 ? (
                          <div className="tt-stack">
                            {arr.map(e => (
                              <div key={e._id} className="tt-entry">
                                <div className="tt-subject">{e.subject}</div>
                                <div className="tt-meta">{e.className}</div>
                                {isAdmin && <div className="tt-meta">{e.teacher?.user?.name}</div>}
                                <div className="tt-meta">{e.startTime}–{e.endTime}</div>
                                {isAdmin && (
                                  <button className="tt-delete" onClick={() => handleDelete(e._id)} aria-label={`Remove ${e.subject}`}>
                                    <Trash2 size={13}/>
                                  </button>
                                )}
                              </div>
                            ))}
                            {isAdmin && (
                              <button className="tt-add" onClick={() => openAddFor(d, p)} aria-label={`Add class on ${d}, period ${p}`}><Plus size={14}/></button>
                            )}
                          </div>
                        ) : isAdmin && (
                          <button className="tt-add" onClick={() => openAddFor(d, p)} aria-label={`Add class on ${d}, period ${p}`}><Plus size={15}/></button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE: day tabs + list */}
      <div className="mobile-timetable-view">
        <div className="filter-pills">
          {DAYS.map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`filter-pill${activeDay===d ? ' active' : ''}`}>
              {d.slice(0,3)}
            </button>
          ))}
        </div>

        <div className="card">
          {dayClasses.length === 0 ? (
            <EmptyState message={`No classes on ${activeDay}`} />
          ) : (
            <div className="schedule-list">
              {dayClasses.map(e => (
                <div key={e._id} className="schedule-row">
                  <span className="period-chip" title={`Period ${e.period}`}>P{e.period}</span>
                  <div className="schedule-main">
                    <div className="schedule-subject">{e.subject}</div>
                    <div className="schedule-meta">{e.className} {e.grade && `· ${e.grade}`}</div>
                    {isAdmin && <div className="schedule-meta">{e.teacher?.user?.name}</div>}
                    <div className="schedule-meta">{e.startTime} – {e.endTime}</div>
                  </div>
                  {isAdmin && (
                    <button className="notif-delete" onClick={() => handleDelete(e._id)} aria-label={`Remove ${e.subject}`}>
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
            <input className="form-input" placeholder="Mathematics" value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Class *</label>
            <input className="form-input" placeholder="Grade 10A" value={form.className} onChange={e => setForm(f=>({...f,className:e.target.value}))}/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Grade</label>
            <input className="form-input" placeholder="Grade 10" value={form.grade} onChange={e => setForm(f=>({...f,grade:e.target.value}))}/>
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
            <input className="form-input" type="time" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">End Time</label>
          <input className="form-input" type="time" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))}/>
        </div>
      </Modal>
    </AppLayout>
  )
}
