import { tr } from '../utils/i18n'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { StatCard, PageLoader } from '../components/common'
import { reportAPI, attendanceAPI, calendarAPI, leaveAPI, reliefAPI, timetableAPI } from '../api'
import { dateKey, eventCoversDate, loadSettings } from '../utils/settings'
import { Users, CalendarCheck, CalendarOff, Clock, Calendar, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MONTHS_SHORT, formatDayDate, formatFullDate, formatTime, periodLabel } from '../utils/locale'

const MONTHS = MONTHS_SHORT

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px -12px rgba(22,24,29,0.25)' }}>
      <p style={{ color: 'var(--text-2)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// Re-renders once a minute, on the minute change, rather than every second.
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => {
      const current = new Date()
      setNow(prev => (prev.getMinutes() === current.getMinutes() && prev.getHours() === current.getHours() ? prev : current))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function LiveClock() {
  const now = useNow()
  return (
    <time className="live-clock" dateTime={now.toISOString()} aria-label={tr('වත්මන් වේලාව')}>
      {formatTime(now)}
    </time>
  )
}

// "08:30" -> minutes since midnight
function toMinutes(time) {
  const [h, m] = String(time || '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

function formatWait(minutes) {
  if (minutes < 60) return tr('තව මිනිත්තු {m}', { m: minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? tr('තව පැය {h} මිනිත්තු {m}', { h, m }) : tr('තව පැය {h}', { h })
}

function TodaySchedule({ classes }) {
  const now = useNow()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const sorted = [...classes].sort((a, b) =>
    (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0) || (a.period ?? 0) - (b.period ?? 0)
  )
  const next = sorted.find(e => toMinutes(e.startTime) > nowMinutes)

  let summary = tr('අද පන්ති නොමැත')
  if (next) summary = tr('ඊළඟ පන්තියට {wait}', { wait: formatWait(toMinutes(next.startTime) - nowMinutes) })
  else if (sorted.length > 0) summary = tr('අද තවත් පන්ති නොමැත')

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">{tr('අද කාලසටහන')}</h2>
          <p className="card-sub">{summary}</p>
        </div>
        <Clock size={18} />
      </div>
      {sorted.length > 0 ? (
        <div className="schedule-list">
          {sorted.map(e => {
            const start = toMinutes(e.startTime)
            const end = toMinutes(e.endTime)
            const isNext = e === next
            const isNow = start !== null && end !== null && start <= nowMinutes && nowMinutes < end
            const isPast = end !== null && nowMinutes >= end
            const state = isNext ? ' next' : isPast ? ' past' : ''
            return (
              <div key={e._id} className={`schedule-row${state}`}>
                <span className="period-chip" title={periodLabel(e.period)}>{e.period}</span>
                <div className="schedule-main">
                  <div className="schedule-subject">{e.subject}</div>
                  <div className="schedule-meta">{e.className} {e.grade && `· ${e.grade}`}</div>
                  {isNext && <div className="schedule-flag">{tr('ඊළඟ පන්තිය')}</div>}
                  {isNow && <div className="schedule-flag now">{tr('දැන් පැවැත්වේ')}</div>}
                  {e.isRelief && <div className="schedule-flag">{tr('ආදේශක පන්තිය')}</div>}
                </div>
                <div className="schedule-time">{e.startTime} – {e.endTime}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="quiet-empty">{tr('අද පන්ති සැලසුම් කර නොමැත.')}</div>
      )}
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
      loadSettings().then(settings => Promise.all([reportAPI.dashboard(), reportAPI.attendance({ year }), timetableAPI.getAll({ academicYear: settings.academicYear })]))
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
      const key = dateKey()
      loadSettings().then(settings => Promise.all([
        attendanceAPI.getMe({ month: new Date().getMonth() + 1, year }),
        leaveAPI.getAll({ status: 'pending' }),
        timetableAPI.getMe({ academicYear: settings.academicYear }),
        reliefAPI.getMine({ date: key }).catch(() => ({ data: { assignments: [] } })),
        calendarAPI.getAll({ year, month: new Date().getMonth() + 1 }).catch(() => ({ data: { events: [] } })),
      ]))
        .then(([att, leaves, tt, relief, calendar]) => {
          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          const todayDayName = days[new Date().getDay()]
          const holiday = calendar.data.events.find(e => e.type === 'holiday' && eventCoversDate(e, key))
          const reliefClasses = relief.data.assignments.map(a => ({ ...a, isRelief: true }))
          const todayClassesList = holiday ? [] : [...(tt.data.weekly?.[todayDayName] || []), ...reliefClasses]
          setTeacherData({
            attendance: att.data,
            pendingLeaves: leaves.data.count,
            todayClasses: todayClassesList.length,
            todayClassesList: todayClassesList,
            weekClassesCount: tt.data.entries?.length || 0,
            holiday: holiday?.title || null,
          })
        })
        .finally(() => setLoading(false))
    }
  }, [isAdmin])

  if (loading) return <AppLayout title={tr('මුල් පිටුව')}><PageLoader /></AppLayout>

  if (!isAdmin && teacherData) {
    const { attendance, pendingLeaves, todayClasses, todayClassesList, weekClassesCount, holiday } = teacherData
    return (
      <AppLayout title={tr('මුල් පිටුව')}>
        <div className="page-header home-header">
          <div className="page-header-left">
            <h1 className="page-title">{getGreeting()}, {user.name.split(' ')[0]}</h1>
            <p className="page-subtitle">{formatDayDate(new Date())}</p>
          </div>
          <LiveClock />
        </div>
        {holiday && <div className="holiday-banner">{tr('අද නිවාඩු දිනයකි: {title}', { title: holiday })}</div>}

        <TodaySchedule classes={todayClassesList || []} />

        <div className="stats-grid" style={{ marginTop: 14, marginBottom: 0 }}>
          <StatCard label={tr('මාසයේ පැමිණි දින')} value={attendance?.summary?.present ?? '—'} accent="green" icon={CalendarCheck} />
          <StatCard label={tr('මාසයේ නොපැමිණි දින')}  value={attendance?.summary?.absent ?? '—'}  accent="red"   icon={CalendarOff} />
          <StatCard label={tr('අද පන්ති')}    value={todayClasses}                         accent="blue"  icon={Clock} />
          <StatCard label={tr('පොරොත්තු නිවාඩු')}     value={pendingLeaves}                        accent="amber" icon={CalendarOff} />
          <StatCard label={tr('සතියේ පන්ති')}     value={weekClassesCount}                     accent="gold"  icon={Calendar} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={tr('මුල් පිටුව')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('සමාලෝචනය')}</h1>
          <p className="page-subtitle">{formatFullDate(new Date())}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label={tr('මුළු ගුරුවරු')}    value={data?.totalTeachers ?? '—'}    accent="gold"  icon={Users} />
        <StatCard label={tr('අද පැමිණි')}     value={data?.todayAttendance?.present ?? '—'} accent="green" icon={CalendarCheck} />
        <StatCard label={tr('අද නොපැමිණි')}      value={data?.todayAttendance?.absent ?? '—'}  accent="red"   icon={CalendarOff} />
        <StatCard label={tr('පොරොත්තු නිවාඩු')}    value={data?.pendingLeaves ?? '—'}     accent="amber" icon={CalendarOff} />
        <StatCard label={tr('සතියේ පන්ති')}    value={data?.timetableCount ?? '—'}    accent="blue"  icon={Calendar} />
      </div>

      {data?.monthlyChart?.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">{tr('පැමිණීමේ ප්‍රවණතාව')}</h2>
              <p className="card-sub">{tr('මාසික විස්තරය · {year}', { year })}</p>
            </div>
            <TrendingUp size={18} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlyChart} barSize={10} barGap={3} margin={{ left: -24, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} cursor={{ fill: 'var(--bg)' }} />
              <Bar dataKey="present" name={tr('පැමිණි')} fill="var(--green)"  radius={[4,4,0,0]} />
              <Bar dataKey="absent"  name={tr('නොපැමිණි')}  fill="var(--red)"    radius={[4,4,0,0]} />
              <Bar dataKey="late"    name={tr('ප්‍රමාද')}    fill="var(--amber)"  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AppLayout>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return tr('සුභ උදෑසනක්')
  if (h < 17) return tr('සුභ දහවලක්')
  return tr('සුභ සන්ධ්‍යාවක්')
}
