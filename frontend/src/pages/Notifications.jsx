import { isEnglish, tr } from '../utils/i18n'
import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { PageLoader, EmptyState, Modal } from '../components/common'
import { notifAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { publishUnreadCount } from '../components/layout/useUnreadCount'
import { useDataRefresh } from '../utils/useDataRefresh'
import toast from 'react-hot-toast'
import { Bell, CalendarCheck, CalendarOff, CheckCheck, Clock, Megaphone, Trash2, Wallet } from 'lucide-react'
import { timeAgo } from '../utils/locale'

const TYPE_ICON = { attendance:CalendarCheck, leave:CalendarOff, salary:Wallet, timetable:Clock, announcement:Megaphone, general:Bell }

export default function Notifications() {
  const { isAdmin } = useAuth()
  const { version, isRefresh } = useDataRefresh()
  const [notifs, setNotifs]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [unread, setUnread]               = useState(0)
  const [announceModal, setAnnounceModal] = useState(false)
  const [annForm, setAnnForm]             = useState({ title:'', message:'' })
  const [sending, setSending]             = useState(false)

  const load = async () => {
    if (!isRefresh()) setLoading(true)
    try {
      const { data } = await notifAPI.getAll()
      setNotifs(data.notifications); setUnread(data.unreadCount); publishUnreadCount(data.unreadCount)
    } catch { toast.error(tr('දැනුම්දීම් ලබාගැනීමට නොහැකි විය')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [version])

  const markRead    = async (id) => { try { await notifAPI.markRead(id); load() } catch {} }
  const markAllRead = async ()   => { try { await notifAPI.markAllRead(); toast.success(tr('සියල්ල කියවූ ලෙස සලකුණු කරන ලදී')); load() } catch {} }
  const remove      = async (id) => { try { await notifAPI.remove(id); load() } catch { toast.error(tr('අසාර්ථක විය')) } }

  const sendAnnouncement = async () => {
    if (!annForm.title || !annForm.message) return toast.error(tr('මාතෘකාව සහ පණිවිඩය ඇතුළත් කරන්න'))
    setSending(true)
    try {
      await notifAPI.announce(annForm)
      toast.success(tr('නිවේදනය යවන ලදී'))
      setAnnounceModal(false); setAnnForm({ title:'', message:'' })
    } catch { toast.error(tr('යැවීමට නොහැකි විය')) }
    finally { setSending(false) }
  }

  if (loading) return <AppLayout title={tr('දැනුම්දීම්')}><PageLoader /></AppLayout>

  return (
    <AppLayout title={tr('දැනුම්දීම්')}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{tr('දැනුම්දීම්')}</h1>
          <p className="page-subtitle">{unread > 0 ? tr('නොකියවූ {count}ක්', { count: unread }) : tr('සියල්ල කියවා ඇත')}</p>
        </div>
        <div className="page-header-actions">
          {unread > 0 && (
            <button className="btn btn-ghost" onClick={markAllRead}><CheckCheck size={15}/> {tr('සියල්ල කියවූ ලෙස සලකුණු කරන්න')}</button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setAnnounceModal(true)}><Megaphone size={15}/> {tr('නිවේදනයක් යවන්න')}</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        {notifs.length === 0 ? (
          <EmptyState message={tr('තවම දැනුම්දීම් නොමැත')} sub={tr('නිවාඩු, පැමිණීම සහ නිවේදන පිළිබඳ දැනුම්දීම් මෙහි දිස්වේ.')} />
        ) : (
          notifs.map(n => {
            const Icon = TYPE_ICON[n.type] || Bell
            return (
              <div key={n._id}
                className={`notif-row${n.isRead ? '' : ' unread'}`}
                onClick={() => !n.isRead && markRead(n._id)}>
                <div className="notif-icon"><Icon size={18}/></div>
                <div className="notif-body">
                  <div className="notif-title">{isEnglish ? (n.titleEn || n.title) : n.title}</div>
                  <p className="notif-message">{isEnglish ? (n.messageEn || n.message) : n.message}</p>
                  <div className="notif-time">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                <button className="notif-delete" aria-label={tr('{title} මකන්න', { title: isEnglish ? (n.titleEn || n.title) : n.title })} onClick={e => { e.stopPropagation(); remove(n._id) }}>
                  <Trash2 size={16}/>
                </button>
              </div>
            )
          })
        )}
      </div>

      <Modal open={announceModal} onClose={() => setAnnounceModal(false)} title={tr('නිවේදනයක් යැවීම')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setAnnounceModal(false)}>{tr('අවලංගු කරන්න')}</button>
          <button className="btn btn-primary" onClick={sendAnnouncement} disabled={sending}>{sending ? tr('යවමින්…') : tr('සියලු ගුරුවරුන්ට යවන්න')}</button>
        </>}>
        <p className="text-sm text-muted" style={{ marginBottom:16 }}>{tr('මෙය සියලු සක්‍රීය ගුරුවරුන්ට යෙදුම තුළ දැනුම්දීමක් ලෙස යැවේ.')}</p>
        <div className="form-group">
          <label className="form-label">{tr('මාතෘකාව *')}</label>
          <input className="form-input" placeholder={tr('වැදගත් නිවේදනය')} value={annForm.title} onChange={e => setAnnForm(f=>({...f,title:e.target.value}))}/>
        </div>
        <div className="form-group">
          <label className="form-label">{tr('පණිවිඩය *')}</label>
          <textarea className="form-textarea" placeholder={tr('ඔබේ පණිවිඩය මෙහි ලියන්න…')} value={annForm.message} onChange={e => setAnnForm(f=>({...f,message:e.target.value}))}/>
        </div>
      </Modal>
    </AppLayout>
  )
}
