import { supabase } from './supabase.js'

// أسماء الحقول في الواجهة ← أسماء الأعمدة في قاعدة البيانات
const FIELDS = {
  branches: { id: 'id', name: 'name', address: 'address', phone: 'phone' },
  teachers: { id: 'id', name: 'name', subject: 'subject', phone: 'phone', branchId: 'branch_id' },
  classes: { id: 'id', name: 'name', level: 'level', teacherId: 'teacher_id', fee: 'fee', branchId: 'branch_id' },
  students: {
    id: 'id',
    name: 'name',
    gender: 'gender',
    birthDate: 'birth_date',
    classId: 'class_id',
    guardianName: 'guardian_name',
    guardianPhone: 'guardian_phone',
    discount: 'discount',
    photo: 'photo',
    enrollDate: 'enroll_date',
    branchId: 'branch_id',
  },
  payments: { id: 'id', studentId: 'student_id', amount: 'amount', date: 'date', method: 'method', note: 'note' },
  expenses: { id: 'id', branchId: 'branch_id', date: 'date', category: 'category', amount: 'amount', description: 'description', method: 'method' },
}

const SETTINGS = {
  schoolName: 'name',
  address: 'address',
  phone: 'phone',
  countryCode: 'country_code',
  currency: 'currency',
  academicYear: 'academic_year',
  startYear: 'start_year',
  startMonth: 'start_month',
  installments: 'installments',
}

const DATES = new Set(['birth_date', 'enroll_date', 'date'])

function toRow(map, obj) {
  const row = {}
  for (const [k, col] of Object.entries(map)) {
    if (k === 'id' || obj[k] === undefined) continue
    // التاريخ الفارغ يُحفظ null، والأرقام المرجعية الفارغة كذلك
    row[col] = obj[k] === '' && (DATES.has(col) || col.endsWith('_id')) ? null : obj[k]
  }
  return row
}

function fromRow(map, row) {
  const obj = {}
  for (const [k, col] of Object.entries(map)) obj[k] = row[col] ?? (col.endsWith('_id') ? null : '')
  return obj
}

function check({ data, error }) {
  if (error) throw error
  return data
}

// Supabase يعيد 1000 صف كحد أقصى في الطلب الواحد، فنجلب على دفعات
async function fetchAll(table, schoolId) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const page = check(
      await supabase.from(table).select('*').eq('school_id', schoolId).order('id', { ascending: true }).range(from, from + 999),
    )
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

export async function loadSchool(schoolId) {
  const school = check(await supabase.from('schools').select('*').eq('id', schoolId).single())
  const [branches, teachers, classes, students, payments, expenses] = await Promise.all(
    ['branches', 'teachers', 'classes', 'students', 'payments', 'expenses'].map(async (t) => (await fetchAll(t, schoolId)).map((r) => fromRow(FIELDS[t], r))),
  )
  const sent = []
  for (let from = 0; ; from += 1000) {
    const page = check(await supabase.from('invoices_sent').select('number, sent_on').eq('school_id', schoolId).range(from, from + 999))
    sent.push(...page)
    if (page.length < 1000) break
  }
  const settings = Object.fromEntries(Object.entries(SETTINGS).map(([k, col]) => [k, school[col]]))
  return {
    settings,
    branches,
    teachers,
    classes,
    students,
    payments,
    expenses,
    invoicesSent: Object.fromEntries(sent.map((r) => [r.number, r.sent_on])),
  }
}

export async function insertRow(table, schoolId, data) {
  const row = check(await supabase.from(table).insert({ ...toRow(FIELDS[table], data), school_id: schoolId }).select().single())
  return fromRow(FIELDS[table], row)
}

export async function updateRow(table, schoolId, id, data) {
  const row = check(
    await supabase.from(table).update(toRow(FIELDS[table], data)).eq('school_id', schoolId).eq('id', id).select().single(),
  )
  return fromRow(FIELDS[table], row)
}

export async function deleteRow(table, schoolId, id) {
  check(await supabase.from(table).delete().eq('school_id', schoolId).eq('id', id))
}

export async function markSent(schoolId, number, sentOn) {
  check(await supabase.from('invoices_sent').upsert({ school_id: schoolId, number, sent_on: sentOn }))
}

export async function updateSchool(schoolId, settings) {
  const row = {}
  for (const [k, col] of Object.entries(SETTINGS)) if (settings[k] !== undefined) row[col] = settings[k]
  check(await supabase.from('schools').update(row).eq('id', schoolId))
}

export async function mySchools(userId) {
  const rows = check(await supabase.from('school_members').select('school_id, role, branch_id, schools(name)').eq('user_id', userId))
  return rows.map((r) => ({ id: r.school_id, role: r.role, branchId: r.branch_id ?? null, name: r.schools?.name ?? '' }))
}

export async function createSchool(name) {
  return check(await supabase.rpc('create_school', { school_name: name }))
}

export async function importSchool(schoolId, data) {
  check(await supabase.rpc('import_school_data', { sid: schoolId, data }))
  if (data.expenses?.length) check(await supabase.rpc('import_school_expenses', { sid: schoolId, data: { expenses: data.expenses } }))
}
