import { NavLink } from 'react-router-dom'
import { GraduationCap, IdCard, LayoutDashboard, LogOut, ReceiptText, School, Settings, Users, Wallet } from 'lucide-react'
import Logo from './Logo.jsx'
import { useStore } from '../store/AppStore.jsx'
import { APP_LOGO, APP_NAME } from '../brand.js'

const ROLES = { owner: 'مالك المدرسة', admin: 'مدير', accountant: 'محاسب', secretary: 'سكرتير' }

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
  const { state, account } = useStore()
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={APP_LOGO} alt={APP_NAME} width={46} height={46} className="app-logo brand__app" />
        <div>
          <div className="brand__name">{APP_NAME}</div>
          <div className="brand__school">{state.settings.schoolName}</div>
        </div>
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
        <div className="sidebar__who">
          {account ? (
            <>
              <b>{ROLES[account.school.role] ?? 'عضو'}</b>
              <span dir="ltr" title={account.email}>{account.email}</span>
              {account.schools.length > 1 && (
                <select value={account.school.id} onChange={(e) => account.switchSchool(e.target.value)} aria-label="المدرسة">
                  {account.schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </>
          ) : (
            <>
              <b>الإدارة</b>
              <span>العام الدراسي <bdi dir="ltr">{state.settings.academicYear}</bdi></span>
            </>
          )}
        </div>
        {account && (
          <button className="sidebar__out" onClick={account.signOut} title="تسجيل الخروج" aria-label="تسجيل الخروج">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  )
}
