import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { LocateFixed } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { PageLoader } from '../../components/common'
import { settingsAPI } from '../../api'
import { tr } from '../../utils/i18n'
import { LEAVE_TYPE_LABELS } from '../../utils/locale'
import { loadSettings } from '../../utils/settings'

const LEAVE_TYPES = ['annual', 'casual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']

export default function Settings() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    loadSettings(true)
      .then(s => setForm({
        academicYear: s.academicYear,
        lateAfter: s.lateAfter,
        leaveLimits: { ...s.leaveLimits },
        location: {
          enabled: Boolean(s.location?.enabled),
          latitude: s.location?.latitude ?? '',
          longitude: s.location?.longitude ?? '',
          radiusMeters: s.location?.radiusMeters ?? 200,
        },
      }))
      .catch(() => toast.error(tr('සැකසුම් ලබාගැනීමට නොහැකි විය')))
  }, [])

  const setLocation = (change) => setForm(f => ({ ...f, location: { ...f.location, ...change } }))

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error(tr('ස්ථානය ලබාගැනීමට නොහැකි විය'))
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: Number(coords.latitude.toFixed(6)), longitude: Number(coords.longitude.toFixed(6)) })
        setLocating(false)
      },
      () => {
        toast.error(tr('ස්ථානය ලබාගැනීමට නොහැකි විය'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const handleSave = async () => {
    if (!form.academicYear.trim() || !form.lateAfter) return toast.error(tr('අවශ්‍ය සියලු තොරතුරු ඇතුළත් කරන්න'))
    setSaving(true)
    try {
      const { data } = await settingsAPI.update(form)
      await loadSettings(true)
      toast.success(data.message)
    } catch (err) { toast.error(err.response?.data?.message || tr('සුරැකීමට නොහැකි විය')) }
    finally { setSaving(false) }
  }

  if (!form) return <AppLayout title={tr('සැකසුම්')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('සැකසුම්')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('පාසල් සැකසුම්')}</h1>
          <p className="page-subtitle">{tr('මෙම සැකසුම් සියලු ගුරුවරුන්ට අදාළ වේ')}</p>
        </div>
      </div>

      <div className="settings-stack">
        <div className="card">
          <h2 className="card-title">{tr('පාසල් වර්ෂය සහ වේලාව')}</h2>
          <p className="card-sub" style={{ marginBottom: 16 }}>{tr('කාලසටහන් මෙම අධ්‍යයන වර්ෂය අනුව පෙන්වයි')}</p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="academic-year">{tr('අධ්‍යයන වර්ෂය')}</label>
              <input id="academic-year" className="form-input" placeholder="2026" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}/>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="late-after">{tr('මෙම වේලාවෙන් පසු ප්‍රමාද ලෙස සටහන් වේ')}</label>
              <input id="late-after" className="form-input" type="time" value={form.lateAfter} onChange={e => setForm(f => ({ ...f, lateAfter: e.target.value }))}/>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">{tr('වාර්ෂික නිවාඩු සීමා')}</h2>
          <p className="card-sub" style={{ marginBottom: 16 }}>{tr('වසරකට අවසර ඇති දින ගණන. 0 යනු සීමාවක් නොමැති බවයි.')}</p>
          <div className="limits-grid">
            {LEAVE_TYPES.map(type => (
              <div key={type} className="form-group">
                <label className="form-label" htmlFor={`limit-${type}`}>{LEAVE_TYPE_LABELS[type]}</label>
                <input id={`limit-${type}`} className="form-input" type="number" min="0" inputMode="numeric" value={form.leaveLimits[type] ?? 0}
                  onChange={e => setForm(f => ({ ...f, leaveLimits: { ...f.leaveLimits, [type]: e.target.value } }))}/>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">{tr('QR පැමිණීම සඳහා ස්ථාන පරීක්ෂාව')}</h2>
          <p className="card-sub" style={{ marginBottom: 16 }}>{tr('සක්‍රීය කළ විට, පාසල අසල සිටින ගුරුවරුන්ට පමණක් පැමිණීම සටහන් කළ හැක.')}</p>
          <label className="check-row">
            <input type="checkbox" checked={form.location.enabled} onChange={e => setLocation({ enabled: e.target.checked })}/>
            {tr('ස්ථාන පරීක්ෂාව සක්‍රීය කරන්න')}
          </label>
          {form.location.enabled && (
            <>
              <div className="form-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="school-lat">{tr('අක්ෂාංශය')}</label>
                  <input id="school-lat" className="form-input" type="number" step="any" inputMode="decimal" value={form.location.latitude} onChange={e => setLocation({ latitude: e.target.value })}/>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="school-lng">{tr('දේශාංශය')}</label>
                  <input id="school-lng" className="form-input" type="number" step="any" inputMode="decimal" value={form.location.longitude} onChange={e => setLocation({ longitude: e.target.value })}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="school-radius">{tr('අවසර ඇති දුර (මීටර්)')}</label>
                <input id="school-radius" className="form-input" type="number" min="50" inputMode="numeric" value={form.location.radiusMeters} onChange={e => setLocation({ radiusMeters: e.target.value })}/>
              </div>
              <button className="btn btn-ghost" onClick={useCurrentLocation} disabled={locating}>
                <LocateFixed size={16}/> {locating ? tr('ස්ථානය සොයමින්…') : tr('මගේ වත්මන් ස්ථානය යොදන්න')}
              </button>
            </>
          )}
        </div>

        <div className="settings-save">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? tr('සුරකිමින්…') : tr('සැකසුම් සුරකින්න')}</button>
        </div>
      </div>
    </AppLayout>
  )
}
