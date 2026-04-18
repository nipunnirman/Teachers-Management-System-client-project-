import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { StatCard, PageLoader } from '../components/common'
import { reportAPI, attendanceAPI, leaveAPI, salaryAPI, timetableAPI } from '../api'
import { Users, CalendarCheck, CalendarOff, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-2)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin, user } = useAuth()
  const [data, setData] = useState(null)
  const [teacherData, setTeacherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const year = new Date().getFullYear()

  useEffect(() => {
    if (isAdmin) {
      Promise.all([reportAPI.dashboard(), reportAPI.attendance({ year })])
        .then(([dash, att]) => {
          setData(dash.data.dashboard)
          // Build monthly chart data
          const monthly = {}
          att.data.monthly.forEach(({ _id, count }) => {
            const m = MONTHS[_id.month - 1]
            if (!monthly[m]) monthly[m] = { month: m, present: 0, absent: 0, late: 0 }
            monthly[m][_id.status] = count
          })
          setData(d => ({ ...d, monthlyChart: Object.values(monthly) }))
        })
        .finally(() => setLoading(false))
    } else {
      Promise.all([
        attendanceAPI.getMe({ month: new Date().getMonth() + 1, year }),
        leaveAPI.getAll({ status: 'pending' }),
        salaryAPI.getMe(),
        timetableAPI.getMe(),
      ])
        .then(([att, leaves, sal, tt]) => {
          setTeacherData({
            attendance: att.data,
            pendingLeaves: leaves.data.count,
            latestSalary: sal.data.salaries?.[0],
            todayClasses: Object.values(tt.data.weekly || {}).flat().filter(e => {
              const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
              return e.day === days[new Date().getDay()]
            }).length,
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isAdmin])

  if (loading) return <AppLayout title="Dashboard"><PageLoader /></AppLayout>

  if (!isAdmin && teacherData) {
    const { attendance, pendingLeaves, latestSalary, todayClasses } = teacherData
    return (
      <AppLayout title="Dashboard">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Good {getGreeting()}, {user.name.split(' ')[0]}</h1>
            <p className="page-subtitle">Here's your overview for {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
          </div>
        </div>
        <div className="stats-grid">
          <StatCard label="Present This Month" value={attendance?.summary?.present ?? '—'} accent="green" icon={CalendarCheck} />
          <StatCard label="Absent This Month"  value={attendance?.summary?.absent ?? '—'}  accent="red"   icon={CalendarOff} />
          <StatCard label="Today's Classes"    value={todayClasses}                         accent="blue"  icon={Clock} />
          <StatCard label="Pending Leaves"     value={pendingLeaves}                        accent="amber" icon={CalendarOff} />
          <StatCard label="Last Net Salary"    value={latestSalary ? `$${latestSalary.netSalary?.toLocaleString()}` : '—'} accent="gold" icon={DollarSign} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">School Overview</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Teachers"    value={data?.totalTeachers ?? '—'}    accent="gold"  icon={Users} />
        <StatCard label="Present Today"     value={data?.todayAttendance?.present ?? '—'} accent="green" icon={CalendarCheck} />
        <StatCard label="Absent Today"      value={data?.todayAttendance?.absent ?? '—'}  accent="red"   icon={CalendarOff} />
        <StatCard label="Pending Leaves"    value={data?.pendingLeaves ?? '—'}     accent="amber" icon={CalendarOff} />
        <StatCard label="Payroll This Month" value={data?.totalSalaryThisMonth ? `$${data.totalSalaryThisMonth.toLocaleString()}` : '—'} accent="blue" icon={DollarSign} />
      </div>

      {data?.monthlyChart?.length > 0 && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 18 }}>Attendance Trend</h2>
              <p className="text-sm text-muted">Monthly breakdown — {year}</p>
            </div>
            <TrendingUp size={20} style={{ color: 'var(--text-3)' }} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlyChart} barSize={10} barGap={3}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="present" name="Present" fill="var(--green)"  radius={[4,4,0,0]} />
              <Bar dataKey="absent"  name="Absent"  fill="var(--red)"    radius={[4,4,0,0]} />
              <Bar dataKey="late"    name="Late"    fill="var(--amber)"  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AppLayout>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
