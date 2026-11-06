import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { UserCheck, X } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { EmptyState, PageLoader } from '../../components/common'
import { reliefAPI } from '../../api'
import { tr } from '../../utils/i18n'
import { periodLabel } from '../../utils/locale'
import { dateKey } from '../../utils/settings'

export default function Relief() {
  const [date, setDate] = useState(dateKey())
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [choices, setChoices] = useState({})
  const [saving, setSaving] = useState(null)

  const load = async (showLoader = true) => {
    if (!date) return
    if (showLoader) setLoading(true)
    try {
      const { data } = await reliefAPI.getPlan({ date })
      setPlan(data.plan)
    } catch { toast.error(tr('ආදේශක සැලැස්ම ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const assign = async (slot) => {
    const reliefTeacherId = choices[slot.entryId]
    if (!reliefTeacherId) return toast.error(tr('ආදේශක ගුරුවරයෙකු තෝරන්න'))
    setSaving(slot.entryId)
    try {
      const { data } = await reliefAPI.assign({ date, entryId: slot.entryId, reliefTeacherId })
      toast.success(data.message)
      await load(false)
    } catch (err) { toast.error(err.response?.data?.message || tr('අසාර්ථක විය')) }
    finally { setSaving(null) }
  }

  const remove = async (slot) => {
    if (!confirm(tr('මෙම ආදේශක පැවරුම ඉවත් කරන්නද?'))) return
    setSaving(slot.entryId)
    try {
      const { data } = await reliefAPI.remove(slot.assignment._id)
      toast.success(data.message)
      await load(false)
    } catch (err) { toast.error(err.response?.data?.message || tr('අසාර්ථක විය')) }
    finally { setSaving(null) }
  }

  const slots = plan?.slots || []
  const uncovered = slots.filter(s => !s.assignment).length

  let subtitle = tr('නොපැමිණි ගුරුවරුන්ගේ පන්ති')
  if (slots.length > 0) subtitle = tr('පන්ති {total}න් {open}කට ආදේශකයෙකු අවශ්‍යයි', { total: slots.length, open: uncovered })

  return (
    <AppLayout title={tr('ආදේශක')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('ආදේශක ගුරු සැලැස්ම')}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="page-header-actions">
          <input className="form-input date-filter" type="date" aria-label={tr('දිනය')} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {loading ? <PageLoader /> : plan?.holiday ? (
        <div className="card"><EmptyState message={tr('මෙය නිවාඩු දිනයකි')} sub={plan.holiday} /></div>
      ) : slots.length === 0 ? (
        <div className="card"><EmptyState message={tr('ආදේශකයන් අවශ්‍ය පන්ති නොමැත')} sub={tr('නොපැමිණි ලෙස හෝ අනුමත නිවාඩු මත සිටින ගුරුවරුන්ගේ පන්ති මෙහි දිස්වේ.')} /></div>
      ) : (
        <div className="relief-list">
          {slots.map(slot => (
            <div key={slot.entryId} className={`card relief-card${slot.assignment ? ' covered' : ''}`}>
              <div className="relief-head">
                <span className="period-chip" title={periodLabel(slot.period)}>{slot.period}</span>
                <div className="schedule-main">
                  <div className="schedule-subject">{slot.subject}</div>
                  <div className="schedule-meta">{slot.className} {slot.grade && `· ${slot.grade}`} · {slot.startTime} – {slot.endTime}</div>
                  <div className="schedule-meta">{tr('නොපැමිණි ගුරුවරයා: {name}', { name: slot.absentTeacher.name })}</div>
                </div>
              </div>

              {slot.assignment ? (
                <div className="relief-assigned">
                  <span><UserCheck size={17}/> {slot.assignment.reliefTeacher.name}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => remove(slot)} disabled={saving === slot.entryId}><X size={14}/> {tr('ඉවත් කරන්න')}</button>
                </div>
              ) : slot.freeTeachers.length === 0 ? (
                <p className="relief-none">{tr('මෙම කාලච්ඡේදයේ නිදහස් ගුරුවරුන් නොමැත')}</p>
              ) : (
                <div className="relief-assign">
                  <select className="form-select" aria-label={tr('ආදේශක ගුරුවරයා')} value={choices[slot.entryId] || ''}
                    onChange={e => setChoices(c => ({ ...c, [slot.entryId]: e.target.value }))}>
                    <option value="">{tr('නිදහස් ගුරුවරයෙකු තෝරන්න…')}</option>
                    {slot.freeTeachers.map(t => (
                      <option key={t._id} value={t._id}>{tr('{name} (අද පන්ති {count})', { name: t.name, count: t.periodsToday })}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={() => assign(slot)} disabled={saving === slot.entryId}>{tr('පවරන්න')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
