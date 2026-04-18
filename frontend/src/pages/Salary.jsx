import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge, StatCard } from '../components/common'
import { salaryAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Salary() {
  const { isAdmin } = useAuth()
  const now = new Date()
  const [salaries, setSalaries]     = useState([])
  const [teachers, setTeachers]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [genModal, setGenModal]     = useState(false)
  const [viewModal, setViewModal]   = useState(null)
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear]  = useState(now.getFullYear())
  const [form, setForm] = useState({ teacherId:'', month: now.getMonth()+1, year: now.getFullYear(), bonus:0, notes:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const { data } = await salaryAPI.getAll({ month: filterMonth, year: filterYear })
        setSalaries(data.salaries)
      } else {
        const { data } = await salaryAPI.getMe()
        setSalaries(data.salaries)
      }
    } catch { toast.error('Failed to load salary data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterMonth, isAdmin])
  useEffect(() => { if (isAdmin) teacherAPI.getAll().then(r => setTeachers(r.data.teachers)).catch(()=>{}) }, [isAdmin])

  const handleGenerate = async () => {
    if (!form.teacherId) return toast.error('Select a teacher')
    setSaving(true)
    try {
      await salaryAPI.generate(form)
      toast.success('Salary generated successfully')
      setGenModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleMarkPaid = async (id) => {
    try {
      await salaryAPI.markPaid(id)
      toast.success('Marked as paid')
      load()
    } catch { toast.error('Failed') }
  }

  const totalNet = salaries.reduce((a,s) => a + (s.netSalary||0), 0)

  if (loading) return <AppLayout title="Salary"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Salary & Payroll">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? 'Salary & Payroll' : 'My Salary'}</h1>
          <p className="page-subtitle">{isAdmin ? `${MONTHS[filterMonth-1]} ${filterYear}` : 'Complete salary history'}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {isAdmin && (
            <>
              <select className="form-select" style={{ width:'auto' }} value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => setGenModal(true)}>
                <Plus size={15}/> Generate Salary
              </button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:24 }}>
          <StatCard label="Total Slips" value={salaries.length} accent="gold" icon={DollarSign} />
          <StatCard label="Total Net Payroll" value={`$${totalNet.toLocaleString()}`} accent="green" icon={TrendingUp} />
          <StatCard label="Paid" value={salaries.filter(s=>s.status==='paid').length} accent="blue" icon={CheckCircle} />
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          {salaries.length === 0 ? <EmptyState message="No salary records" sub="Generate salary slips to see them here." /> : (
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Teacher</th>}
                  <th>Period</th>
                  <th>Base Salary</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(s => (
                  <tr key={s._id}>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight:500 }}>{s.teacher?.user?.name}</div>
                        <div className="text-sm text-muted">{s.teacher?.teacherId}</div>
                      </td>
                    )}
                    <td style={{ fontWeight:500 }}>{MONTHS[s.month-1]} {s.year}</td>
                    <td>${s.baseSalary?.toLocaleString()}</td>
                    <td className="text-green">${s.grossSalary?.toLocaleString()}</td>
                    <td className="text-red">-${s.totalDeductions?.toLocaleString()}</td>
                    <td style={{ fontWeight:700, color:'var(--text-1)' }}>${s.netSalary?.toLocaleString()}</td>
                    <td><Badge status={s.status}/></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setViewModal(s)}>View Slip</button>
                        {isAdmin && s.status === 'processed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleMarkPaid(s._id)}>Mark Paid</button>
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

      {/* Generate Modal */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate Salary"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setGenModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={saving}>{saving ? 'Generating…' : 'Generate'}</button>
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
            <label className="form-label">Month</label>
            <select className="form-select" value={form.month} onChange={e => setForm(f=>({...f,month:+e.target.value}))}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input className="form-input" type="number" value={form.year} onChange={e => setForm(f=>({...f,year:+e.target.value}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Bonus ($)</label>
          <input className="form-input" type="number" min="0" value={form.bonus} onChange={e => setForm(f=>({...f,bonus:+e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional note…" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
        </div>
      </Modal>

      {/* Salary Slip Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Salary Slip"
          footer={<button className="btn btn-ghost" onClick={() => setViewModal(null)}>Close</button>}>
          <div style={{ background:'var(--bg)', borderRadius:12, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <div>
                <div className="font-display" style={{ fontSize:18 }}>EduManage</div>
                <div className="text-muted text-sm">Salary Slip</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:600 }}>{MONTHS[viewModal.month-1]} {viewModal.year}</div>
                <Badge status={viewModal.status} />
              </div>
            </div>
            <div style={{ marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontWeight:600, marginBottom:2 }}>{viewModal.teacher?.user?.name}</div>
              <div className="text-muted text-sm">{viewModal.teacher?.user?.email}</div>
              <div className="text-muted text-sm">{viewModal.teacher?.teacherId} · {viewModal.teacher?.employmentType}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div>
                <div className="text-muted text-sm" style={{ marginBottom:8, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Earnings</div>
                {[
                  ['Base Salary', viewModal.baseSalary],
                  ['Transport',   viewModal.allowances?.transport],
                  ['Housing',     viewModal.allowances?.housing],
                  ['Other',       viewModal.allowances?.other],
                  ['Bonus',       viewModal.bonus],
                ].map(([k,v]) => v > 0 && (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                    <span className="text-muted">{k}</span>
                    <span className="text-green">+${v?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid var(--border)', paddingTop:8, marginTop:8 }}>
                  <span>Gross</span><span>${viewModal.grossSalary?.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="text-muted text-sm" style={{ marginBottom:8, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Deductions</div>
                {[
                  ['Absent', viewModal.deductions?.absentDeduction],
                  ['Late',   viewModal.deductions?.lateDeduction],
                  ['Tax',    viewModal.deductions?.tax],
                  ['Other',  viewModal.deductions?.other],
                ].map(([k,v]) => v > 0 && (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                    <span className="text-muted">{k}</span>
                    <span className="text-red">-${v?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid var(--border)', paddingTop:8, marginTop:8 }}>
                  <span>Total Deductions</span><span className="text-red">-${viewModal.totalDeductions?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop:20, paddingTop:16, borderTop:'2px solid var(--gold)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="font-display" style={{ fontSize:18 }}>Net Salary</span>
              <span className="font-display text-gold" style={{ fontSize:24 }}>${viewModal.netSalary?.toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
