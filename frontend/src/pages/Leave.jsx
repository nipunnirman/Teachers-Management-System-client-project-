import { tr } from '../utils/i18n'
import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge } from '../components/common'
import { leaveAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, CheckCircle, XCircle } from 'lucide-react'
import { LEAVE_TYPE_LABELS, STATUS_LABELS, formatDate } from '../utils/locale'

const LEAVE_TYPES = ['annual','sick','casual','maternity','paternity','unpaid','other']

function fmt(d) {
  return formatDate(d)
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
    } catch { toast.error(tr('නිවාඩු දත්ත ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const handleApply = async () => {
    if (!form.startDate || !form.endDate || !form.reason) return toast.error(tr('අවශ්‍ය සියලු තොරතුරු ඇතුළත් කරන්න'))
    setSaving(true)
    try {
      await leaveAPI.apply(form)
      toast.success(tr('නිවාඩු ඉල්ලීම යවන ලදී'))
      setApplyModal(false)
      setForm({ leaveType:'annual', startDate:'', endDate:'', reason:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || tr('අසාර්ථක විය')) }
    finally { setSaving(false) }
  }

  const handleReview = async (status) => {
    setSaving(true)
    try {
      await leaveAPI.review(reviewModal._id, { status, reviewNote })
      toast.success(status === 'approved' ? tr('නිවාඩුව අනුමත කරන ලදී') : tr('නිවාඩුව ප්‍රතික්ෂේප කරන ලදී'))
      setReviewModal(null); setReviewNote(''); load()
    } catch (err) { toast.error(err.response?.data?.message || tr('අසාර්ථක විය')) }
    finally { setSaving(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm(tr('මෙම නිවාඩු ඉල්ලීම අවලංගු කරන්නද?'))) return
    try { await leaveAPI.cancel(id); toast.success(tr('අවලංගු කරන ලදී')); load() }
    catch { toast.error(tr('අවලංගු කිරීමට නොහැකි විය')) }
  }

  const FILTERS = ['all','pending','approved','rejected','cancelled']
  if (loading) return <AppLayout title={tr('නිවාඩු')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('නිවාඩු කළමනාකරණය')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? tr('නිවාඩු කළමනාකරණය') : tr('මගේ නිවාඩු ඉල්ලීම්')}</h1>
          <p className="page-subtitle">{tr('ඉල්ලීම් {count}', { count: leaves.length })}</p>
        </div>
        {!isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setApplyModal(true)}>
              <Plus size={15}/> {tr('නිවාඩු ඉල්ලන්න')}
            </button>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="filter-pills">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-pill${filter===f ? ' active' : ''}`}>
            {STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="card">
        {/* DESKTOP TABLE */}
        <div className="table-wrap">
          {leaves.length === 0 ? <EmptyState message={tr('නිවාඩු ඉල්ලීම් නොමැත')} /> : (
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>{tr('ගුරුවරයා')}</th>}
                  <th>{tr('වර්ගය')}</th><th>{tr('සිට')}</th><th>{tr('දක්වා')}</th>
                  <th>{tr('දින')}</th><th>{tr('තත්ත්වය')}</th><th>{tr('හේතුව')}</th><th>{tr('ක්‍රියා')}</th>
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
                    <td><span className="badge badge-blue">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</span></td>
                    <td>{fmt(l.startDate)}</td>
                    <td>{fmt(l.endDate)}</td>
                    <td style={{ fontWeight:600 }}>{tr('දින {days}', { days: l.totalDays })}</td>
                    <td><Badge status={l.status}/></td>
                    <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-2)' }}>{l.reason}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {isAdmin && l.status==='pending' && (
                          <button className="btn btn-sm btn-primary" onClick={() => { setReviewModal(l); setReviewNote('') }}>{tr('පරීක්ෂා කරන්න')}</button>
                        )}
                        {!isAdmin && l.status==='pending' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>{tr('අවලංගු කරන්න')}</button>
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
          {leaves.length === 0 ? <EmptyState message={tr('නිවාඩු ඉල්ලීම් නොමැත')} /> : (
            leaves.map(l => (
              <div key={l._id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div>
                    {isAdmin && <div className="mobile-card-title">{l.teacher?.user?.name}</div>}
                    <div className="mobile-card-sub">
                      {tr('{type} නිවාඩු · දින {days}', { type: LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType, days: l.totalDays })}
                    </div>
                  </div>
                  <Badge status={l.status}/>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('සිට')}</span>
                  <span className="mobile-card-value">{fmt(l.startDate)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('දක්වා')}</span>
                  <span className="mobile-card-value">{fmt(l.endDate)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('හේතුව')}</span>
                  <span className="mobile-card-value" style={{ overflowWrap:'anywhere' }}>{l.reason}</span>
                </div>
                {(isAdmin && l.status==='pending') || (!isAdmin && l.status==='pending') ? (
                  <div className="mobile-card-actions">
                    {isAdmin && l.status==='pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => { setReviewModal(l); setReviewNote('') }}>{tr('පරීක්ෂා කරන්න')}</button>
                    )}
                    {!isAdmin && l.status==='pending' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>{tr('අවලංගු කරන්න')}</button>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title={tr('නිවාඩු ඉල්ලීම')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setApplyModal(false)}>{tr('අවලංගු කරන්න')}</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={saving}>{saving ? tr('යවමින්…') : tr('ඉල්ලීම යවන්න')}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">{tr('නිවාඩු වර්ගය *')}</label>
          <select className="form-select" value={form.leaveType} onChange={e => setForm(f=>({...f,leaveType:e.target.value}))}>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('ආරම්භක දිනය *')}</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr('අවසන් දිනය *')}</label>
            <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('හේතුව *')}</label>
          <textarea className="form-textarea" placeholder={tr('හේතුව කෙටියෙන් සඳහන් කරන්න…')} value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))} />
        </div>
      </Modal>

      {/* Review Modal */}
      {reviewModal && (
        <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title={tr('නිවාඩු ඉල්ලීම පරීක්ෂා කිරීම')}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setReviewModal(null)}>{tr('වසන්න')}</button>
            <button className="btn btn-danger" onClick={() => handleReview('rejected')} disabled={saving}><XCircle size={14}/> {tr('ප්‍රතික්ෂේප')}</button>
            <button className="btn btn-primary" onClick={() => handleReview('approved')} disabled={saving}><CheckCircle size={14}/> {tr('අනුමත')}</button>
          </>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
            {[
              [tr('ගුරුවරයා'), reviewModal.teacher?.user?.name],
              [tr('වර්ගය'),    LEAVE_TYPE_LABELS[reviewModal.leaveType] || reviewModal.leaveType],
              [tr('කාලය'),  `${fmt(reviewModal.startDate)} → ${fmt(reviewModal.endDate)}`],
              [tr('දින'),    reviewModal.totalDays],
              [tr('හේතුව'),  reviewModal.reason],
            ].map(([k,v]) => (
              <div key={k} className="detail-row">
                <span className="text-muted">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">{tr('සටහන (අවශ්‍ය නම්)')}</label>
            <textarea className="form-textarea" placeholder={tr('ගුරුවරයා සඳහා සටහනක් එක් කරන්න…')} value={reviewNote} onChange={e => setReviewNote(e.target.value)} style={{ minHeight:70 }} />
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
