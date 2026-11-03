// الفروع: كل قسم وطالب يتبع فرعًا، والمعلم يتبع فرعًا أو كل الفروع (branchId فارغ)

export const MAIN_BRANCH = { id: 1, name: 'الفرع الرئيسي', address: '', phone: '' }

// يضيف الفرع الرئيسي للبيانات القديمة التي لم يكن فيها فروع
export function withBranches(s) {
  const branches = s.branches?.length ? s.branches : [MAIN_BRANCH]
  const first = branches[0].id
  const classBranch = Object.fromEntries(s.classes.map((c) => [c.id, c.branchId ?? first]))
  return {
    ...s,
    branches,
    classes: s.classes.map((c) => ({ ...c, branchId: c.branchId ?? first })),
    students: s.students.map((st) => ({ ...st, branchId: st.branchId ?? classBranch[st.classId] ?? first })),
    teachers: s.teachers.map((t) => ({ ...t, branchId: t.branchId ?? null })),
  }
}

// بيانات فرع واحد فقط (أو كل الفروع إذا كان branchId فارغًا)
export function branchView(s, branchId) {
  if (!branchId) return s
  const students = s.students.filter((x) => x.branchId === branchId)
  const ids = new Set(students.map((x) => x.id))
  return {
    ...s,
    classes: s.classes.filter((c) => c.branchId === branchId),
    students,
    teachers: s.teachers.filter((t) => !t.branchId || t.branchId === branchId),
    payments: s.payments.filter((p) => ids.has(p.studentId)),
  }
}

export function branchName(s, id) {
  return s.branches?.find((b) => b.id === id)?.name ?? ''
}
