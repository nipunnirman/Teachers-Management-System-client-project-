import { tr } from '../../utils/i18n'
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Inbox } from 'lucide-react';
import { STATUS_LABELS } from '../../utils/locale';

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label={tr('වසන්න')}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function PageLoader() {
  return <div className="page-loader"><Spinner size={28} /></div>;
}

export function EmptyState({ message = tr('දත්ත හමු නොවීය'), sub }) {
  return (
    <div className="empty-state">
      <Inbox size={40} strokeWidth={1.5} />
      <h3>{message}</h3>
      {sub && <p className="text-sm">{sub}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = 'gold', icon: Icon }) {
  return (
    <div className={`stat-card ${accent}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {Icon && <div className="stat-icon"><Icon size={16} /></div>}
    </div>
  );
}

export function Badge({ status }) {
  const tone = {
    present: 'badge-green', absent: 'badge-red', late: 'badge-amber', 'half-day': 'badge-blue',
    approved: 'badge-green', rejected: 'badge-red', pending: 'badge-amber', cancelled: 'badge-gray',
    paid: 'badge-green', processed: 'badge-blue', draft: 'badge-gray',
    permanent: 'badge-gold', temporary: 'badge-amber', 'part-time': 'badge-blue',
    active: 'badge-green', inactive: 'badge-red', holiday: 'badge-blue', weekend: 'badge-gray',
  };
  const cls = tone[status] || 'badge-gray';
  const label = STATUS_LABELS[status] || status;
  return <span className={`badge ${cls}`}>{label}</span>;
}
