import { students, teachers, classes } from '../data/mock.js'

export default function Dashboard() {
  const stats = [
    { label: 'عدد الطلاب', value: students.length, icon: '🎓' },
    { label: 'عدد المعلمين', value: teachers.length, icon: '👩‍🏫' },
    { label: 'عدد الفصول', value: classes.length, icon: '🏫' },
  ]
  return (
    <section>
      <h2>لوحة التحكم</h2>
      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="card stat">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
