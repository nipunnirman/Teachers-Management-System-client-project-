import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge, StatCard } from '../components/common'
import { attendanceAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, CalendarCheck, CalendarOff, Clock, TrendingDown } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const STATUSES = ['present','absent','late','half-day','holiday','weekend']

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}
function fmtTime(t) {
  return t ? new Date(t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'
}

export default function Attendance() {
  const { isAdmin } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year]  = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]  = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ teacherId:'', date: now.toISOString().slice(0,10), status:'present', notes:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const { data } = await attendanceAPI.getAll({ month, year })
        setRecords(data.records)
      } else {
        const { data } = await attendanceAPI.getMe({ month, year })
        setRecords(data.records)
        setSummary(data.summary)
      }
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, isAdmin])
  useEffect(() => {
    if (isAdmin) teacherAPI.getAll().then(r => setTeachers(r.data.teachers)).catch(()=>{})
  }, [isAdmin])

  const handleMark = async () => {
    if (!form.teacherId || !form.date) return toast.error('Select teacher and date')
    setSaving(true)
    try {
      await attendanceAPI.mark(form)
      toast.success('Attendance marked')
      setModalOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <AppLayout title="Attendance"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Attendance">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? 'Attendance Management' : 'My Attendance'}</h1>
          <p className="page-subtitle">{MONTHS[month-1]} {year}</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{ width:'auto', minHeight:38 }} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={15}/> Mark
            </button>
          )}
        </div>
      </div>

      {!isAdmin && summary && (
        <div className="stats-grid">
          <StatCard label="Present"  value={summary.present}  accent="green" icon={CalendarCheck} />
          <StatCard label="Absent"   value={summary.absent}   accent="red"   icon={CalendarOff} />
          <StatCard label="Late"     value={summary.late}     accent="amber" icon={Clock} />
          <StatCard label="Half Day" value={summary.halfDay}  accent="blue"  icon={TrendingDown} />
        </div>
      )}

      <div className="card">
        {/* DESKTOP TABLE */}
        <div className="table-wrap">
          {records.length === 0 ? <EmptyState message="No attendance records" sub="Records will appear here once marked." /> : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {isAdmin && <th>Teacher</th>}
                  <th>Status</th><th>Check In</th><th>Check Out</th>
                  {isAdmin && <th>Marked By</th>}
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight:500 }}>{fmtDate(r.date)}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight:500 }}>{r.teacher?.user?.name}</div>
                        <div className="text-sm text-muted">{r.teacher?.teacherId}</div>
                      </td>
                    )}
                    <td><Badge status={r.status}/></td>
                    <td className="text-muted">{fmtTime(r.checkIn)}</td>
                    <td className="text-muted">{fmtTime(r.checkOut)}</td>
                    {isAdmin && <td className="text-muted text-sm">{r.markedBy?.name || '—'}</td>}
                    <td className="text-muted text-sm">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARD LIST */}
        <div className="mobile-list">
          {records.length === 0 ? <EmptyState message="No attendance records" /> : (
            records.map(r => (
              <div key={r._id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div>
                    {isAdmin && <div className="mobile-card-title">{r.teacher?.user?.name}</div>}
                    <div className="mobile-card-sub">{fmtDate(r.date)}</div>
                  </div>
                  <Badge status={r.status}/>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Check In</span>
                  <span className="mobile-card-value">{fmtTime(r.checkIn)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Check Out</span>
                  <span className="mobile-card-value">{fmtTime(r.checkOut)}</span>
                </div>
                {r.notes && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Notes</span>
                    <span className="mobile-card-value" style={{ maxWidth:'65%', textAlign:'right' }}>{r.notes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Mark Attendance"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleMark} disabled={saving}>{saving ? 'Saving…' : 'Mark'}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Teacher *</label>
          <select className="form-select" value={form.teacherId} onChange={e => setForm(f=>({...f,teacherId:e.target.value}))}>
            <option value="">Select teacher…</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name} ({t.teacherId})</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1).replace('-',' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional note…" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
        </div>
      </Modal>
    </AppLayout>
  )
}
