import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, IdCard, Plus, Search } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { account, ACCOUNT_STATUS, classOf, studentNo } from '../utils/finance.js'
import { Avatar, Badge, Empty, Modal, PageHeader, Progress } from '../components/ui.jsx'
import { StudentForm } from '../components/forms.jsx'
import { useDocs } from '../components/useDocs.jsx'

export default function Students() {
  const store = useStore()
  const { state } = store
  const docs = useDocs()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState('')
  const [adding, setAdding] = useState(false)

  const q = query.trim()
  const rows = state.students
    .filter((s) => !classId || s.classId === Number(classId))
    .filter((s) => !q || s.name.includes(q) || studentNo(state, s).includes(q) || (s.guardianPhone || '').includes(q))
    .map((s) => ({ s, acc: account(state, s) }))

  return (
    <>
      <PageHeader title="الطلاب" subtitle={`${state.students.length} طالبًا مسجّلًا`}>
        <button className="btn btn--primary" onClick={() => setAdding(true)}>
          <Plus size={18} /> إضافة طالب
        </button>
      </PageHeader>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input placeholder="بحث بالاسم أو الرقم أو الهاتف…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">كل الفصول</option>
          {state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="panel panel--flush">
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>الطالب</th><th>الفصل</th><th>ولي الأمر</th><th>السداد</th><th>الحالة</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map(({ s, acc }) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/students/${s.id}`} className="person">
                        <Avatar student={s} size={38} />
                        <div>
                          <b>{s.name}</b>
                          <span dir="ltr">{studentNo(state, s)}</span>
                        </div>
                      </Link>
                    </td>
                    <td>{classOf(state, s)?.name ?? '-'}</td>
                    <td>
                      <div className="cell-stack">
                        <span>{s.guardianName || '-'}</span>
                        <span dir="ltr" className="muted">{s.guardianPhone}</span>
                      </div>
                    </td>
                    <td className="cell-progress">
                      <Progress value={acc.progress} tone={acc.status === 'overdue' ? 'danger' : 'success'} />
                      <span className="muted">{acc.progress}%</span>
                    </td>
                    <td><Badge tone={ACCOUNT_STATUS[acc.status].tone}>{ACCOUNT_STATUS[acc.status].label}</Badge></td>
                    <td className="row-actions">
                      <button className="icon-btn" title="تحميل بطاقة الطالب" onClick={() => docs.idCard(s)} disabled={docs.busy}>
                        <IdCard size={18} />
                      </button>
                      <Link className="icon-btn" title="عرض الملف" to={`/students/${s.id}`}>
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>لا يوجد طلاب مطابقون للبحث</Empty>
        )}
      </div>

      {adding && (
        <Modal title="إضافة طالب جديد" onClose={() => setAdding(false)} wide>
          <StudentForm
            onCancel={() => setAdding(false)}
            onSubmit={(data) => {
              const s = store.addStudent(data)
              setAdding(false)
              navigate(`/students/${s.id}`)
            }}
          />
        </Modal>
      )}
    </>
  )
}
