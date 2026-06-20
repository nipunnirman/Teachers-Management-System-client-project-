import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { StatCard, PageLoader } from '../components/common'
import { reportAPI, attendanceAPI, leaveAPI, timetableAPI } from '../api'
import { Users, CalendarCheck, CalendarOff, Clock, Calendar, TrendingUp } from 'lucide-react'
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
      Promise.all([reportAPI.dashboard(), reportAPI.attendance({ year }), timetableAPI.getAll({ academicYear: '2025-2026' })])
        .then(([dash, att, tt]) => {
          setData({
            ...dash.data.dashboard,
            timetableCount: tt.data.count || tt.data.entries?.length || 0
          })
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
        timetableAPI.getMe({ academicYear: '2025-2026' }),
      ])
        .then(([att, leaves, tt]) => {
          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          const todayDayName = days[new Date().getDay()]
          const todayClassesList = tt.data.weekly?.[todayDayName] || []
          setTeacherData({
            attendance: att.data,
            pendingLeaves: leaves.data.count,
            todayClasses: todayClassesList.length,
            todayClassesList: todayClassesList,
            weekClassesCount: tt.data.entries?.length || 0,
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isAdmin])

  if (loading) return <AppLayout title="Dashboard"><PageLoader /></AppLayout>

  if (!isAdmin && teacherData) {
    const { attendance, pendingLeaves, todayClasses, todayClassesList, weekClassesCount } = teacherData
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
          <StatCard label="Weekly Classes"     value={weekClassesCount}                     accent="gold"  icon={Calendar} />
        </div>

        {/* Today's Schedule Overview */}
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 18 }}>Today's Schedule</h2>
              <p className="text-sm text-muted">Your classes for today</p>
            </div>
            <Clock size={20} style={{ color: 'var(--text-3)' }} />
          </div>
          {todayClassesList && todayClassesList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayClassesList.map(e => (
                <div key={e._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <span style={{ background: '#3b82f618', color: '#3b82f6', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, marginRight: 8 }}>
                      Period {e.period}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{e.subject}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{e.className} {e.grade && `· ${e.grade}`}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
                    {e.startTime} – {e.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              No classes scheduled for today.
            </div>
          )}
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
        <StatCard label="Weekly Classes"    value={data?.timetableCount ?? '—'}    accent="blue"  icon={Calendar} />
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
