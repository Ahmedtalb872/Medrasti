import { useStore } from '../store/AppStore.jsx'
import Logo from './Logo.jsx'

export default function DocHeader({ title, subtitle }) {
  const { settings } = useStore().state
  return (
    <div className="doc__header">
      <div className="doc__brand">
        <Logo size={64} />
        <div>
          <div className="doc__school">{settings.schoolName}</div>
          <div className="doc__contact">
            {settings.address && <>{settings.address} · </>}
            هاتف: <span dir="ltr">{settings.phone}</span>
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
