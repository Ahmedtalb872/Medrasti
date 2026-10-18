import { useState } from 'react'
import { students as initial, classes } from '../data/mock.js'

const empty = { name: '', classId: classes[0].id, guardianPhone: '' }

export default function Students() {
  const [students, setStudents] = useState(initial)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(empty)

  const className = (id) => classes.find((c) => c.id === id)?.name ?? '-'
  const filtered = students.filter((s) => s.name.includes(query.trim()))

  function addStudent(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = Math.max(0, ...students.map((s) => s.id)) + 1
    setStudents([...students, { ...form, id, name: form.name.trim() }])
    setForm(empty)
  }

  function removeStudent(id) {
    setStudents(students.filter((s) => s.id !== id))
  }

  return (
    <section>
      <h2>الطلاب</h2>

      <form className="card form" onSubmit={addStudent}>
        <input
          placeholder="اسم الطالب"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          placeholder="هاتف ولي الأمر"
          value={form.guardianPhone}
          onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
        />
        <button type="submit">إضافة طالب</button>
      </form>

      <input
        className="search"
        placeholder="بحث بالاسم..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>الاسم</th><th>الفصل</th><th>هاتف ولي الأمر</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{className(s.classId)}</td>
                <td dir="ltr">{s.guardianPhone}</td>
                <td><button className="danger" onClick={() => removeStudent(s.id)}>حذف</button></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="muted">لا يوجد طلاب</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
