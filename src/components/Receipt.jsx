import { useStore } from '../store/AppStore.jsx'
import { balanceAfter, classOf, receiptNo, studentNo } from '../utils/finance.js'
import { fmtDate, money } from '../utils/format.js'
import DocHeader from './DocHeader.jsx'

// إيصال دفع بمقاس A5
export default function Receipt({ payment }) {
  const { state } = useStore()
  const { currency } = state.settings
  const student = state.students.find((s) => s.id === payment.studentId)
  if (!student) return null
  return (
    <div className="doc doc--a5">
      <DocHeader title="إيصال دفع" subtitle={receiptNo(payment)} />
      <div className="receipt__amount">
        <span>المبلغ المدفوع</span>
        <strong>{money(payment.amount, currency)}</strong>
      </div>
      <table className="doc__kv">
        <tbody>
          <tr><th>اسم الطالب</th><td>{student.name}</td></tr>
          <tr><th>رقم الطالب</th><td dir="ltr">{studentNo(state, student)}</td></tr>
          <tr><th>الفصل</th><td>{classOf(state, student)?.name ?? '-'}</td></tr>
          <tr><th>تاريخ الدفع</th><td>{fmtDate(payment.date)}</td></tr>
          <tr><th>طريقة الدفع</th><td>{payment.method}</td></tr>
          {payment.note && <tr><th>ملاحظة</th><td>{payment.note}</td></tr>}
          <tr><th>المتبقي بعد الدفعة</th><td><b>{money(balanceAfter(state, payment), currency)}</b></td></tr>
        </tbody>
      </table>
      <div className="doc__sign">
        <div>
          <span>توقيع المحاسب</span>
          <div className="doc__line" />
        </div>
        <div className="doc__stamp">ختم المدرسة</div>
      </div>
    </div>
  )
}
