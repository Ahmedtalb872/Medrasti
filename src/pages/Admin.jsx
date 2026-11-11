import { useCallback, useEffect, useState } from 'react'
import { Building2, Check, Clock, MapPin, MessageCircle, Phone, RefreshCw, School, Users, X } from 'lucide-react'
import * as db from '../lib/db.js'
import { fmtDate } from '../utils/format.js'
import { Badge, Empty, PageHeader, StatCard } from '../components/ui.jsx'

const STATUS = {
  pending: { label: 'قيد المراجعة', tone: 'warning' },
  approved: { label: 'مقبول', tone: 'success' },
  rejected: { label: 'مرفوض', tone: 'danger' },
}

// رقم واتساب: يضيف رمز الدولة عند غيابه
const waNumber = (phone) => {
  const digits = String(phone).replace(/\D/g, '')
  return digits.length <= 8 ? `222${digits}` : digits
}

function RequestCard({ req, onDone }) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const st = STATUS[req.status]

  async function act(fn) {
    setBusy(true)
    setError('')
    try {
      await fn()
      onDone()
    } catch (err) {
      setError(err.message || 'تعذّر تنفيذ العملية')
      setBusy(false)
    }
  }

  return (
    <div className="req-card">
      <div className="req-card__head">
        <div className="req-card__icon"><School size={22} /></div>
        <div className="req-card__title">
          <b>{req.school_name}</b>
          <span>{fmtDate(req.created_at.slice(0, 10))}</span>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      <div className="req-card__grid">
        <span><Users size={15} /> {req.contact_name || '-'}</span>
        <span dir="ltr"><Phone size={15} /> {req.phone || '-'}</span>
        <span><MapPin size={15} /> {req.city || '-'}</span>
        <span><Building2 size={15} /> {req.branches_count} {req.branches_count > 1 ? 'فروع' : 'فرع'} · {req.students_estimate ?? '؟'} طالب تقريبًا</span>
      </div>
      <div className="req-card__email" dir="ltr">{req.email}</div>
      {req.message && <p className="req-card__msg">{req.message}</p>}
      {req.status === 'rejected' && req.reject_reason && <p className="req-card__reason">سبب الرفض: {req.reject_reason}</p>}

      {error && <div className="auth__msg auth__msg--error">{error}</div>}

      {req.status === 'pending' && (
        rejecting ? (
          <div className="req-card__reject">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض (يراه صاحب الطلب)" autoFocus />
            <button className="btn btn--danger-ghost" disabled={busy} onClick={() => act(() => db.rejectSchoolRequest(req.id, reason.trim()))}>
              تأكيد الرفض
            </button>
            <button className="btn btn--ghost" disabled={busy} onClick={() => setRejecting(false)}>إلغاء</button>
          </div>
        ) : (
          <div className="req-card__actions">
            <button className="btn btn--primary" disabled={busy} onClick={() => act(() => db.approveSchoolRequest(req.id))}>
              <Check size={17} /> قبول وإنشاء المدرسة
            </button>
            <button className="btn btn--danger-ghost" disabled={busy} onClick={() => setRejecting(true)}>
              <X size={17} /> رفض
            </button>
            {req.phone && (
              <a className="btn btn--whatsapp-ghost" href={`https://wa.me/${waNumber(req.phone)}`} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> واتساب
              </a>
            )}
          </div>
        )
      )}
    </div>
  )
}

export default function Admin() {
  const [requests, setRequests] = useState(null)
  const [schools, setSchools] = useState([])
  const [tab, setTab] = useState('pending')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [r, s] = await Promise.all([db.listSchoolRequests(), db.listAllSchools()])
      setRequests(r)
      setSchools(s)
    } catch (err) {
      setError(err.message || 'تعذّر التحميل')
    }
  }, [])

  useEffect(() => {
    let live = true
    Promise.all([db.listSchoolRequests(), db.listAllSchools()])
      .then(([r, s]) => {
        if (!live) return
        setRequests(r)
        setSchools(s)
      })
      .catch((err) => live && setError(err.message || 'تعذّر التحميل'))
    return () => {
      live = false
    }
  }, [])

  const count = (s) => requests?.filter((r) => r.status === s).length ?? 0
  const rows = requests?.filter((r) => r.status === tab) ?? []
  const TABS = [
    ['pending', 'قيد المراجعة'],
    ['approved', 'المقبولة'],
    ['rejected', 'المرفوضة'],
    ['schools', 'المدارس'],
  ]

  return (
    <>
      <PageHeader title="لوحة المنصة" subtitle="طلبات المدارس الجديدة والمدارس المسجّلة">
        <button className="btn btn--ghost" onClick={load}><RefreshCw size={16} /> تحديث</button>
      </PageHeader>

      <div className="stats">
        <StatCard icon={Clock} label="طلبات جديدة" value={count('pending')} hint="تنتظر قرارك" tone="danger" />
        <StatCard icon={Check} label="مقبولة" value={count('approved')} tone="success" />
        <StatCard icon={X} label="مرفوضة" value={count('rejected')} tone="violet" />
        <StatCard icon={School} label="المدارس على المنصة" value={schools.length} />
      </div>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>
            {label}
            {k !== 'schools' && <span className="tab-count">{k === 'schools' ? schools.length : count(k)}</span>}
          </button>
        ))}
      </div>

      {error && <div className="auth__msg auth__msg--error">{error}</div>}

      {!requests ? (
        <Empty>جارٍ التحميل…</Empty>
      ) : tab === 'schools' ? (
        <div className="panel panel--flush">
          {schools.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>المدرسة</th><th>تاريخ التسجيل</th></tr></thead>
                <tbody>
                  {schools.map((s) => (
                    <tr key={s.id}><td><b>{s.name}</b></td><td>{fmtDate(s.created_at.slice(0, 10))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>لا توجد مدارس بعد</Empty>
          )}
        </div>
      ) : rows.length ? (
        <div className="req-list">
          {rows.map((r) => <RequestCard key={r.id} req={r} onDone={load} />)}
        </div>
      ) : (
        <Empty>{tab === 'pending' ? 'لا توجد طلبات جديدة' : 'لا توجد طلبات'}</Empty>
      )}
    </>
  )
}
