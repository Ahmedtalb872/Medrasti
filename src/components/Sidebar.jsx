import { NavLink } from 'react-router-dom'
import { GraduationCap, IdCard, LayoutDashboard, School, Settings, Users, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'

const links = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/students', label: 'الطلاب', icon: Users },
  { to: '/finance', label: 'المالية', icon: Wallet },
  { to: '/cards', label: 'بطاقات الطلاب', icon: IdCard },
  { to: '/classes', label: 'الفصول', icon: School },
  { to: '/teachers', label: 'المعلمون', icon: GraduationCap },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
]

export default function Sidebar() {
  const { state } = useStore()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__logo">
          <School size={24} />
        </div>
        <div>
          <div className="brand__name">مدرستي</div>
          <div className="brand__school">{state.settings.schoolName}</div>
        </div>
      </div>
      <nav className="nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav__link">
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__foot">العام الدراسي <bdi dir="ltr">{state.settings.academicYear}</bdi></div>
    </aside>
  )
}
