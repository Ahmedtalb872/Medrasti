import { NavLink } from 'react-router-dom'
import { GraduationCap, IdCard, LayoutDashboard, ReceiptText, School, Settings, Users, Wallet } from 'lucide-react'
import Logo from './Logo.jsx'
import { useStore } from '../store/AppStore.jsx'

const groups = [
  {
    title: 'القائمة الرئيسية',
    links: [
      { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: '/students', label: 'الطلاب', icon: Users },
      { to: '/finance', label: 'المالية', icon: Wallet },
      { to: '/invoices', label: 'فواتير الدفع', icon: ReceiptText },
      { to: '/cards', label: 'بطاقات الطلاب', icon: IdCard },
      { to: '/classes', label: 'الأقسام', icon: School },
      { to: '/teachers', label: 'المعلمون', icon: GraduationCap },
    ],
  },
  {
    title: 'أخرى',
    links: [{ to: '/settings', label: 'الإعدادات', icon: Settings }],
  },
]

export default function Sidebar() {
  const { state } = useStore()
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={46} className="brand__logo" />
        <div className="brand__name">{state.settings.schoolName}</div>
      </div>
      <nav className="nav">
        {groups.map((g) => (
          <div key={g.title} className="nav__group">
            <div className="nav__title">{g.title}</div>
            {g.links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className="nav__link">
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__foot">
        <Logo size={40} />
        <div>
          <b>الإدارة</b>
          <span>العام الدراسي <bdi dir="ltr">{state.settings.academicYear}</bdi></span>
        </div>
      </div>
    </aside>
  )
}
