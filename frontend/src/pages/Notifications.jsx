import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { PageLoader, EmptyState, Modal } from '../components/common'
import { notifAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { publishUnreadCount } from '../components/layout/useUnreadCount'
import toast from 'react-hot-toast'
import { Bell, CalendarCheck, CalendarOff, CheckCheck, Clock, Megaphone, Trash2, Wallet } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICON = { attendance:CalendarCheck, leave:CalendarOff, salary:Wallet, timetable:Clock, announcement:Megaphone, general:Bell }

export default function Notifications() {
  const { isAdmin } = useAuth()
  const [notifs, setNotifs]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [unread, setUnread]               = useState(0)
  const [announceModal, setAnnounceModal] = useState(false)
  const [annForm, setAnnForm]             = useState({ title:'', message:'' })
  const [sending, setSending]             = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await notifAPI.getAll()
      setNotifs(data.notifications); setUnread(data.unreadCount); publishUnreadCount(data.unreadCount)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const markRead    = async (id) => { try { await notifAPI.markRead(id); load() } catch {} }
  const markAllRead = async ()   => { try { await notifAPI.markAllRead(); toast.success('All marked as read'); load() } catch {} }
  const remove      = async (id) => { try { await notifAPI.remove(id); load() } catch { toast.error('Failed') } }

  const sendAnnouncement = async () => {
    if (!annForm.title || !annForm.message) return toast.error('Fill title and message')
    setSending(true)
    try {
      await notifAPI.announce(annForm)
      toast.success('Announcement sent')
      setAnnounceModal(false); setAnnForm({ title:'', message:'' })
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  if (loading) return <AppLayout title="Notifications"><PageLoader /></AppLayout>

  return (
    <AppLayout title="Notifications">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        <div className="page-header-actions">
          {unread > 0 && (
            <button className="btn btn-ghost" onClick={markAllRead}><CheckCheck size={15}/> Mark All Read</button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setAnnounceModal(true)}><Megaphone size={15}/> Announce</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        {notifs.length === 0 ? (
          <EmptyState message="No notifications yet" sub="Alerts for leave, attendance, and announcements will appear here." />
        ) : (
          notifs.map(n => {
            const Icon = TYPE_ICON[n.type] || Bell
            return (
              <div key={n._id}
                className={`notif-row${n.isRead ? '' : ' unread'}`}
                onClick={() => !n.isRead && markRead(n._id)}>
                <div className="notif-icon"><Icon size={18}/></div>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <p className="notif-message">{n.message}</p>
                  <div className="notif-time">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <button className="notif-delete" aria-label={`Delete ${n.title}`} onClick={e => { e.stopPropagation(); remove(n._id) }}>
                  <Trash2 size={16}/>
                </button>
              </div>
            )
          })
        )}
      </div>

      <Modal open={announceModal} onClose={() => setAnnounceModal(false)} title="Send Announcement"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setAnnounceModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={sendAnnouncement} disabled={sending}>{sending ? 'Sending…' : 'Send to All Teachers'}</button>
        </>}>
        <p className="text-sm text-muted" style={{ marginBottom:16 }}>This will send an in-app notification to all active teachers.</p>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" placeholder="Important Announcement" value={annForm.title} onChange={e => setAnnForm(f=>({...f,title:e.target.value}))}/>
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea className="form-textarea" placeholder="Write your message here…" value={annForm.message} onChange={e => setAnnForm(f=>({...f,message:e.target.value}))}/>
        </div>
      </Modal>
    </AppLayout>
  )
}
