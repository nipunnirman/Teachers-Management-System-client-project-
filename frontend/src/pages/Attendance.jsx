import { tr, trSaved } from '../utils/i18n'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { Modal, PageLoader, EmptyState, Badge, StatCard } from '../components/common'
import { attendanceAPI, teacherAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, CalendarCheck, CalendarOff, Clock, TrendingDown, QrCode, Camera, CheckCircle2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { loadSettings } from '../utils/settings'
import { useDataRefresh } from '../utils/useDataRefresh'
import { MONTHS_FULL, STATUS_LABELS, formatShortDayDate, formatTime } from '../utils/locale'

const MONTHS = MONTHS_FULL
const STATUSES = ['present','absent','late','half-day','holiday','weekend']

function fmtDate(d) {
  return formatShortDayDate(d)
}
function fmtTime(t) {
  return t ? formatTime(t) : '—'
}

// Position is only read when the school has turned on the location check.
async function readLocation() {
  try {
    const settings = await loadSettings()
    if (!settings.location?.enabled) return {}
    const { coords } = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000 })
    })
    return { latitude: coords.latitude, longitude: coords.longitude }
  } catch {
    return {}
  }
}

export default function Attendance() {
  const { isAdmin } = useAuth()
  const { version, isRefresh } = useDataRefresh()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year]  = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]  = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ teacherId:'', date: now.toISOString().slice(0,10), status:'present', notes:'' })
  const [saving, setSaving] = useState(false)

  // QR Attendance State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(null)


  // The admin's QR code changes every 30 seconds while it is on screen.
  useEffect(() => {
    if (!qrModalOpen) return undefined
    let active = true
    let timer
    const refresh = async () => {
      try {
        const { data } = await attendanceAPI.getTodayQRToken()
        if (!active) return
        setQrToken(data.token)
        timer = setTimeout(refresh, Math.max(1000, (data.refreshIn || 30000) + 250))
      } catch {
        if (!active) return
        toast.error(tr('QR කේතය ලබාගැනීමට නොහැකි විය'), { id: 'qr-load' })
        timer = setTimeout(refresh, 5000)
      }
    }
    refresh()
    return () => {
      active = false
      clearTimeout(timer)
      setQrToken('')
    }
  }, [qrModalOpen])

  // Handle URL navigation scanner trigger (e.g. from mobile bottom nav)
  useEffect(() => {
    if (searchParams.get('scan') === 'true') {
      setScanSuccess(null)
      setScannerOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  // Camera QR scanner integration
  useEffect(() => {
    let html5QrCode;
    // Wait for the page to finish loading so the #reader element exists.
    if (scannerOpen && !loading) {
      const timer = setTimeout(() => {
        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          async (decodedText) => {
            try {
              await html5QrCode.stop();
            } catch (e) {
              console.error("Error stopping scanner", e);
            }
            setScannerOpen(false);
            
            toast.loading(tr('පැමිණීම සටහන් වෙමින්...'), { id: 'qr-scan' });
            try {
              const { data } = await attendanceAPI.scanQRToken({ token: decodedText, ...(await readLocation()) });
              setScanSuccess({ message: data.message || tr('සාර්ථකව සටහන් විය!') });
              toast.success(data.message || tr('පැමිණීම සටහන් විය!'), { id: 'qr-scan' });
              load();
            } catch (err) {
              toast.error(err.response?.data?.message || tr('පැමිණීම සටහන් කිරීමට නොහැකි විය'), { id: 'qr-scan' });
            }
          },
          () => {}
        ).catch(err => {
          console.error("Failed to start scanner:", err);
          toast.error(tr('කැමරාවට ප්‍රවේශ විය නොහැක'));
          setScannerOpen(false);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping scanner on unmount", err));
        }
      };
    }
  }, [scannerOpen, loading]);

  const closeScanner = () => { setScannerOpen(false); setScanSuccess(null); }


  const load = async () => {
    if (!isRefresh()) setLoading(true)
    try {
      if (isAdmin) {
        const { data } = await attendanceAPI.getAll({ month, year })
        setRecords(data.records)
      } else {
        const { data } = await attendanceAPI.getMe({ month, year })
        setRecords(data.records)
        setSummary(data.summary)
      }
    } catch { toast.error(tr('පැමිණීමේ දත්ත ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, isAdmin, version])
  useEffect(() => {
    if (isAdmin) teacherAPI.getAll().then(r => setTeachers(r.data.teachers)).catch(()=>{})
  }, [isAdmin])

  const handleMark = async () => {
    if (!form.teacherId || !form.date) return toast.error(tr('ගුරුවරයා සහ දිනය තෝරන්න'))
    setSaving(true)
    try {
      await attendanceAPI.mark(form)
      toast.success(tr('පැමිණීම සටහන් විය'))
      setModalOpen(false); load()
    } catch (err) { toast.error(err.response?.data?.message || tr('අසාර්ථක විය')) }
    finally { setSaving(false) }
  }

  if (loading) return <AppLayout title={tr('පැමිණීම')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('පැමිණීම')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isAdmin ? tr('පැමිණීම් කළමනාකරණය') : tr('මගේ පැමිණීම')}</h1>
          <p className="page-subtitle">{MONTHS[month-1]} {year}</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" aria-label={tr('මාසය')} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          {isAdmin ? (
            <>
              <button className="btn btn-ghost" onClick={() => setQrModalOpen(true)}>
                <QrCode size={16}/> {tr('දෛනික QR')}
              </button>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16}/> {tr('සටහන් කරන්න')}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => { setScanSuccess(null); setScannerOpen(true); }}>
              <Camera size={16}/> {tr('QR ස්කෑන්')}
            </button>
          )}
        </div>
      </div>

      {!isAdmin && summary && (
        <div className="stats-grid">
          <StatCard label={tr('පැමිණි')}  value={summary.present}  accent="green" icon={CalendarCheck} />
          <StatCard label={tr('නොපැමිණි')}   value={summary.absent}   accent="red"   icon={CalendarOff} />
          <StatCard label={tr('ප්‍රමාද')}     value={summary.late}     accent="amber" icon={Clock} />
          <StatCard label={tr('අර්ධ දින')} value={summary.halfDay}  accent="blue"  icon={TrendingDown} />
        </div>
      )}

      <div className="card">
        {/* DESKTOP TABLE */}
        <div className="table-wrap">
          {records.length === 0 ? <EmptyState message={tr('පැමිණීමේ වාර්තා නොමැත')} sub={tr('සටහන් කළ පසු වාර්තා මෙහි දිස්වේ.')} /> : (
            <table>
              <thead>
                <tr>
                  <th>{tr('දිනය')}</th>
                  {isAdmin && <th>{tr('ගුරුවරයා')}</th>}
                  <th>{tr('තත්ත්වය')}</th><th>{tr('පැමිණි වේලාව')}</th><th>{tr('පිටවූ වේලාව')}</th>
                  {isAdmin && <th>{tr('සටහන් කළේ')}</th>}
                  <th>{tr('සටහන්')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight:500 }}>{fmtDate(r.date)}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight:500 }}>{r.teacher?.user?.name}</div>
                        <div className="text-sm text-muted">{r.teacher?.teacherId}</div>
                      </td>
                    )}
                    <td><Badge status={r.status}/></td>
                    <td className="text-muted">{fmtTime(r.checkIn)}</td>
                    <td className="text-muted">{fmtTime(r.checkOut)}</td>
                    {isAdmin && <td className="text-muted text-sm">{r.markedBy?.name || '—'}</td>}
                    <td className="text-muted text-sm">{r.notes ? trSaved(r.notes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARD LIST */}
        <div className="mobile-list">
          {records.length === 0 ? <EmptyState message={tr('පැමිණීමේ වාර්තා නොමැත')} /> : (
            records.map(r => (
              <div key={r._id} className="mobile-card-item">
                <div className="mobile-card-header">
                  <div>
                    {isAdmin && <div className="mobile-card-title">{r.teacher?.user?.name}</div>}
                    <div className="mobile-card-sub">{fmtDate(r.date)}</div>
                  </div>
                  <Badge status={r.status}/>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('පැමිණි වේලාව')}</span>
                  <span className="mobile-card-value">{fmtTime(r.checkIn)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{tr('පිටවූ වේලාව')}</span>
                  <span className="mobile-card-value">{fmtTime(r.checkOut)}</span>
                </div>
                {r.notes && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{tr('සටහන්')}</span>
                    <span className="mobile-card-value" style={{ maxWidth:'65%', textAlign:'right' }}>{trSaved(r.notes)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={tr('පැමිණීම සටහන් කරන්න')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{tr('අවලංගු කරන්න')}</button>
          <button className="btn btn-primary" onClick={handleMark} disabled={saving}>{saving ? tr('සුරකිමින්…') : tr('සටහන් කරන්න')}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">{tr('ගුරුවරයා *')}</label>
          <select className="form-select" value={form.teacherId} onChange={e => setForm(f=>({...f,teacherId:e.target.value}))}>
            <option value="">{tr('ගුරුවරයා තෝරන්න…')}</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name} ({t.teacherId})</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{tr('දිනය *')}</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr('තත්ත්වය *')}</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('සටහන්')}</label>
          <input className="form-input" placeholder={tr('අමතර සටහනක් (අවශ්‍ය නම්)…')} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
        </div>
      </Modal>

      {/* Admin QR Code Modal */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title={tr('අද පැමිණීමේ QR කේතය')}
        footer={<button className="btn btn-ghost" onClick={() => setQrModalOpen(false)}>{tr('වසන්න')}</button>}>
        <div className="qr-panel">
          {qrToken ? (
            <>
              <div className="qr-frame">
                <QRCodeSVG value={qrToken} size={256} />
              </div>
              <p className="qr-help">
                {tr('මෙම QR කේතය ගුරුවරුන්ට පෙන්වන්න. එය තත්පර 30කට වරක් ස්වයංක්‍රීයව වෙනස් වන බැවින් මෙම තිරය විවෘතව තබන්න.')}
              </p>
            </>
          ) : (
            <PageLoader />
          )}
        </div>
      </Modal>

      {/* Teacher QR Scanner Modal */}
      <Modal open={scannerOpen || !!scanSuccess} onClose={closeScanner} title={scanSuccess ? tr('පැමිණීම සටහන් විය') : tr('පැමිණීමේ QR කේතය ස්කෑන් කරන්න')}
        footer={<button className="btn btn-ghost" onClick={closeScanner}>{scanSuccess ? tr('හරි') : tr('අවලංගු කරන්න')}</button>}>
        <div className="qr-panel">
          {scanSuccess ? (
            <>
              <div className="scan-done-icon"><CheckCircle2 size={38} /></div>
              <h3 className="scan-done-title">{tr('සාර්ථකව ස්කෑන් විය')}</h3>
              <p className="qr-help">{scanSuccess.message}</p>
            </>
          ) : (
            <>
              <div id="reader" className="scan-reader"></div>
              <p className="qr-help">
                {tr('දෛනික QR කේතය පෙන්වන තිරය වෙත කැමරාව යොමු කරන්න.')}
              </p>
            </>
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}
