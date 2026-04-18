import { useEffect, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader, StatCard } from '../../components/common'
import { reportAPI } from '../../api'
import toast from 'react-hot-toast'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Users, DollarSign, CalendarOff, TrendingUp } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['var(--green)','var(--red)','var(--amber)','var(--blue)','var(--gold)','var(--text-2)']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
      {label && <p style={{ color:'var(--text-2)', fontSize:11, marginBottom:6 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || 'var(--text-1)', fontSize:13, fontWeight:600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? `$${p.value.toLocaleString()}` : p.value}
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
      setLeaveData({ byType: lv.data.byType, byStatus: lv.data.byStatus })
      // Monthly salary
      const sMap = sal.data.monthly.map(m => ({
        month: MONTHS[m._id - 1],
        gross: m.totalGross,
        net:   m.totalNet,
        count: m.count,
      }))
      setSalData(sMap)
      setWorkload(wl.data.workload.slice(0,10))
    }).catch(() => toast.error('Failed to load reports'))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout title="Reports"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Reports & Analytics">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Year {year} overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      {dash && (
        <div className="stats-grid">
          <StatCard label="Total Teachers"     value={dash.totalTeachers}    accent="gold"  icon={Users} />
          <StatCard label="Present Today"      value={dash.todayAttendance?.present} accent="green" icon={TrendingUp} />
          <StatCard label="Absent Today"       value={dash.todayAttendance?.absent}  accent="red"   icon={CalendarOff} />
          <StatCard label="Pending Leaves"     value={dash.pendingLeaves}    accent="amber" icon={CalendarOff} />
          <StatCard label="Monthly Payroll"    value={`$${(dash.totalSalaryThisMonth||0).toLocaleString()}`} accent="blue" icon={DollarSign} />
        </div>
      )}

      {/* Attendance Trend */}
      {attData.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-display" style={{ fontSize:18, marginBottom:4 }}>Attendance Trend</h2>
          <p className="text-sm text-muted" style={{ marginBottom:20 }}>Monthly present / absent / late — {year}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attData} barSize={9} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-2)' }} />
              <Bar dataKey="present" name="Present" fill="var(--green)"  radius={[4,4,0,0]} />
              <Bar dataKey="absent"  name="Absent"  fill="var(--red)"    radius={[4,4,0,0]} />
              <Bar dataKey="late"    name="Late"    fill="var(--amber)"  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid-2 mb-6" style={{ alignItems:'start' }}>
        {/* Leave by Type */}
        {leaveData.byType.length > 0 && (
          <div className="card">
            <h2 className="font-display" style={{ fontSize:18, marginBottom:4 }}>Leave by Type</h2>
            <p className="text-sm text-muted" style={{ marginBottom:20 }}>Approved leave days — {year}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData.byType} dataKey="totalDays" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:'var(--border)' }}>
                  {leaveData.byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leave by Status */}
        {leaveData.byStatus.length > 0 && (
          <div className="card">
            <h2 className="font-display" style={{ fontSize:18, marginBottom:4 }}>Leave by Status</h2>
            <p className="text-sm text-muted" style={{ marginBottom:20 }}>All requests — {year}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:'var(--border)' }}>
                  {leaveData.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Salary trend */}
      {salData.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-display" style={{ fontSize:18, marginBottom:4 }}>Payroll Trend</h2>
          <p className="text-sm text-muted" style={{ marginBottom:20 }}>Monthly gross vs net — {year}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={salData} barSize={12} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-2)' }} />
              <Bar dataKey="gross" name="Gross" fill="var(--blue)"  radius={[4,4,0,0]} />
              <Bar dataKey="net"   name="Net"   fill="var(--green)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workload table */}
      {workload.length > 0 && (
        <div className="card">
          <h2 className="font-display" style={{ fontSize:18, marginBottom:4 }}>Teacher Workload</h2>
          <p className="text-sm text-muted" style={{ marginBottom:20 }}>Periods assigned per teacher</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Teacher</th><th>ID</th><th>Department</th><th>Subjects</th><th>Total Periods</th></tr>
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
        </div>
      )}
    </AppLayout>
  )
}
