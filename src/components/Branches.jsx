import { useState } from 'react'
import { Building2, MapPin, Plus, Save, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { classOf } from '../utils/finance.js'
import { branchName } from '../utils/branches.js'

// اختيار الفرع المعروض (في القائمة الجانبية)
export function BranchPicker() {
  const { full, branch } = useStore()
  if (branch.locked) {
    return (
      <div className="branch-pick branch-pick--fixed">
        <MapPin size={16} /> {branchName(full, branch.current)}
      </div>
    )
  }
  if (branch.list.length < 2) return null
  return (
    <label className="branch-pick">
      <MapPin size={16} />
      <select value={branch.current ?? ''} onChange={(e) => branch.set(Number(e.target.value) || null)} aria-label="الفرع">
        <option value="">كل الفروع</option>
        {branch.list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  )
}

// هل نعرض اسم الفرع بجانب البيانات؟ (عند عرض كل الفروع فقط)
// eslint-disable-next-line react/only-export-components
export function useShowBranch() {
  const { branch } = useStore()
  return !branch.current && branch.list.length > 1
}

// اسم قسم الطالب، ومعه الفرع عند عرض كل الفروع
export function ClassTag({ student }) {
  const { state, full } = useStore()
  const show = useShowBranch()
  const name = classOf(state, student)?.name ?? '-'
  return show ? <>{name} · {branchName(full, student.branchId)}</> : name
}

// حقل اختيار الفرع في النماذج. allowAll: يسمح بـ«كل الفروع» (للمعلمين)
export function BranchField({ value, onChange, allowAll = false }) {
  const { branch } = useStore()
  if (branch.list.length < 2 || branch.locked) return null
  return (
    <label className="field">
      <span>الفرع</span>
      <select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value) || null)} required={!allowAll}>
        {allowAll && <option value="">كل الفروع</option>}
        {branch.list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  )
}

// إدارة الفروع (في الإعدادات)
export function BranchesPanel() {
  const store = useStore()
  const { full, branch } = store
  const [adding, setAdding] = useState({ name: '', address: '', phone: '' })
  const [edits, setEdits] = useState({})
  if (branch.locked) return null

  const counts = (id) => ({
    classes: full.classes.filter((c) => c.branchId === id).length,
    students: full.students.filter((s) => s.branchId === id).length,
  })
  const value = (b, k) => edits[b.id]?.[k] ?? b[k] ?? ''
  const change = (b, k) => (e) => setEdits({ ...edits, [b.id]: { ...edits[b.id], [k]: e.target.value } })

  async function save(b) {
    const data = { ...edits[b.id] }
    if (data.name !== undefined && !data.name.trim()) return
    if ((await store.updateBranch(b.id, data)) === null) return
    setEdits((all) => {
      const next = { ...all }
      delete next[b.id]
      return next
    })
  }

  async function add(e) {
    e.preventDefault()
    if (!adding.name.trim()) return
    if (!(await store.addBranch({ ...adding, name: adding.name.trim() }))) return
    setAdding({ name: '', address: '', phone: '' })
  }

  return (
    <div className="panel">
      <h2 className="form-title"><Building2 size={18} /> الفروع</h2>
      <p className="muted small">
        كل قسم وطالب يتبع فرعًا. عند وجود أكثر من فرع يظهر اختيار الفرع في القائمة الجانبية، ويمكن عرض كل الفروع معًا.
      </p>
      <div className="branch-list">
        {full.branches.map((b) => {
          const c = counts(b.id)
          const dirty = Boolean(edits[b.id])
          const busy = c.classes + c.students > 0
          return (
            <div key={b.id} className="branch-row">
              <input value={value(b, 'name')} onChange={change(b, 'name')} aria-label="اسم الفرع" />
              <input value={value(b, 'address')} onChange={change(b, 'address')} placeholder="العنوان" aria-label="العنوان" />
              <input value={value(b, 'phone')} onChange={change(b, 'phone')} placeholder="الهاتف" dir="ltr" aria-label="الهاتف" />
              <span className="muted branch-row__count">{c.students} طالب · {c.classes} أقسام</span>
              <div className="row-actions">
                <button className="icon-btn" title="حفظ" disabled={!dirty} onClick={() => save(b)}><Save size={17} /></button>
                <button
                  className="icon-btn icon-btn--danger"
                  title={busy ? 'انقل الأقسام والطلاب أولًا' : full.branches.length < 2 ? 'يجب أن يبقى فرع واحد على الأقل' : 'حذف'}
                  disabled={busy || full.branches.length < 2}
                  onClick={() => confirm(`حذف ${b.name}؟`) && store.deleteBranch(b.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <form className="branch-row branch-row--new" onSubmit={add}>
        <input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} placeholder="اسم الفرع الجديد" required />
        <input value={adding.address} onChange={(e) => setAdding({ ...adding, address: e.target.value })} placeholder="العنوان" />
        <input value={adding.phone} onChange={(e) => setAdding({ ...adding, phone: e.target.value })} placeholder="الهاتف" dir="ltr" />
        <button type="submit" className="btn btn--primary"><Plus size={16} /> إضافة فرع</button>
      </form>
    </div>
  )
}
