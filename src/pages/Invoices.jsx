import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, Download, FileText, ReceiptText, Search, Send, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { classOf, invoice } from '../utils/finance.js'
import { fmtDate, money, MONTHS } from '../utils/format.js'
import { Avatar, Badge, Empty, PageHeader, StatCard } from '../components/ui.jsx'
import InvoiceModal from '../components/InvoiceModal.jsx'
import { useDocs } from '../components/useDocs.jsx'

const FILTERS = [
  { key: 'due', label: 'عليهم مبلغ' },
  { key: 'notsent', label: 'لم تُرسل بعد' },
  { key: 'all', label: 'الكل' },
]

// فواتير الدفع: فاتورة الشهر لكل طالب، مع إرسالها على واتساب وتتبّع ما أُرسل
export default function Invoices() {
  const { state } = useStore()
  const { currency } = state.settings
  const docs = useDocs()
  const [filter, setFilter] = useState('due')
  const [classId, setClassId] = useState('')
  const [query, setQuery] = useState('')
  const [sendTo, setSendTo] = useState(null)

  const [now] = useState(() => new Date())
  const all = state.students.map((s) => ({ s, inv: invoice(state, s) }))
  const sentOn = (inv) => state.invoicesSent?.[inv.number]
  const due = all.filter((r) => r.inv.dueNow > 0)
  const total = due.reduce((t, r) => t + r.inv.dueNow, 0)
  const sentCount = due.filter((r) => sentOn(r.inv)).length

  const q = query.trim()
  const rows = all
    .filter(({ inv }) => filter === 'all' || (inv.dueNow > 0 && (filter === 'due' || !sentOn(inv))))
    .filter(({ s }) => !classId || s.classId === Number(classId))
    .filter(({ s }) => !q || s.name.includes(q))
    .sort((a, b) => b.inv.dueNow - a.inv.dueNow)

  return (
    <>
      <PageHeader title="فواتير الدفع" subtitle={`فواتير شهر ${MONTHS[now.getMonth()]} ${now.getFullYear()} — فاتورة لكل طالب`}>
        <button className="btn btn--primary" onClick={() => docs.allInvoices(rows.map((r) => r.s))} disabled={docs.busy || !rows.length}>
          <Download size={18} /> تحميل {rows.length} فاتورة PDF
        </button>
      </PageHeader>

      <div className="stats">
        <StatCard icon={ReceiptText} label="فواتير مستحقة" value={due.length} hint={`من ${state.students.length} طلاب`} />
        <StatCard icon={Wallet} label="المطلوب تحصيله الآن" value={money(total, currency)} tone="danger" />
        <StatCard icon={CheckCheck} label="أُرسلت على واتساب" value={<bdi dir="ltr">{sentCount} / {due.length}</bdi>} tone="success" />
      </div>

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'is-active' : ''} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input placeholder="بحث باسم الطالب…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">كل الأقسام</option>
          {state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {rows.length ? (
        <div className="invoice-list">
          {rows.map(({ s, inv }) => {
            const sent = sentOn(inv)
            return (
              <div key={s.id} className="invoice-row">
                <Link to={`/students/${s.id}`} className="person invoice-row__who">
                  <Avatar student={s} size={42} />
                  <div>
                    <b>{s.name}</b>
                    <span>{classOf(state, s)?.name} · <span dir="ltr">{inv.number}</span></span>
                  </div>
                </Link>
                <div className="invoice-row__amount">
                  <b className={inv.dueNow ? 'text-danger' : 'text-success'}>{money(inv.dueNow, currency)}</b>
                  <span className="muted">
                    {inv.lines.length ? inv.lines.map((l) => l.label).join('، ') : inv.remaining ? 'لا شيء مستحق الآن' : 'مسدَّد بالكامل'}
                  </span>
                </div>
                <div className="invoice-row__status">
                  {sent ? <Badge tone="success">✓ أُرسلت {fmtDate(sent)}</Badge> : <Badge tone="muted">لم تُرسل</Badge>}
                </div>
                <div className="invoice-row__actions">
                  <button className="btn btn--whatsapp" onClick={() => setSendTo(s)}>
                    <Send size={16} /> {sent ? 'إعادة إرسال' : 'إرسال'}
                  </button>
                  <button className="icon-btn" title="تحميل الفاتورة PDF" onClick={() => docs.invoice(s)} disabled={docs.busy}>
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="panel"><Empty>{filter === 'notsent' ? 'كل الفواتير المستحقة أُرسلت ✓' : 'لا توجد فواتير مطابقة'}</Empty></div>
      )}

      {sendTo && <InvoiceModal student={sendTo} onClose={() => setSendTo(null)} />}
    </>
  )
}
