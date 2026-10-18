import { teachers } from '../data/mock.js'

export default function Teachers() {
  return (
    <section>
      <h2>المعلمون</h2>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>الاسم</th><th>المادة</th><th>الهاتف</th></tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.subject}</td>
                <td dir="ltr">{t.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
