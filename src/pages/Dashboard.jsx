import { Link } from 'react-router-dom'
import { AlertTriangle, GraduationCap, TrendingUp, Users, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account, ACCOUNT_STATUS, receiptNo } from '../utils/finance.js'
import { fmtDate, money } from '../utils/format.js'
import { Avatar, Badge, Empty, PageHeader, Progress, StatCard } from '../components/ui.jsx'

export default function Dashboard() {
  const { state } = useStore()
  const { currency } = state.settings
  const accounts = state.students.map((s) => ({ student: s, ...account(state, s) }))
  const due = accounts.reduce((t, a) => t + a.due, 0)
  const paid = accounts.reduce((t, a) => t + a.paid, 0)
  const rate = due ? Math.round((paid / due) * 100) : 0
  const late = accounts.filter((a) => a.status === 'overdue').sort((a, b) => b.overdueAmount - a.overdueAmount)
  const recent = [...state.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 6)
  const byId = Object.fromEntries(state.students.map((s) => [s.id, s]))

  return (
    <>
      <PageHeader title="لوحة التحكم" subtitle={`نظرة عامة على ${state.settings.schoolName}`} />

      <div className="stats">
        <StatCard icon={Users} label="الطلاب" value={state.students.length} hint={`${state.classes.length} أقسام`} />
        <StatCard icon={GraduationCap} label="المعلمون" value={state.teachers.length} tone="violet" />
        <StatCard icon={Wallet} label="المحصَّل" value={money(paid, currency)} hint={`من ${money(due, currency)}`} tone="success" />
        <StatCard icon={AlertTriangle} label="المتبقي" value={money(due - paid, currency)} hint={`${late.length} طلاب متأخرون`} tone="danger" />
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2><TrendingUp size={18} /> نسبة التحصيل</h2>
          <b className="big-number">{rate}%</b>
        </div>
        <Progress value={rate} tone="success" />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel__head">
            <h2>آخر المدفوعات</h2>
            <Link to="/finance?tab=payments" className="link">عرض الكل</Link>
          </div>
          {recent.length ? (
            <ul className="list">
              {recent.map((p) => byId[p.studentId] && (
                <li key={p.id}>
                  <Avatar student={byId[p.studentId]} size={36} />
                  <div className="list__main">
                    <b>{byId[p.studentId].name}</b>
                    <span>{fmtDate(p.date)} · <span dir="ltr">{receiptNo(p)}</span></span>
                  </div>
                  <b className="amount">{money(p.amount, currency)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>لا توجد مدفوعات بعد</Empty>
          )}
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2>طلاب عليهم أقساط متأخرة</h2>
            <Link to="/finance?status=overdue" className="link">عرض الكل</Link>
          </div>
          {late.length ? (
            <ul className="list">
              {late.slice(0, 6).map((a) => (
                <li key={a.student.id}>
                  <Avatar student={a.student} size={36} />
                  <div className="list__main">
                    <Link to={`/students/${a.student.id}`}><b>{a.student.name}</b></Link>
                    <Badge tone={ACCOUNT_STATUS.overdue.tone}>متأخر {money(a.overdueAmount, currency)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>لا يوجد طلاب متأخرون 🎉</Empty>
          )}
        </div>
      </div>
    </>
  )
}
