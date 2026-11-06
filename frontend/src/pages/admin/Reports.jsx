import { tr } from '../../utils/i18n'
import { useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader, StatCard } from '../../components/common'
import { reportAPI } from '../../api'
import toast from 'react-hot-toast'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Users, Wallet, CalendarOff, TrendingUp } from 'lucide-react'
import { LEAVE_TYPE_LABELS, MONTHS_SHORT, STATUS_LABELS } from '../../utils/locale'

const MONTHS = MONTHS_SHORT
const PIE_COLORS = ['var(--green)','var(--red)','var(--amber)','var(--blue)','var(--gold)','var(--text-2)']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px -12px rgba(22,24,29,0.25)' }}>
      {label && <p style={{ color:'var(--text-2)', fontSize:11, marginBottom:6 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || 'var(--text-1)', fontSize:13, fontWeight:600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? tr('රු. {amount}', { amount: p.value.toLocaleString() }) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const year = new Date().getFullYear()
  const [dash, setDash]         = useState(null)
  const [attData, setAttData]   = useState([])
  const [leaveData, setLeaveData] = useState({ byType:[], byStatus:[] })
  const [salData, setSalData]   = useState([])
  const [workload, setWorkload] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      reportAPI.dashboard(),
      reportAPI.attendance({ year }),
      reportAPI.leave({ year }),
      reportAPI.salary({ year }),
      reportAPI.workload({ academicYear: `${year-1}-${year}` }),
    ]).then(([d, att, lv, sal, wl]) => {
      setDash(d.data.dashboard)
      // Build monthly attendance chart
      const mMap = {}
      att.data.monthly.forEach(({ _id, count }) => {
        const m = MONTHS[_id.month - 1]
        if (!mMap[m]) mMap[m] = { month: m, present:0, absent:0, late:0 }
        mMap[m][_id.status] = count
      })
      setAttData(Object.values(mMap))
      setLeaveData({
        byType: lv.data.byType.map(d => ({ ...d, _id: LEAVE_TYPE_LABELS[d._id] || d._id })),
        byStatus: lv.data.byStatus.map(d => ({ ...d, _id: STATUS_LABELS[d._id] || d._id })),
      })
      // Monthly salary
      const sMap = sal.data.monthly.map(m => ({
        month: MONTHS[m._id - 1],
        gross: m.totalGross,
        net:   m.totalNet,
        count: m.count,
      }))
      setSalData(sMap)
      setWorkload(wl.data.workload.slice(0,10))
    }).catch(() => toast.error(tr('වාර්තා ලබාගැනීමට නොහැකි විය')))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title={tr('වාර්තා')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('වාර්තා සහ විශ්ලේෂණ')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('වාර්තා සහ විශ්ලේෂණ')}</h1>
          <p className="page-subtitle">{tr('{year} වර්ෂයේ සාරාංශය', { year })}</p>
        </div>
      </div>

      {/* KPI Cards */}
      {dash && (
        <div className="stats-grid">
          <StatCard label={tr('මුළු ගුරුවරු')}     value={dash.totalTeachers}    accent="gold"  icon={Users} />
          <StatCard label={tr('අද පැමිණි')}      value={dash.todayAttendance?.present} accent="green" icon={TrendingUp} />
          <StatCard label={tr('අද නොපැමිණි')}       value={dash.todayAttendance?.absent}  accent="red"   icon={CalendarOff} />
          <StatCard label={tr('පොරොත්තු නිවාඩු')}     value={dash.pendingLeaves}    accent="amber" icon={CalendarOff} />
          <StatCard label={tr('මාසික වැටුප්')}    value={tr('රු. {amount}', { amount: (dash.totalSalaryThisMonth||0).toLocaleString() })} accent="blue" icon={Wallet} />
        </div>
      )}

      {/* Attendance Trend */}
      {attData.length > 0 && (
        <div className="card mb-6">
          <h2 className="card-title">{tr('පැමිණීමේ ප්‍රවණතාව')}</h2>
          <p className="card-sub" style={{ marginBottom:16 }}>{tr('මාසික පැමිණි / නොපැමිණි / ප්‍රමාද · {year}', { year })}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attData} barSize={9} barGap={2} margin={{ left:-24, right:4, top:4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--bg)' }} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-2)' }} />
              <Bar dataKey="present" name={tr('පැමිණි')} fill="var(--green)"  radius={[4,4,0,0]} />
              <Bar dataKey="absent"  name={tr('නොපැමිණි')}  fill="var(--red)"    radius={[4,4,0,0]} />
              <Bar dataKey="late"    name={tr('ප්‍රමාද')}    fill="var(--amber)"  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid-2 mb-6" style={{ alignItems:'start' }}>
        {/* Leave by Type */}
        {leaveData.byType.length > 0 && (
          <div className="card">
            <h2 className="card-title">{tr('වර්ගය අනුව නිවාඩු')}</h2>
            <p className="card-sub" style={{ marginBottom:16 }}>{tr('අනුමත නිවාඩු දින · {year}', { year })}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData.byType} dataKey="totalDays" nameKey="_id" cx="50%" cy="46%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                  {leaveData.byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12.5, textTransform:'capitalize' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leave by Status */}
        {leaveData.byStatus.length > 0 && (
          <div className="card">
            <h2 className="card-title">{tr('තත්ත්වය අනුව නිවාඩු')}</h2>
            <p className="card-sub" style={{ marginBottom:16 }}>{tr('සියලු ඉල්ලීම් · {year}', { year })}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="46%" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                  {leaveData.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12.5, textTransform:'capitalize' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Salary trend */}
      {salData.length > 0 && (
        <div className="card mb-6">
          <h2 className="card-title">{tr('වැටුප් ප්‍රවණතාව')}</h2>
          <p className="card-sub" style={{ marginBottom:16 }}>{tr('මාසික දළ සහ ශුද්ධ වැටුප් · {year}', { year })}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={salData} barSize={12} barGap={4} margin={{ left:-16, right:4, top:4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--bg)' }} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-2)' }} />
              <Bar dataKey="gross" name={tr('දළ')} fill="var(--blue)"  radius={[4,4,0,0]} />
              <Bar dataKey="net"   name={tr('ශුද්ධ')}   fill="var(--green)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workload table */}
      {workload.length > 0 && (
        <div className="card">
          <h2 className="card-title">{tr('ගුරු කාර්යභාරය')}</h2>
          <p className="card-sub" style={{ marginBottom:16 }}>{tr('එක් ගුරුවරයෙකුට පවරා ඇති කාලච්ඡේද')}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{tr('ගුරුවරයා')}</th><th>{tr('අංකය')}</th><th>{tr('අංශය')}</th><th>{tr('විෂයයන්')}</th><th>{tr('මුළු කාලච්ඡේද')}</th></tr>
              </thead>
              <tbody>
                {workload.map((w,i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{w.teacherName}</td>
                    <td className="text-muted">{w.teacherId}</td>
                    <td className="text-muted">{w.department || '—'}</td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {w.subjects?.slice(0,3).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, borderRadius:99, background:'var(--border)', overflow:'hidden', maxWidth:80 }}>
                          <div style={{ width:`${Math.min(100,(w.totalPeriods/40)*100)}%`, height:'100%', background:'var(--gold)', borderRadius:99 }} />
                        </div>
                        <span style={{ fontWeight:600, fontSize:13 }}>{w.totalPeriods}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* MOBILE */}
          <div className="mobile-list">
            {workload.map((w,i) => (
              <div key={i} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{w.teacherName}</div>
                    <div className="mobile-card-sub">{w.teacherId} · {w.department || '—'}</div>
                  </div>
                  <span style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text-1)' }}>{w.totalPeriods}</span>
                </div>
                {w.subjects?.length > 0 && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {w.subjects.slice(0,4).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
