import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CircleDollarSign, FileText, Percent, Plus, Receipt as ReceiptIcon, Search, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account, ACCOUNT_STATUS, classOf, receiptNo } from '../utils/finance.js'
import { fmtDate, money } from '../utils/format.js'
import { Avatar, Badge, Empty, Modal, PageHeader, Progress, StatCard } from '../components/ui.jsx'
import { PaymentForm } from '../components/forms.jsx'
import { useDocs } from '../components/useDocs.jsx'

export default function Finance() {
  const store = useStore()
  const { state } = store
  const { currency } = state.settings
  const docs = useDocs()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'payments' ? 'payments' : 'accounts'
  const status = params.get('status') ?? ''
  const [query, setQuery] = useState('')
  const [payFor, setPayFor] = useState(null)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const accounts = state.students.map((s) => ({ s, acc: account(state, s) }))
  const due = accounts.reduce((t, a) => t + a.acc.due, 0)
  const paid = accounts.reduce((t, a) => t + a.acc.paid, 0)
  const overdue = accounts.reduce((t, a) => t + a.acc.overdueAmount, 0)
  const q = query.trim()
  const byId = Object.fromEntries(state.students.map((s) => [s.id, s]))

  const rows = accounts.filter(({ s, acc }) => (!status || acc.status === status) && (!q || s.name.includes(q)))
  const payments = [...state.payments]
    .filter((p) => byId[p.studentId] && (!q || byId[p.studentId].name.includes(q) || receiptNo(p).includes(q.toUpperCase())))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)

  return (
    <>
      <PageHeader title="المالية" subtitle="الرسوم الدراسية والأقساط والمدفوعات">
        <button className="btn btn--primary" onClick={() => setPayFor('any')}>
          <Plus size={18} /> تسجيل دفعة
        </button>
      </PageHeader>

      <div className="stats">
        <StatCard icon={CircleDollarSign} label="إجمالي المستحق" value={money(due, currency)} />
        <StatCard icon={Wallet} label="المحصَّل" value={money(paid, currency)} tone="success" />
        <StatCard icon={AlertTriangle} label="المتأخر" value={money(overdue, currency)} tone="danger" />
        <StatCard icon={Percent} label="نسبة التحصيل" value={`${due ? Math.round((paid / due) * 100) : 0}%`} tone="violet" />
      </div>

      <div className="tabs">
        <button className={tab === 'accounts' ? 'is-active' : ''} onClick={() => setParam('tab', '')}>حسابات الطلاب</button>
        <button className={tab === 'payments' ? 'is-active' : ''} onClick={() => setParam('tab', 'payments')}>سجل المدفوعات ({state.payments.length})</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input placeholder={tab === 'accounts' ? 'بحث باسم الطالب…' : 'بحث بالاسم أو رقم الإيصال…'} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {tab === 'accounts' && (
          <select value={status} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(ACCOUNT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
      </div>

      <div className="panel panel--flush">
        {tab === 'accounts' ? (
          rows.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>الطالب</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th>التقدم</th><th>الحالة</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map(({ s, acc }) => (
                    <tr key={s.id}>
                      <td>
                        <Link to={`/students/${s.id}`} className="person">
                          <Avatar student={s} size={34} />
                          <div><b>{s.name}</b><span>{classOf(state, s)?.name}</span></div>
                        </Link>
                      </td>
                      <td>{money(acc.due, currency)}</td>
                      <td className="text-success">{money(acc.paid, currency)}</td>
                      <td className={acc.remaining ? 'text-danger' : ''}>{money(acc.remaining, currency)}</td>
                      <td className="cell-progress">
                        <Progress value={acc.progress} tone={acc.status === 'overdue' ? 'danger' : 'success'} />
                      </td>
                      <td><Badge tone={ACCOUNT_STATUS[acc.status].tone}>{ACCOUNT_STATUS[acc.status].label}</Badge></td>
                      <td className="row-actions">
                        <button className="icon-btn" title="تسجيل دفعة" onClick={() => setPayFor(s.id)} disabled={acc.remaining === 0}>
                          <Plus size={18} />
                        </button>
                        <button className="icon-btn" title="بطاقة الدفع PDF" onClick={() => docs.paymentCard(s)} disabled={docs.busy}>
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>لا توجد حسابات مطابقة</Empty>
          )
        ) : payments.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>الإيصال</th><th>الطالب</th><th>التاريخ</th><th>الطريقة</th><th>المبلغ</th><th></th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td dir="ltr" className="text-start">{receiptNo(p)}</td>
                    <td><Link to={`/students/${p.studentId}`} className="link">{byId[p.studentId].name}</Link></td>
                    <td>{fmtDate(p.date)}</td>
                    <td>{p.method}</td>
                    <td><b>{money(p.amount, currency)}</b></td>
                    <td className="row-actions">
                      <button className="icon-btn" title="تحميل الإيصال PDF" onClick={() => docs.receipt(p)} disabled={docs.busy}>
                        <ReceiptIcon size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>لا توجد مدفوعات</Empty>
        )}
      </div>

      {payFor && (
        <Modal title="تسجيل دفعة" onClose={() => setPayFor(null)}>
          <PaymentForm
            studentId={payFor === 'any' ? undefined : payFor}
            onCancel={() => setPayFor(null)}
            onSubmit={(data) => {
              const p = store.addPayment(data)
              setPayFor(null)
              docs.receipt(p)
            }}
          />
        </Modal>
      )}
    </>
  )
}
