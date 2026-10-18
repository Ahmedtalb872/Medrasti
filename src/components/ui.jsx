import { useEffect } from 'react'
import { X } from 'lucide-react'
import { initials } from '../utils/format.js'

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0d9488', '#4f46e5', '#0891b2', '#65a30d']

export function Avatar({ student, size = 40, square = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: square ? size * 0.18 : '50%',
    fontSize: size * 0.36,
    background: AVATAR_COLORS[student.id % AVATAR_COLORS.length],
  }
  if (student.photo) {
    return <img className="avatar" src={student.photo} alt="" style={style} />
  }
  return (
    <span className="avatar" style={style}>
      {initials(student.name)}
    </span>
  )
}

export function Badge({ tone = 'muted', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Progress({ value, tone = 'primary' }) {
  return (
    <div className="progress">
      <div className={`progress__bar progress__bar--${tone}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </header>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon tone-${tone}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {hint && <div className="stat-card__hint">{hint}</div>}
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}
