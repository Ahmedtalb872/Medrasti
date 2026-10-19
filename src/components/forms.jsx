import { useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account } from '../utils/finance.js'
import { money, PAYMENT_METHODS, resizeImage, todayIso } from '../utils/format.js'
import { Avatar } from './ui.jsx'

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? 'field--full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function StudentForm({ initial, onSubmit, onCancel }) {
  const { state } = useStore()
  const [form, setForm] = useState(
    initial ?? {
      name: '',
      gender: 'ذكر',
      birthDate: '',
      classId: state.classes[0]?.id ?? null,
      guardianName: '',
      guardianPhone: '',
      discount: 0,
      photo: '',
    },
  )
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    if (file) setForm({ ...form, photo: await resizeImage(file) })
  }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      classId: Number(form.classId),
      discount: Math.min(100, Math.max(0, Number(form.discount) || 0)),
    })
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="photo-field">
        <Avatar student={{ id: initial?.id ?? 0, ...form, name: form.name || '؟' }} size={72} square />
        <div className="photo-field__actions">
          <label className="btn btn--ghost">
            <Camera size={16} /> {form.photo ? 'تغيير الصورة' : 'إضافة صورة'}
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
          {form.photo && (
            <button type="button" className="btn btn--ghost" onClick={() => setForm({ ...form, photo: '' })}>
              <Trash2 size={16} /> حذف
            </button>
          )}
        </div>
      </div>
      <div className="form-grid">
        <Field label="اسم الطالب" full>
          <input value={form.name} onChange={set('name')} required autoFocus />
        </Field>
        <Field label="الجنس">
          <select value={form.gender} onChange={set('gender')}>
            <option>ذكر</option>
            <option>أنثى</option>
          </select>
        </Field>
        <Field label="تاريخ الميلاد">
          <input type="date" value={form.birthDate} onChange={set('birthDate')} />
        </Field>
        <Field label="القسم">
          <select value={form.classId ?? ''} onChange={set('classId')} required>
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {money(c.fee, state.settings.currency)} شهريًا
              </option>
            ))}
          </select>
        </Field>
        <Field label="الخصم (%)">
          <input type="number" min="0" max="100" value={form.discount} onChange={set('discount')} />
        </Field>
        <Field label="اسم ولي الأمر">
          <input value={form.guardianName} onChange={set('guardianName')} />
        </Field>
        <Field label="هاتف ولي الأمر">
          <input type="tel" dir="ltr" value={form.guardianPhone} onChange={set('guardianPhone')} />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>إلغاء</button>
        <button type="submit" className="btn btn--primary">حفظ</button>
      </div>
    </form>
  )
}

export function PaymentForm({ studentId, onSubmit, onCancel }) {
  const { state } = useStore()
  const { currency } = state.settings
  const [form, setForm] = useState({
    studentId: studentId ?? '',
    amount: '',
    date: todayIso(),
    method: PAYMENT_METHODS[0],
    note: '',
  })
  const student = state.students.find((s) => s.id === Number(form.studentId))
  const acc = student ? account(state, student) : null
  const nextInstallment = acc?.plan.find((i) => i.paid < i.amount)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function submit(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!student || !(amount > 0) || amount > acc.remaining) return
    onSubmit({ ...form, studentId: student.id, amount, note: form.note.trim() })
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        {!studentId && (
          <Field label="الطالب" full>
            <select value={form.studentId} onChange={set('studentId')} required>
              <option value="">— اختر الطالب —</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}
        {acc && (
          <div className="pay-hint field--full">
            <div><span>المتبقي</span><b>{money(acc.remaining, currency)}</b></div>
            {nextInstallment && (
              <div>
                <span>القسط القادم ({nextInstallment.label})</span>
                <b>{money(nextInstallment.amount - nextInstallment.paid, currency)}</b>
              </div>
            )}
            <div className="pay-hint__quick">
              {nextInstallment && (
                <button type="button" className="chip" onClick={() => setForm({ ...form, amount: nextInstallment.amount - nextInstallment.paid })}>
                  قسط واحد
                </button>
              )}
              {acc.remaining > 0 && (
                <button type="button" className="chip" onClick={() => setForm({ ...form, amount: acc.remaining })}>
                  كامل المتبقي
                </button>
              )}
            </div>
          </div>
        )}
        <Field label={`المبلغ (${currency})`}>
          <input type="number" min="1" max={acc?.remaining || undefined} value={form.amount} onChange={set('amount')} required />
        </Field>
        <Field label="تاريخ الدفع">
          <input type="date" value={form.date} onChange={set('date')} required />
        </Field>
        <Field label="طريقة الدفع">
          <select value={form.method} onChange={set('method')}>
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="ملاحظة">
          <input value={form.note} onChange={set('note')} />
        </Field>
      </div>
      {acc && acc.remaining === 0 && <p className="form-note">هذا الطالب سدّد كامل الرسوم.</p>}
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>إلغاء</button>
        <button type="submit" className="btn btn--primary" disabled={!acc || acc.remaining === 0}>تسجيل الدفعة</button>
      </div>
    </form>
  )
}
