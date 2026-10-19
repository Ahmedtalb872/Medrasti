import { MONTHS, toIso } from './format.js'

export const ACCOUNT_STATUS = {
  paid: { label: 'مسدَّد بالكامل', tone: 'success' },
  ontrack: { label: 'منتظم', tone: 'info' },
  overdue: { label: 'متأخر', tone: 'danger' },
  notstarted: { label: 'لم يبدأ السداد', tone: 'muted' },
}

export const INSTALLMENT_STATUS = {
  paid: { label: 'مدفوع', tone: 'success' },
  partial: { label: 'جزئي', tone: 'warning' },
  overdue: { label: 'متأخر', tone: 'danger' },
  upcoming: { label: 'قادم', tone: 'muted' },
}

// يوم الاستحقاق من كل شهر
const DUE_DAY = 10

export function classOf(state, student) {
  return state.classes.find((c) => c.id === student.classId)
}

export function studentNo(state, student) {
  return `${state.settings.startYear}-${String(student.id).padStart(4, '0')}`
}

export function receiptNo(payment) {
  return `R-${String(payment.id).padStart(6, '0')}`
}

// رسوم القسم شهرية، والرسوم السنوية = الرسوم الشهرية × عدد الأقساط
export function monthlyFee(state, student) {
  return classOf(state, student)?.fee ?? 0
}

export function annualFee(state, student) {
  return monthlyFee(state, student) * Math.max(1, Number(state.settings.installments) || 1)
}

export function studentDue(state, student) {
  const discount = Math.min(100, Math.max(0, Number(student.discount) || 0))
  return Math.round(annualFee(state, student) * (1 - discount / 100))
}

const byDate = (a, b) => a.date.localeCompare(b.date) || a.id - b.id

export function studentPayments(state, studentId) {
  return state.payments.filter((p) => p.studentId === studentId).sort(byDate)
}

export function sum(list) {
  return list.reduce((t, p) => t + Number(p.amount), 0)
}

// يقسم الرسوم السنوية على أقساط شهرية، ويوزع المدفوعات عليها بالترتيب
export function installmentPlan(state, student, paid, today = new Date()) {
  const { installments, startMonth, startYear } = state.settings
  const n = Math.max(1, Number(installments) || 1)
  const total = studentDue(state, student)
  const base = Math.floor(total / n)
  let pool = paid
  return Array.from({ length: n }, (_, i) => {
    const m = startMonth - 1 + i
    const year = startYear + Math.floor(m / 12)
    const month = m % 12
    const amount = i === n - 1 ? total - base * (n - 1) : base
    const covered = Math.min(pool, amount)
    pool -= covered
    const dueDate = new Date(year, month, DUE_DAY)
    let status = 'upcoming'
    if (covered >= amount) status = 'paid'
    else if (dueDate < today) status = 'overdue'
    else if (covered > 0) status = 'partial'
    return { index: i + 1, label: `${MONTHS[month]} ${year}`, dueDate: toIso(dueDate), amount, paid: covered, status }
  })
}

export function account(state, student) {
  const payments = studentPayments(state, student.id)
  const paid = sum(payments)
  const due = studentDue(state, student)
  const remaining = Math.max(0, due - paid)
  const plan = installmentPlan(state, student, paid)
  const overdueAmount = sum(plan.filter((i) => i.status === 'overdue').map((i) => ({ amount: i.amount - i.paid })))
  let status = 'notstarted'
  if (remaining === 0 && due > 0) status = 'paid'
  else if (overdueAmount > 0) status = 'overdue'
  else if (paid > 0) status = 'ontrack'
  return {
    fee: annualFee(state, student),
    monthly: monthlyFee(state, student),
    due,
    paid,
    remaining,
    overdueAmount,
    progress: due ? Math.min(100, Math.round((paid / due) * 100)) : 100,
    plan,
    payments,
    status,
  }
}

// المتبقي على الطالب مباشرة بعد هذه الدفعة (يُطبع على الإيصال)
export function balanceAfter(state, payment) {
  const student = state.students.find((s) => s.id === payment.studentId)
  if (!student) return 0
  const upTo = studentPayments(state, student.id).filter((p) => byDate(p, payment) <= 0)
  return Math.max(0, studentDue(state, student) - sum(upTo))
}

// الفاتورة: الأقساط المستحقة حتى نهاية الشهر الحالي ولم تُسدَّد بعد
export function invoice(state, student, today = new Date()) {
  const acc = account(state, student)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const lines = acc.plan
    .filter((i) => i.paid < i.amount && new Date(`${i.dueDate}T00:00:00`) <= monthEnd)
    .map((i) => ({ ...i, open: i.amount - i.paid }))
  const next = acc.plan.find((i) => i.paid < i.amount && !lines.some((l) => l.index === i.index))
  const dueNow = sum(lines.map((l) => ({ amount: l.open })))
  const month = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
  return {
    ...acc,
    number: `INV-${month}-${String(student.id).padStart(4, '0')}`,
    lines,
    dueNow,
    next,
  }
}
