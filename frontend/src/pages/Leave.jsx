import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge } from '../components/common'
import { leaveAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, CheckCircle, XCircle } from 'lucide-react'

const LEAVE_TYPES = ['annual','sick','casual','maternity','paternity','unpaid','other']

export default function Leave() {
  const { isAdmin } = useAuth()
  const [leaves, setLeaves]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [applyModal, setApplyModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [form, setForm]           = useState({ leaveType:'annual', startDate:'', endDate:'', reason:'' })
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving]       = useState(false)

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
      setReviewModal(null)
      setReviewNote('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return
    try {
      await leaveAPI.cancel(id)
      toast.success('Leave request cancelled')
      load()
    } catch { toast.error('Failed to cancel') }
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
          <button className="btn btn-primary" onClick={() => setApplyModal(true)}>
            <Plus size={15}/> Apply for Leave
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="btn btn-sm"
            style={{ background: filter===f ? 'var(--gold-dim)' : 'transparent', color: filter===f ? 'var(--gold)' : 'var(--text-2)', border: `1px solid ${filter===f ? 'var(--gold)' : 'var(--border)'}` }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {leaves.length === 0 ? <EmptyState message="No leave requests" /> : (
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Teacher</th>}
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
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
                    <td>{new Date(l.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td>{new Date(l.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td style={{ fontWeight:600 }}>{l.totalDays}d</td>
                    <td><Badge status={l.status}/></td>
                    <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-2)' }}>{l.reason}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {isAdmin && l.status === 'pending' && (
                          <button className="btn btn-sm btn-primary" onClick={() => { setReviewModal(l); setReviewNote('') }}>
                            Review
                          </button>
                        )}
                        {!isAdmin && l.status === 'pending' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>Cancel</button>
                        )}
                        {l.reviewNote && (
                          <span className="text-sm text-muted" title={l.reviewNote} style={{ cursor:'help' }}>Note ℹ</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={saving}>
              <XCircle size={14}/> Reject
            </button>
            <button className="btn btn-primary" onClick={() => handleReview('approved')} disabled={saving}>
              <CheckCircle size={14}/> Approve
            </button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            {[
              ['Teacher', reviewModal.teacher?.user?.name],
              ['Type',    reviewModal.leaveType],
              ['Period',  `${new Date(reviewModal.startDate).toLocaleDateString()} → ${new Date(reviewModal.endDate).toLocaleDateString()}`],
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
