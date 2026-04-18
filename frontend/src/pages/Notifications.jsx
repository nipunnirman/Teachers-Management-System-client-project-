import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { PageLoader, EmptyState, Modal } from '../components/common'
import { notifAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, Trash2, Megaphone } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TYPE_COLOR = { attendance:'var(--green)', leave:'var(--amber)', salary:'var(--gold)', timetable:'var(--blue)', announcement:'var(--red)', general:'var(--text-2)' }
const TYPE_ICON  = { attendance:'📋', leave:'🏖️', salary:'💰', timetable:'📅', announcement:'📢', general:'🔔' }

export default function Notifications() {
  const { isAdmin } = useAuth()
  const [notifs, setNotifs]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [unread, setUnread]         = useState(0)
  const [announceModal, setAnnounceModal] = useState(false)
  const [annForm, setAnnForm]       = useState({ title:'', message:'' })
  const [sending, setSending]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await notifAPI.getAll()
      setNotifs(data.notifications)
      setUnread(data.unreadCount)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try { await notifAPI.markRead(id); load() } catch {}
  }

  const markAllRead = async () => {
    try { await notifAPI.markAllRead(); toast.success('All marked as read'); load() } catch {}
  }

  const remove = async (id) => {
    try { await notifAPI.remove(id); load() } catch { toast.error('Failed') }
  }

  const sendAnnouncement = async () => {
    if (!annForm.title || !annForm.message) return toast.error('Fill title and message')
    setSending(true)
    try {
      await notifAPI.announce(annForm)
      toast.success('Announcement sent to all teachers')
      setAnnounceModal(false)
      setAnnForm({ title:'', message:'' })
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
        <div style={{ display:'flex', gap:10 }}>
          {unread > 0 && (
            <button className="btn btn-ghost" onClick={markAllRead}>
              <CheckCheck size={15}/> Mark All Read
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setAnnounceModal(true)}>
              <Megaphone size={15}/> Send Announcement
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        {notifs.length === 0 ? (
          <div style={{ padding:24 }}><EmptyState message="No notifications yet" sub="You'll see alerts for leave, attendance, and announcements here." /></div>
        ) : (
          <div>
            {notifs.map((n, i) => (
              <div key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                style={{
                  display:'flex', alignItems:'flex-start', gap:14,
                  padding:'16px 20px',
                  borderBottom: i < notifs.length-1 ? '1px solid var(--border)' : 'none',
                  background: n.isRead ? 'transparent' : 'rgba(212,168,75,0.04)',
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition:'background 0.15s',
                }}>
                {/* Icon */}
                <div style={{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, background:'var(--bg)', border:'1px solid var(--border)', flexShrink:0 }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <span style={{ fontWeight: n.isRead ? 400 : 600, fontSize:14 }}>{n.title}</span>
                    {!n.isRead && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--gold)', flexShrink:0, display:'block' }}/>}
                    <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:'auto' }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>{n.message}</p>
                  <span style={{ fontSize:11, color: TYPE_COLOR[n.type] || 'var(--text-3)', textTransform:'capitalize', marginTop:4, display:'inline-block' }}>
                    {n.type}
                  </span>
                </div>
                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); remove(n._id) }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:4, borderRadius:6, display:'flex', flexShrink:0, transition:'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text-3)'}>
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
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
          <input className="form-input" placeholder="Important Announcement" value={annForm.title} onChange={e => setAnnForm(f=>({...f,title:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea className="form-textarea" placeholder="Write your message here…" value={annForm.message} onChange={e => setAnnForm(f=>({...f,message:e.target.value}))} />
        </div>
      </Modal>
    </AppLayout>
  )
}
