import { useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { money } from '../utils/format.js'
import { Modal, PageHeader } from '../components/ui.jsx'

function ClassForm({ initial, onSubmit, onCancel }) {
  const { state } = useStore()
  const [form, setForm] = useState(initial ?? { name: '', level: 'ابتدائي', teacherId: '', fee: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        onSubmit({ ...form, name: form.name.trim(), fee: Number(form.fee) || 0, teacherId: form.teacherId ? Number(form.teacherId) : null })
      }}
    >
      <div className="form-grid">
        <label className="field"><span>اسم القسم</span><input value={form.name} onChange={set('name')} required autoFocus /></label>
        <label className="field">
          <span>المرحلة</span>
          <select value={form.level} onChange={set('level')}>
            <option>روضة</option><option>ابتدائي</option><option>متوسط</option><option>ثانوي</option>
          </select>
        </label>
        <label className="field">
          <span>المعلم المسؤول</span>
          <select value={form.teacherId ?? ''} onChange={set('teacherId')}>
            <option value="">— بدون —</option>
            {state.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>الرسوم السنوية ({state.settings.currency})</span>
          <input type="number" min="0" value={form.fee} onChange={set('fee')} required />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>إلغاء</button>
        <button type="submit" className="btn btn--primary">حفظ</button>
      </div>
    </form>
  )
}

export default function Classes() {
  const store = useStore()
  const { state } = store
  const [modal, setModal] = useState(null)

  return (
    <>
      <PageHeader title="الأقسام" subtitle="الأقسام والرسوم السنوية لكل قسم">
        <button className="btn btn--primary" onClick={() => setModal('new')}><Plus size={18} /> إضافة قسم</button>
      </PageHeader>

      <div className="class-grid">
        {state.classes.map((c) => {
          const count = state.students.filter((s) => s.classId === c.id).length
          return (
            <div key={c.id} className="panel class-card">
              <div className="class-card__head">
                <div>
                  <h2>{c.name}</h2>
                  <span className="muted">{c.level}</span>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="تعديل" onClick={() => setModal(c)}><Pencil size={17} /></button>
                  <button
                    className="icon-btn icon-btn--danger"
                    title={count ? 'لا يمكن حذف قسم فيه طلاب' : 'حذف'}
                    disabled={count > 0}
                    onClick={() => confirm(`حذف القسم ${c.name}؟`) && store.deleteClass(c.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <div className="class-card__fee">{money(c.fee, state.settings.currency)}<span> / سنويًا</span></div>
              <div className="class-card__meta">
                <span><Users size={15} /> {count} طلاب</span>
                <span>{state.teachers.find((t) => t.id === c.teacherId)?.name ?? 'بدون معلم'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'إضافة قسم' : `تعديل ${modal.name}`} onClose={() => setModal(null)}>
          <ClassForm
            initial={modal === 'new' ? null : modal}
            onCancel={() => setModal(null)}
            onSubmit={(data) => {
              if (modal === 'new') store.addClass(data)
              else store.updateClass(modal.id, data)
              setModal(null)
            }}
          />
        </Modal>
      )}
    </>
  )
}
