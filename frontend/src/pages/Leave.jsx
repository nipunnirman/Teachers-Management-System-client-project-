import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge } from '../components/common'
import { leaveAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, CheckCircle, XCircle } from 'lucide-react'

const LEAVE_TYPES = ['annual','sick','casual','maternity','paternity','unpaid','other']

function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

export default function Leave() {
  const { isAdmin } = useAuth()
  const [leaves, setLeaves]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [applyModal, setApplyModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [form, setForm]             = useState({ leaveType:'annual', startDate:'', endDate:'', reason:'' })
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await leaveAPI.getAll(params)
      setLeaves(data.leaves)
    } catch { toast.error('Failed to load leaves') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const handleApply = async () => {
    if (!form.startDate || !form.endDate || !form.reason) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await leaveAPI.apply(form)
      toast.success('Leave request submitted')
      setApplyModal(false)
      setForm({ leaveType:'annual', startDate:'', endDate:'', reason:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleReview = async (status) => {
    setSaving(true)
    try {
      await leaveAPI.review(reviewModal._id, { status, reviewNote })
      toast.success(`Leave ${status}`)
      setReviewModal(null); setReviewNote(''); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return
    try { await leaveAPI.cancel(id); toast.success('Cancelled'); load() }
    catch { toast.error('Failed to cancel') }
  }

  const FILTERS = ['all','pending','approved','rejected','cancelled']
  if (loading) return <AppLayout title="Leave"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Leave Management">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? 'Leave Management' : 'My Leave Requests'}</h1>
          <p className="page-subtitle">{leaves.length} total requests</p>
        </div>
        {!isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setApplyModal(true)}>
              <Plus size={15}/> Apply for Leave
            </button>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="filter-pills">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-pill${filter===f ? ' active' : ''}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {/* DESKTOP TABLE */}
        <div className="table-wrap">
          {leaves.length === 0 ? <EmptyState message="No leave requests" /> : (
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Teacher</th>}
                  <th>Type</th><th>From</th><th>To</th>
                  <th>Days</th><th>Status</th><th>Reason</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight:500 }}>{l.teacher?.user?.name}</div>
                        <div className="text-sm text-muted">{l.teacher?.teacherId}</div>
                      </td>
                    )}
                    <td><span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{l.leaveType}</span></td>
                    <td>{fmt(l.startDate)}</td>
                    <td>{fmt(l.endDate)}</td>
                    <td style={{ fontWeight:600 }}>{l.totalDays}d</td>
                    <td><Badge status={l.status}/></td>
                    <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-2)' }}>{l.reason}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {isAdmin && l.status==='pending' && (
                          <button className="btn btn-sm btn-primary" onClick={() => { setReviewModal(l); setReviewNote('') }}>Review</button>
                        )}
                        {!isAdmin && l.status==='pending' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>Cancel</button>
                        )}
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
          {leaves.length === 0 ? <EmptyState message="No leave requests" /> : (
            leaves.map(l => (
              <div key={l._id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div>
                    {isAdmin && <div className="mobile-card-title">{l.teacher?.user?.name}</div>}
                    <div className="mobile-card-sub" style={{ textTransform:'capitalize' }}>
                      {l.leaveType} leave · {l.totalDays} day{l.totalDays!==1?'s':''}
                    </div>
                  </div>
                  <Badge status={l.status}/>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">From</span>
                  <span className="mobile-card-value">{fmt(l.startDate)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">To</span>
                  <span className="mobile-card-value">{fmt(l.endDate)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Reason</span>
                  <span className="mobile-card-value" style={{ maxWidth:'60%', textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.reason}</span>
                </div>
                {(isAdmin && l.status==='pending') || (!isAdmin && l.status==='pending') ? (
                  <div className="mobile-card-actions">
                    {isAdmin && l.status==='pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => { setReviewModal(l); setReviewNote('') }}>Review</button>
                    )}
                    {!isAdmin && l.status==='pending' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>Cancel</button>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply for Leave"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setApplyModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Leave Type *</label>
          <select className="form-select" value={form.leaveType} onChange={e => setForm(f=>({...f,leaveType:e.target.value}))}>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Reason *</label>
          <textarea className="form-textarea" placeholder="Briefly describe your reason…" value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))} />
        </div>
      </Modal>

      {/* Review Modal */}
      {reviewModal && (
        <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Leave Request"
          footer={<>
            <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={saving}><XCircle size={14}/> Reject</button>
            <button className="btn btn-primary" onClick={() => handleReview('approved')} disabled={saving}><CheckCircle size={14}/> Approve</button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            {[
              ['Teacher', reviewModal.teacher?.user?.name],
              ['Type',    reviewModal.leaveType],
              ['Period',  `${fmt(reviewModal.startDate)} → ${fmt(reviewModal.endDate)}`],
              ['Days',    reviewModal.totalDays],
              ['Reason',  reviewModal.reason],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, gap:16 }}>
                <span className="text-muted">{k}</span>
                <span style={{ fontWeight:500, textAlign:'right', textTransform:'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea className="form-textarea" placeholder="Add a note for the teacher…" value={reviewNote} onChange={e => setReviewNote(e.target.value)} style={{ minHeight:70 }} />
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
