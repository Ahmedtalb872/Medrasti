import { classes, teachers, students } from '../data/mock.js'

export default function Classes() {
  return (
    <section>
      <h2>الفصول</h2>
      <div className="grid">
        {classes.map((c) => (
          <div key={c.id} className="card">
            <h3>{c.name}</h3>
            <p className="muted">المرحلة: {c.level}</p>
            <p>المعلم المسؤول: {teachers.find((t) => t.id === c.teacherId)?.name ?? '-'}</p>
            <p>عدد الطلاب: {students.filter((s) => s.classId === c.id).length}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
