import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { Avatar, Empty, Modal, PageHeader } from '../components/ui.jsx'

export default function Teachers() {
  const store = useStore()
  const { state } = store
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', phone: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <PageHeader title="المعلمون" subtitle={`${state.teachers.length} معلمين`}>
        <button className="btn btn--primary" onClick={() => setAdding(true)}><Plus size={18} /> إضافة معلم</button>
      </PageHeader>

      <div className="panel panel--flush">
        {state.teachers.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>المعلم</th><th>المادة</th><th>الفصول</th><th>الهاتف</th><th></th></tr></thead>
              <tbody>
                {state.teachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="person">
                        <Avatar student={t} size={36} />
                        <b>{t.name}</b>
                      </div>
                    </td>
                    <td>{t.subject}</td>
                    <td>{state.classes.filter((c) => c.teacherId === t.id).map((c) => c.name).join('، ') || '-'}</td>
                    <td dir="ltr" className="text-start">{t.phone}</td>
                    <td className="row-actions">
                      <button className="icon-btn icon-btn--danger" title="حذف" onClick={() => confirm(`حذف ${t.name}؟`) && store.deleteTeacher(t.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>لا يوجد معلمون</Empty>
        )}
      </div>

      {adding && (
        <Modal title="إضافة معلم" onClose={() => setAdding(false)}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim()) return
              store.addTeacher({ ...form, name: form.name.trim() })
              setForm({ name: '', subject: '', phone: '' })
              setAdding(false)
            }}
          >
            <div className="form-grid">
              <label className="field field--full"><span>الاسم</span><input value={form.name} onChange={set('name')} required autoFocus /></label>
              <label className="field"><span>المادة</span><input value={form.subject} onChange={set('subject')} /></label>
              <label className="field"><span>الهاتف</span><input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setAdding(false)}>إلغاء</button>
              <button type="submit" className="btn btn--primary">حفظ</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
