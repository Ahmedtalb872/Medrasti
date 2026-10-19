import { useStore } from '../store/AppStore.jsx'
import { account, classOf, INSTALLMENT_STATUS, receiptNo, studentNo } from '../utils/finance.js'
import { fmtDate, money, todayIso } from '../utils/format.js'
import DocHeader from './DocHeader.jsx'
import { Avatar } from './ui.jsx'

// بطاقة الدفع: الرسوم والأقساط والمدفوعات الخاصة بطالب واحد (A4)
export default function PaymentCard({ student }) {
  const { state } = useStore()
  const { currency, academicYear } = state.settings
  const acc = account(state, student)
  return (
    <div className="doc doc--a4">
      <DocHeader title="بطاقة الدفع" subtitle={<>العام الدراسي <bdi dir="ltr">{academicYear}</bdi></>} />

      <div className="doc__student">
        <Avatar student={student} size={64} square />
        <div className="doc__student-grid">
          <div><span>الاسم</span><b>{student.name}</b></div>
          <div><span>رقم الطالب</span><b dir="ltr">{studentNo(state, student)}</b></div>
          <div><span>القسم</span><b>{classOf(state, student)?.name ?? '-'}</b></div>
          <div><span>ولي الأمر</span><b>{student.guardianName || '-'}</b></div>
          <div><span>الهاتف</span><b dir="ltr">{student.guardianPhone || '-'}</b></div>
          <div><span>تاريخ الإصدار</span><b>{fmtDate(todayIso())}</b></div>
        </div>
      </div>

      <div className="doc__summary">
        <div><span>الرسوم الشهرية</span><b>{money(acc.monthly, currency)}</b></div>
        <div><span>الخصم</span><b>{Number(student.discount) || 0}%</b></div>
        <div><span>مستحق السنة</span><b>{money(acc.due, currency)}</b></div>
        <div className="is-success"><span>المدفوع</span><b>{money(acc.paid, currency)}</b></div>
        <div className="is-danger"><span>المتبقي</span><b>{money(acc.remaining, currency)}</b></div>
      </div>

      <h3 className="doc__section">جدول الأقساط</h3>
      <table className="doc__table">
        <thead>
          <tr><th>#</th><th>الشهر</th><th>تاريخ الاستحقاق</th><th>القسط</th><th>المدفوع</th><th>الحالة</th></tr>
        </thead>
        <tbody>
          {acc.plan.map((i) => (
            <tr key={i.index}>
              <td>{i.index}</td>
              <td>{i.label}</td>
              <td>{fmtDate(i.dueDate)}</td>
              <td>{money(i.amount, currency)}</td>
              <td>{money(i.paid, currency)}</td>
              <td><span className={`doc__status doc__status--${INSTALLMENT_STATUS[i.status].tone}`}>{INSTALLMENT_STATUS[i.status].label}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="doc__section">سجل المدفوعات</h3>
      {acc.payments.length ? (
        <table className="doc__table">
          <thead>
            <tr><th>رقم الإيصال</th><th>التاريخ</th><th>الطريقة</th><th>ملاحظة</th><th>المبلغ</th></tr>
          </thead>
          <tbody>
            {acc.payments.map((p) => (
              <tr key={p.id}>
                <td dir="ltr">{receiptNo(p)}</td>
                <td>{fmtDate(p.date)}</td>
                <td>{p.method}</td>
                <td>{p.note || '-'}</td>
                <td>{money(p.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="doc__muted">لا توجد مدفوعات مسجلة بعد.</p>
      )}

      <div className="doc__sign">
        <div>
          <span>توقيع المحاسب</span>
          <div className="doc__line" />
        </div>
        <div>
          <span>توقيع ولي الأمر</span>
          <div className="doc__line" />
        </div>
        <div className="doc__stamp">ختم المدرسة</div>
      </div>
    </div>
  )
}
