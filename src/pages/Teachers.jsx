import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { Avatar, Empty, Modal, PageHeader } from '../components/ui.jsx'
import { BranchField, useShowBranch } from '../components/Branches.jsx'
import { branchName } from '../utils/branches.js'

export default function Teachers() {
  const store = useStore()
  const { state, full, branch } = store
  const [adding, setAdding] = useState(false)
  const blank = { name: '', subject: '', phone: '', branchId: branch.current }
  const [form, setForm] = useState(blank)
  const showBranch = useShowBranch()
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
              <thead><tr><th>المعلم</th><th>المادة</th><th>الأقسام</th><th>الهاتف</th><th></th></tr></thead>
              <tbody>
                {state.teachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="person">
                        <Avatar student={t} size={36} />
                        <div>
                          <b>{t.name}</b>
                          {showBranch && <span>{t.branchId ? branchName(full, t.branchId) : 'كل الفروع'}</span>}
                        </div>
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
            onSubmit={async (e) => {
              e.preventDefault()
              if (!form.name.trim()) return
              if (!(await store.addTeacher({ ...form, name: form.name.trim() }))) return
              setForm(blank)
              setAdding(false)
            }}
          >
            <div className="form-grid">
              <label className="field field--full"><span>الاسم</span><input value={form.name} onChange={set('name')} required autoFocus /></label>
              <label className="field"><span>المادة</span><input value={form.subject} onChange={set('subject')} /></label>
              <label className="field"><span>الهاتف</span><input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} /></label>
              <BranchField allowAll value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
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
