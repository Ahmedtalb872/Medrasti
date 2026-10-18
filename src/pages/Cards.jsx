import { useState } from 'react'
import { Download, IdCard } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { Empty, PageHeader } from '../components/ui.jsx'
import StudentCard from '../components/StudentCard.jsx'
import { useDocs } from '../components/useDocs.jsx'

export default function Cards() {
  const { state } = useStore()
  const docs = useDocs()
  const [classId, setClassId] = useState('')
  const list = state.students.filter((s) => !classId || s.classId === Number(classId))

  return (
    <>
      <PageHeader title="بطاقات الطلاب" subtitle="لكل طالب بطاقة خاصة به برقم ورمز QR">
        <button className="btn btn--primary" onClick={() => docs.allCards(list)} disabled={docs.busy || !list.length}>
          <Download size={18} /> تحميل {list.length} بطاقة PDF
        </button>
      </PageHeader>

      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">كل الفصول</option>
          {state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="muted small">ملف الطباعة يضع 8 بطاقات في كل صفحة A4 بالمقاس القياسي 85.6 × 54 مم</span>
      </div>

      {list.length ? (
        <div className="cards-grid">
          {list.map((s) => (
            <div key={s.id} className="cards-grid__item">
              <div className="card-preview"><StudentCard student={s} /></div>
              <button className="btn btn--ghost" onClick={() => docs.idCard(s)} disabled={docs.busy}>
                <IdCard size={16} /> تحميل بطاقة {s.name}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty>لا يوجد طلاب في هذا الفصل</Empty>
      )}
    </>
  )
}
