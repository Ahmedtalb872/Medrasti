import { useStore } from '../store/AppStore.jsx'
import { classOf, invoice, studentNo } from '../utils/finance.js'
import { fmtDate, money, todayIso } from '../utils/format.js'
import DocHeader from './DocHeader.jsx'

// فاتورة الطالب (A5): الأقساط المستحقة الآن وملخص الحساب
export default function Invoice({ student }) {
  const { state } = useStore()
  const { currency, phone } = state.settings
  const inv = invoice(state, student)
  return (
    <div className="doc doc--a5">
      <DocHeader title="فاتورة" subtitle={inv.number} />

      <table className="doc__kv doc__kv--compact">
        <tbody>
          <tr><th>الطالب</th><td>{student.name}</td></tr>
          <tr><th>رقم الطالب</th><td dir="ltr" className="text-start">{studentNo(state, student)}</td></tr>
          <tr><th>القسم</th><td>{classOf(state, student)?.name ?? '-'}</td></tr>
          <tr><th>ولي الأمر</th><td>{student.guardianName || '-'} · <span dir="ltr">{student.guardianPhone}</span></td></tr>
          <tr><th>تاريخ الفاتورة</th><td>{fmtDate(todayIso())}</td></tr>
        </tbody>
      </table>

      {inv.lines.length ? (
        <table className="doc__table">
          <thead>
            <tr><th>البيان</th><th>تاريخ الاستحقاق</th><th>المبلغ</th></tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.index}>
                <td>قسط {l.label}{l.paid > 0 ? ' (المتبقي منه)' : ''}</td>
                <td>{fmtDate(l.dueDate)}</td>
                <td>{money(l.open, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="invoice__ok">
          {inv.remaining === 0 ? 'تم سداد كامل الرسوم. شكرًا لكم.' : 'لا توجد أقساط مستحقة حاليًا.'}
        </p>
      )}

      <div className={`receipt__amount ${inv.dueNow ? 'receipt__amount--due' : ''}`}>
        <span>المبلغ المطلوب الآن</span>
        <strong>{money(inv.dueNow, currency)}</strong>
      </div>

      <div className="doc__summary doc__summary--3">
        <div><span>رسوم السنة</span><b>{money(inv.due, currency)}</b></div>
        <div className="is-success"><span>المدفوع</span><b>{money(inv.paid, currency)}</b></div>
        <div className="is-danger"><span>المتبقي من السنة</span><b>{money(inv.remaining, currency)}</b></div>
      </div>

      {inv.next && !inv.lines.length && (
        <p className="doc__muted">القسط القادم: {inv.next.label} — {money(inv.next.amount - inv.next.paid, currency)}</p>
      )}

      <p className="invoice__foot">
        للاستفسار يرجى التواصل على الرقم <b dir="ltr">{phone}</b>
      </p>
    </div>
  )
}
