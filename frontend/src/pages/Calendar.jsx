import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, ChevronLeft, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { EmptyState, Modal, PageLoader } from '../components/common'
import { calendarAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { tr } from '../utils/i18n'
import { EVENT_TYPE_LABELS, MONTHS_FULL, formatDate } from '../utils/locale'
import { dateKey } from '../utils/settings'
import { useDataRefresh } from '../utils/useDataRefresh'

const TYPES = ['holiday', 'term', 'meeting', 'event']
const TONE = { holiday: 'badge-red', term: 'badge-blue', meeting: 'badge-amber', event: 'badge-gray' }

export default function Calendar() {
  const { isAdmin } = useAuth()
  const { version, isRefresh } = useDataRefresh()
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 })
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const blank = { title: '', type: 'holiday', startDate: dateKey(), endDate: dateKey(), notes: '' }
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!isRefresh()) setLoading(true)
    try {
      const { data } = await calendarAPI.getAll(view)
      setEvents(data.events)
    } catch { toast.error(tr('දින දර්ශනය ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [view, version])

  const moveMonth = (change) => setView(({ year, month }) => {
    const next = new Date(year, month - 1 + change, 1)
    return { year: next.getFullYear(), month: next.getMonth() + 1 }
  })

  const openAdd = () => { setEditing(null); setForm(blank); setModalOpen(true) }
  const openEdit = (event) => {
    setEditing(event)
    setForm({
      title: event.title,
      type: event.type,
      startDate: event.startDate.slice(0, 10),
      endDate: event.endDate.slice(0, 10),
      notes: event.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.startDate) return toast.error(tr('මාතෘකාව සහ දිනය ඇතුළත් කරන්න'))
    setSaving(true)
    try {
      const body = { ...form, endDate: form.endDate || form.startDate }
      if (editing) await calendarAPI.update(editing._id, body)
      else await calendarAPI.create(body)
      toast.success(tr('සිදුවීම සුරකින ලදී'))
      setModalOpen(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || tr('සුරැකීමට නොහැකි විය')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (event) => {
    if (!confirm(tr('{title} ඉවත් කරන්නද?', { title: event.title }))) return
    try {
      await calendarAPI.remove(event._id)
      toast.success(tr('ඉවත් කරන ලදී'))
      load()
    } catch { toast.error(tr('ඉවත් කිරීමට නොහැකි විය')) }
  }

  const range = (event) => {
    const start = event.startDate.slice(0, 10)
    const end = event.endDate.slice(0, 10)
    return start === end ? formatDate(event.startDate) : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
  }

  return (
    <AppLayout title={tr('දින දර්ශනය')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('පාසල් දින දර්ශනය')}</h1>
          <p className="page-subtitle">{tr('නිවාඩු, වාර දින සහ රැස්වීම්')}</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> {tr('සිදුවීමක් එක් කරන්න')}</button>
          </div>
        )}
      </div>

      <div className="month-switcher">
        <button className="btn btn-icon btn-ghost" onClick={() => moveMonth(-1)} aria-label={tr('පෙර මාසය')}><ChevronLeft size={20}/></button>
        <strong>{view.year} {MONTHS_FULL[view.month - 1]}</strong>
        <button className="btn btn-icon btn-ghost" onClick={() => moveMonth(1)} aria-label={tr('ඊළඟ මාසය')}><ChevronRight size={20}/></button>
      </div>

      <div className="card">
        {loading ? <PageLoader /> : events.length === 0 ? (
          <EmptyState message={tr('මෙම මාසයේ සිදුවීම් නොමැත')} />
        ) : (
          <div className="schedule-list">
            {events.map(event => (
              <div key={event._id} className="schedule-row">
                <span className="period-chip"><CalendarDays size={18}/></span>
                <div className="schedule-main">
                  <div className="schedule-subject">{event.title}</div>
                  <div className="schedule-meta">{range(event)}</div>
                  {event.notes && <div className="schedule-meta">{event.notes}</div>}
                  <span className={`badge ${TONE[event.type]}`} style={{ marginTop: 5 }}>{EVENT_TYPE_LABELS[event.type]}</span>
                </div>
                {isAdmin && (
                  <div className="row-actions">
                    <button className="notif-delete" onClick={() => openEdit(event)} aria-label={tr('සංස්කරණය')}><Edit2 size={16}/></button>
                    <button className="notif-delete" onClick={() => handleDelete(event)} aria-label={tr('මකන්න')}><Trash2 size={16}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? tr('සිදුවීම සංස්කරණය') : tr('සිදුවීමක් එක් කිරීම')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{tr('අවලංගු කරන්න')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? tr('සුරකිමින්…') : tr('සුරකින්න')}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">{tr('මාතෘකාව *')}</label>
          <input className="form-input" placeholder={tr('දුරුතු පොහොය දිනය')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('වර්ගය')}</label>
          <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {TYPES.map(type => <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('ආරම්භක දිනය *')}</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))}/>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('අවසන් දිනය')}</label>
            <input className="form-input" type="date" min={form.startDate} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('සටහන්')}</label>
          <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
        </div>
      </Modal>
    </AppLayout>
  )
}
