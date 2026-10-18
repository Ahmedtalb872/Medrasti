import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'لوحة التحكم', icon: '🏠' },
  { to: '/students', label: 'الطلاب', icon: '🎓' },
  { to: '/teachers', label: 'المعلمون', icon: '👩‍🏫' },
  { to: '/classes', label: 'الفصول', icon: '🏫' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h1 className="logo">مدرستي</h1>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className="nav-link">
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
