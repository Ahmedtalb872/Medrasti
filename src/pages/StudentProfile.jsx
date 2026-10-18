import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, FileText, IdCard, Pencil, Plus, Receipt as ReceiptIcon, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account, ACCOUNT_STATUS, classOf, INSTALLMENT_STATUS, receiptNo, studentNo } from '../utils/finance.js'
import { fmtDate, money } from '../utils/format.js'
import { Badge, Empty, Modal, PageHeader, Progress } from '../components/ui.jsx'
import { PaymentForm, StudentForm } from '../components/forms.jsx'
import StudentCard from '../components/StudentCard.jsx'
import { useDocs } from '../components/useDocs.jsx'

export default function StudentProfile() {
  const { id } = useParams()
  const store = useStore()
  const { state } = store
  const { currency } = state.settings
  const docs = useDocs()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const student = state.students.find((s) => s.id === Number(id))

  if (!student) {
    return (
      <Empty>
        الطالب غير موجود. <Link to="/students" className="link">العودة إلى الطلاب</Link>
      </Empty>
    )
  }

  const acc = account(state, student)
  const status = ACCOUNT_STATUS[acc.status]

  function remove() {
    if (confirm(`حذف الطالب ${student.name} وكل مدفوعاته؟`)) {
      store.deleteStudent(student.id)
      navigate('/students')
    }
  }

  return (
    <>
      <PageHeader title={student.name} subtitle={<>{classOf(state, student)?.name ?? ''} · رقم <bdi dir="ltr">{studentNo(state, student)}</bdi></>}>
        <Link to="/students" className="btn btn--ghost"><ArrowRight size={18} /> الطلاب</Link>
        <button className="btn btn--ghost" onClick={() => setModal('edit')}><Pencil size={16} /> تعديل</button>
        <button className="btn btn--danger-ghost" onClick={remove}><Trash2 size={16} /> حذف</button>
      </PageHeader>

      <div className="profile-top">
        <div className="panel">
          <div className="panel__head"><h2>بطاقة الطالب</h2></div>
          <div className="card-preview"><StudentCard student={student} /></div>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => docs.idCard(student)} disabled={docs.busy}>
              <IdCard size={18} /> تحميل البطاقة PDF
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2>الوضع المالي</h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="money-grid">
            <div><span>الرسوم السنوية</span><b>{money(acc.fee, currency)}</b></div>
            <div><span>الخصم</span><b>{Number(student.discount) || 0}%</b></div>
            <div><span>المستحق</span><b>{money(acc.due, currency)}</b></div>
            <div className="is-success"><span>المدفوع</span><b>{money(acc.paid, currency)}</b></div>
            <div className="is-danger"><span>المتبقي</span><b>{money(acc.remaining, currency)}</b></div>
            <div className={acc.overdueAmount ? 'is-danger' : ''}><span>المتأخر</span><b>{money(acc.overdueAmount, currency)}</b></div>
          </div>
          <Progress value={acc.progress} tone={acc.status === 'overdue' ? 'danger' : 'success'} />
          <div className="muted small">تم سداد {acc.progress}% من الرسوم</div>
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => setModal('pay')} disabled={acc.remaining === 0}>
              <Plus size={18} /> تسجيل دفعة
            </button>
            <button className="btn btn--ghost" onClick={() => docs.paymentCard(student)} disabled={docs.busy}>
              <FileText size={18} /> بطاقة الدفع PDF
            </button>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel panel--flush">
          <div className="panel__head"><h2>الأقساط</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>الشهر</th><th>القسط</th><th>المدفوع</th><th>الحالة</th></tr></thead>
              <tbody>
                {acc.plan.map((i) => (
                  <tr key={i.index}>
                    <td>{i.label}</td>
                    <td>{money(i.amount, currency)}</td>
                    <td>{money(i.paid, currency)}</td>
                    <td><Badge tone={INSTALLMENT_STATUS[i.status].tone}>{INSTALLMENT_STATUS[i.status].label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel panel--flush">
          <div className="panel__head"><h2>المدفوعات والإيصالات</h2></div>
          {acc.payments.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>الإيصال</th><th>التاريخ</th><th>المبلغ</th><th></th></tr></thead>
                <tbody>
                  {[...acc.payments].reverse().map((p) => (
                    <tr key={p.id}>
                      <td dir="ltr" className="text-start">{receiptNo(p)}</td>
                      <td>
                        <div className="cell-stack"><span>{fmtDate(p.date)}</span><span className="muted">{p.method}</span></div>
                      </td>
                      <td><b>{money(p.amount, currency)}</b></td>
                      <td className="row-actions">
                        <button className="icon-btn" title="تحميل الإيصال" onClick={() => docs.receipt(p)} disabled={docs.busy}>
                          <ReceiptIcon size={18} />
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          title="حذف الدفعة"
                          onClick={() => confirm(`حذف الإيصال ${receiptNo(p)}؟`) && store.deletePayment(p.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>لم تُسجَّل أي دفعة بعد</Empty>
          )}
        </div>
      </div>

      {modal === 'edit' && (
        <Modal title="تعديل بيانات الطالب" onClose={() => setModal(null)} wide>
          <StudentForm
            initial={student}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              store.updateStudent(student.id, data)
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'pay' && (
        <Modal title={`تسجيل دفعة — ${student.name}`} onClose={() => setModal(null)}>
          <PaymentForm
            studentId={student.id}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              const p = store.addPayment(data)
              setModal(null)
              docs.receipt(p)
            }}
          />
        </Modal>
      )}
    </>
  )
}
