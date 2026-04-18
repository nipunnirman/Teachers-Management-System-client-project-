import { X, Inbox } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function PageLoader() {
  return <div className="page-loader"><Spinner size={28} /></div>;
}

export function EmptyState({ message = 'No data found', sub }) {
  return (
    <div className="empty-state">
      <Inbox size={48} />
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
      {Icon && <div className="stat-icon"><Icon size={48} /></div>}
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    present: ['badge-green', 'Present'],
    absent:  ['badge-red',   'Absent'],
    late:    ['badge-amber', 'Late'],
    'half-day': ['badge-blue', 'Half Day'],
    approved: ['badge-green', 'Approved'],
    rejected: ['badge-red',   'Rejected'],
    pending:  ['badge-amber', 'Pending'],
    cancelled:['badge-gray',  'Cancelled'],
    paid:     ['badge-green', 'Paid'],
    processed:['badge-blue',  'Processed'],
    draft:    ['badge-gray',  'Draft'],
    permanent:['badge-gold',  'Permanent'],
    temporary:['badge-amber', 'Temporary'],
    'part-time':['badge-blue','Part-time'],
    active:   ['badge-green', 'Active'],
    inactive: ['badge-red',   'Inactive'],
    holiday:  ['badge-blue',  'Holiday'],
    weekend:  ['badge-gray',  'Weekend'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
