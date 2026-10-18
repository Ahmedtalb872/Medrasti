import { School } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'

export default function DocHeader({ title, subtitle }) {
  const { settings } = useStore().state
  return (
    <div className="doc__header">
      <div className="doc__brand">
        <div className="doc__logo">
          <School size={30} />
        </div>
        <div>
          <div className="doc__school">{settings.schoolName}</div>
          <div className="doc__contact">
            {settings.address} · <span dir="ltr">{settings.phone}</span>
          </div>
        </div>
      </div>
      <div className="doc__title">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  )
}
