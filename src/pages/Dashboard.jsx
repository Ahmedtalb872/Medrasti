import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarDays, ChevronLeft, Download, Percent, Search, Users, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account, ACCOUNT_STATUS, classOf, receiptNo, sum } from '../utils/finance.js'
import { fmtDate, MONTHS, parseDate, toIso } from '../utils/format.js'
import { Avatar, Badge, Empty, PageHeader, Progress, StatCard } from '../components/ui.jsx'
import { useShowBranch } from '../components/Branches.jsx'
import { branchName } from '../utils/branches.js'

const num = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const DONUT_COLORS = ['#6d28d9', '#a78bfa', '#4c1d95', '#c4b5fd', '#8b5cf6', '#ddd6fe']

const RANGES = {
  days: { label: 'آخر 30 يومًا' },
  months6: { label: 'آخر 6 أشهر' },
  months12: { label: 'آخر 12 شهرًا' },
}

// نقاط الرسم: إجمالي المحصَّل حتى نهاية كل يوم أو شهر
function revenueSeries(payments, expenses, range, today = new Date()) {
  const points = []
  if (range === 'days') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      const end = toIso(d)
      points.push({ label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, end })
    }
  } else {
    const n = range === 'months6' ? 6 : 12
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
      points.push({ label: MONTHS[d.getMonth()], end: toIso(d) })
    }
  }
  return points.map((p) => ({
    ...p,
    value: sum(payments.filter((x) => x.date <= p.end)),
    spent: sum(expenses.filter((x) => x.date <= p.end)),
  }))
}

function RevenueChart({ points, currency }) {
  const W = 640
  const H = 240
  const pad = { l: 64, r: 24, t: 16, b: 36 }
  const max = Math.max(...points.map((p) => Math.max(p.value, p.spent)), 1)
  const top = niceStep(max / 4) * 4
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, points.length - 1)
  const y = (v) => H - pad.b - (v / top) * (H - pad.t - pad.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`
  const spentLine = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.spent).toFixed(1)}`).join(' ')
  const hasSpent = points.some((p) => p.spent > 0)
  const ticks = [0, 1, 2, 3, 4].map((k) => (top / 4) * k)
  const every = Math.ceil(points.length / 6)
  const dots = points.map((p, i) => ({ p, i })).filter(({ i }) => i % every === 0 || i === points.length - 1)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} dir="ltr" role="img" aria-label={`إجمالي المحصَّل ${num.format(max)} ${currency}`}>
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="chart__grid" />
          <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" className="chart__axis">{compact.format(t)}</text>
        </g>
      ))}
      <path d={area} fill="url(#revFill)" />
      {hasSpent && <path d={spentLine} className="chart__line chart__line--spent" />}
      <path d={line} className="chart__line" />
      {dots.map(({ p, i }) => (
        <g key={p.end}>
          <circle cx={x(i)} cy={y(p.value)} r="4.5" className="chart__dot">
            <title>{`${p.label}: المحصَّل ${num.format(p.value)} · المصاريف ${num.format(p.spent)} ${currency}`}</title>
          </circle>
          <text x={x(i)} y={H - 8} textAnchor="middle" className="chart__axis">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ألوان المخطط الدائري: كل قسم يأخذ نسبة من الدائرة حسب عدد طلابه
function donutStops(parts, total) {
  const stops = []
  let from = 0
  for (const c of parts) {
    const to = from + (c.count / total) * 100
    stops.push(`${c.color} ${from}% ${to}%`)
    from = to
  }
  return stops.join(', ')
}

// خطوة مقربة للمحور (1، 2، 2.5، 4، 5 × 10ⁿ)
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1))
  return ([1, 2, 2.5, 4, 5, 10].find((m) => m * p >= raw) ?? 10) * p
}

function exportCsv(state, byId) {
  const rows = [['رقم الإيصال', 'الطالب', 'القسم', 'المبلغ', 'التاريخ', 'طريقة الدفع', 'ملاحظة']]
  for (const p of [...state.payments].sort((a, b) => a.date.localeCompare(b.date))) {
    const s = byId[p.studentId]
    rows.push([receiptNo(p), s?.name ?? '', s ? classOf(state, s)?.name ?? '' : '', p.amount, p.date, p.method, p.note ?? ''])
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `payments-${toIso(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ago(iso) {
  const days = Math.round((parseDate(toIso(new Date())) - parseDate(iso)) / 86400000)
  if (days <= 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days <= 10) return `منذ ${days} أيام`
  if (days < 30) return `منذ ${days} يومًا`
  return fmtDate(iso)
}

export default function Dashboard() {
  const { state, full, branch } = useStore()
  const navigate = useNavigate()
  const byBranch = useShowBranch()
  const [range, setRange] = useState('months6')
  const [query, setQuery] = useState('')
  const [now] = useState(() => new Date())
  const { currency } = state.settings
  const byId = Object.fromEntries(state.students.map((s) => [s.id, s]))
  const accounts = state.students.map((s) => ({ student: s, ...account(state, s) }))
  const accById = Object.fromEntries(accounts.map((a) => [a.student.id, a]))
  const due = sum(accounts.map((a) => ({ amount: a.due })))
  const paid = sum(accounts.map((a) => ({ amount: a.paid })))
  const rate = due ? Math.round((paid / due) * 100) : 0
  const late = accounts.filter((a) => a.status === 'overdue').sort((a, b) => b.overdueAmount - a.overdueAmount)
  const recent = [...state.payments].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 6)

  const thisMonth = toIso(now).slice(0, 7)
  const lastMonth = toIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)
  const monthTotal = (m) => sum(state.payments.filter((p) => p.date.startsWith(m)))
  const collectedNow = monthTotal(thisMonth)
  const collectedBefore = monthTotal(lastMonth)
  const netNow = collectedNow - sum(state.expenses.filter((e) => e.date.startsWith(thisMonth)))

  // عند عرض كل الفروع: توزيع الطلاب على الفروع، وإلا على الأقسام
  const groups = byBranch
    ? full.branches.map((b) => ({ id: b.id, name: b.name, match: (s) => s.branchId === b.id }))
    : state.classes.map((c) => ({ id: c.id, name: c.name, match: (s) => s.classId === c.id }))
  const perClass = groups.map((g, i) => ({
    id: g.id,
    name: g.name,
    count: state.students.filter(g.match).length,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))
  const totalStudents = state.students.length || 1
  const donut = donutStops(perClass, totalStudents)

  const points = revenueSeries(state.payments, state.expenses, range, now)
  const todayLabel = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(now)

  return (
    <>
      <PageHeader title="لوحة التحكم" subtitle={`مرحبًا بعودتك — إليك ما يحدث اليوم في ${state.settings.schoolName}${branch.current ? ` · ${branchName(full, branch.current)}` : byBranch ? ' · كل الفروع' : ''}`}>
        <form
          className="search top-search"
          onSubmit={(e) => {
            e.preventDefault()
            navigate(`/students${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
          }}
        >
          <Search size={18} />
          <input placeholder="ابحث عن طالب بالاسم أو الرقم…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        <Link to="/finance?status=overdue" className="top-btn" aria-label={`${late.length} طلاب متأخرون`} title="الطلاب المتأخرون">
          <Bell size={20} />
          {late.length > 0 && <span className="top-btn__dot">{late.length}</span>}
        </Link>
        <div className="date-chip">
          <CalendarDays size={18} />
          <span>{todayLabel}</span>
        </div>
      </PageHeader>

      <div className="stats">
        <StatCard
          icon={Users}
          label="الطلاب"
          value={num.format(state.students.length)}
          hint={`في ${state.classes.length} أقسام · ${state.teachers.length} معلمين`}
        />
        <StatCard
          icon={Wallet}
          label="المحصَّل"
          value={<>{num.format(paid)} <small>{currency}</small></>}
          trend={{ dir: collectedNow >= collectedBefore ? 'up' : 'down', text: num.format(collectedNow), tone: collectedNow >= collectedBefore ? 'success' : 'danger' }}
          hint="هذا الشهر"
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="المتبقي"
          value={<>{num.format(due - paid)} <small>{currency}</small></>}
          trend={late.length ? { dir: 'down', text: `${late.length} طلاب متأخرون` } : undefined}
          hint={late.length ? undefined : 'لا يوجد متأخرون'}
          tone="danger"
        />
        <StatCard icon={Percent} label="نسبة التحصيل" value={`${rate}%`} hint={`من ${num.format(due)} ${currency}`} tone="violet" />
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel__head">
            <h2>المحصَّل والمصاريف</h2>
            <div className="panel__tools">
              <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="الفترة">
                {Object.entries(RANGES).map(([k, r]) => (
                  <option key={k} value={k}>{r.label}</option>
                ))}
              </select>
              <button className="btn btn--ghost" onClick={() => exportCsv(state, byId)}>
                <Download size={16} /> تصدير
              </button>
            </div>
          </div>
          <RevenueChart points={points} currency={currency} />
          <div className="chart-foot">
            <span><i className="dot dot--in" /> المحصَّل</span>
            <span><i className="dot dot--out" /> المصاريف</span>
            <Link to="/expenses" className="chart-foot__net">
              صافي {MONTHS[now.getMonth()]}: <b className={netNow < 0 ? 'text-danger' : 'text-success'}><bdi dir="ltr">{num.format(netNow)}</bdi> {currency}</b>
            </Link>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2>{byBranch ? 'توزيع الطلاب على الفروع' : 'توزيع الطلاب على الأقسام'}</h2>
          </div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${donut || '#ede9fe 0 100%'})` }} />
            <ul className="legend">
              {perClass.map((c) => (
                <li key={c.id}>
                  <i style={{ background: c.color }} />
                  <span>{c.name}</span>
                  <b>{Math.round((c.count / totalStudents) * 100)}%</b>
                </li>
              ))}
            </ul>
          </div>
          <div className="donut-foot">
            إجمالي الطلاب: <b>{state.students.length}</b> · نسبة التحصيل <b>{rate}%</b>
          </div>
          <Progress value={rate} tone="primary" />
        </div>
      </div>

      <div className="panel panel--flush">
        <div className="panel__head">
          <h2>آخر النشاطات</h2>
          <Link to="/finance?tab=payments" className="link link--arrow">
            عرض الكل <ChevronLeft size={16} />
          </Link>
        </div>
        {recent.length ? (
          <div className="table-wrap">
            <table className="table table--activity">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>العملية</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const s = byId[p.studentId]
                  if (!s) return null
                  const st = ACCOUNT_STATUS[accById[s.id].status]
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/students/${s.id}`} className="person">
                          <Avatar student={s} size={40} />
                          <div>
                            <b>{s.name}</b>
                            <span>{classOf(state, s)?.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td>
                        دفع <b>{num.format(p.amount)} {currency}</b> · {p.method}
                        <div className="muted small-line" dir="ltr">{receiptNo(p)}</div>
                      </td>
                      <td className="muted-cell">{ago(p.date)}</td>
                      <td><Badge tone={st.tone}>{st.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>لا توجد مدفوعات بعد</Empty>
        )}
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>طلاب عليهم أقساط متأخرة</h2>
          <Link to="/finance?status=overdue" className="link link--arrow">
            عرض الكل <ChevronLeft size={16} />
          </Link>
        </div>
        {late.length ? (
          <ul className="list list--grid">
            {late.slice(0, 6).map((a) => (
              <li key={a.student.id}>
                <Avatar student={a.student} size={40} />
                <div className="list__main">
                  <Link to={`/students/${a.student.id}`}><b>{a.student.name}</b></Link>
                  <Badge tone={ACCOUNT_STATUS.overdue.tone}>متأخر {num.format(a.overdueAmount)} {currency}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>لا يوجد طلاب متأخرون 🎉</Empty>
        )}
      </div>
    </>
  )
}
