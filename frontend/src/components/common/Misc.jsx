import { X } from 'lucide-react';
import { STATUS_BADGE_CLASS, PRIORITY_BADGE_CLASS, PROJECT_STATUS_BADGE_CLASS, WORKSPACE_ROLE_BADGE_CLASS } from '../../utils/constants';

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_BADGE_CLASS[status] || 'badge-Todo'}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_BADGE_CLASS[priority] || 'badge-Medium'}`}>{priority}</span>;
}

export function ProjectStatusBadge({ status }) {
  return <span className={`badge ${PROJECT_STATUS_BADGE_CLASS[status] || 'badge-Planning'}`}>{status}</span>;
}

export function RoleBadge({ role }) {
  return <span className={`badge ${WORKSPACE_ROLE_BADGE_CLASS[role] || 'badge-Member'}`}>{role}</span>;
}

export function EmptyState({ title, subtitle, icon: Icon }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={28} className="text-text-faint mb-1" />}
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="loader">Loading…</div>;
}

export function Modal({ title, onClose, children, maxWidth }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
