import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { MONTHS } from '../utils/format.js'
import { PageHeader } from '../components/ui.jsx'

export default function Settings() {
  const store = useStore()
  const [form, setForm] = useState(store.state.settings)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => {
    setSaved(false)
    setForm({ ...form, [k]: e.target.value })
  }

  function save(e) {
    e.preventDefault()
    store.updateSettings({
      ...form,
      startYear: Number(form.startYear),
      startMonth: Number(form.startMonth),
      installments: Math.min(12, Math.max(1, Number(form.installments) || 1)),
    })
    setSaved(true)
  }

  function reset() {
    if (confirm('سيتم حذف كل البيانات والعودة إلى البيانات التجريبية. متابعة؟')) {
      store.resetDemo()
      location.reload()
    }
  }

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="بيانات المدرسة والنظام المالي" />
      <form className="panel form" onSubmit={save}>
        <h2 className="form-title">بيانات المدرسة</h2>
        <div className="form-grid">
          <label className="field field--full"><span>اسم المدرسة</span><input value={form.schoolName} onChange={set('schoolName')} required /></label>
          <label className="field"><span>العنوان</span><input value={form.address} onChange={set('address')} /></label>
          <label className="field"><span>هاتف التواصل</span><input dir="ltr" value={form.phone} onChange={set('phone')} /></label>
          <label className="field"><span>رمز الدولة لواتساب</span><input dir="ltr" value={form.countryCode ?? ''} onChange={set('countryCode')} placeholder="222" /></label>
        </div>

        <h2 className="form-title">الإعدادات المالية</h2>
        <div className="form-grid">
          <label className="field"><span>العملة</span><input value={form.currency} onChange={set('currency')} required /></label>
          <label className="field"><span>العام الدراسي</span><input value={form.academicYear} onChange={set('academicYear')} required /></label>
          <label className="field">
            <span>شهر بداية الأقساط</span>
            <select value={form.startMonth} onChange={set('startMonth')}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="field"><span>سنة البداية</span><input type="number" value={form.startYear} onChange={set('startYear')} required /></label>
          <label className="field"><span>عدد الأقساط</span><input type="number" min="1" max="12" value={form.installments} onChange={set('installments')} required /></label>
        </div>

        <div className="form-actions form-actions--split">
          <button type="button" className="btn btn--danger-ghost" onClick={reset}><RotateCcw size={16} /> إعادة البيانات التجريبية</button>
          <div className="btn-row">
            {saved && <span className="text-success">تم الحفظ ✓</span>}
            <button type="submit" className="btn btn--primary"><Save size={16} /> حفظ الإعدادات</button>
          </div>
        </div>
      </form>
    </>
  )
}
