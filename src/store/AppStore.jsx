import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { seed } from '../data/seed.js'
import { todayIso } from '../utils/format.js'
import { LOCAL_KEY } from '../lib/supabase.js'
import * as db from '../lib/db.js'
import { branchView, withBranches } from '../utils/branches.js'

const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const base = seed()
      return withBranches({ ...base, ...saved, branches: saved.branches, settings: { ...base.settings, ...saved.settings } })
    }
  } catch {
    // تجاهل البيانات التالفة والبدء بالبيانات التجريبية
  }
  return withBranches(seed())
}

const BRANCH_KEY = 'medrasti:branch'

// الفرع المختار للعرض: null = كل الفروع. locked: موظف مرتبط بفرع واحد
function useBranch(full, locked) {
  const [picked, setPicked] = useState(() => {
    try {
      return Number(localStorage.getItem(BRANCH_KEY)) || null
    } catch {
      return null
    }
  })
  const valid = (id) => full.branches.some((b) => b.id === id)
  const current = locked ?? (full.branches.length > 1 && valid(picked) ? picked : null)
  const setBranch = useCallback((id) => {
    try {
      localStorage.setItem(BRANCH_KEY, id ? String(id) : '')
    } catch {
      // التخزين غير متاح
    }
    setPicked(id)
  }, [])
  const state = useMemo(() => branchView(full, current), [full, current])
  const branch = useMemo(
    () => ({ list: full.branches, current, set: setBranch, locked: Boolean(locked), defaultId: current ?? full.branches[0]?.id }),
    [full.branches, current, setBranch, locked],
  )
  return { state, branch }
}

const nextId = (list) => Math.max(0, ...list.map((x) => x.id)) + 1

// تعديلات الحالة المشتركة بين الوضعين المحلي والسحابي
const local = {
  add: (s, key, item) => ({ ...s, [key]: [...s[key], item] }),
  update: (s, key, id, data) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...data } : x)) }),
  remove: (s, key, id) => ({ ...s, [key]: s[key].filter((x) => x.id !== id) }),
  deleteStudent: (s, id) => ({ ...s, students: s.students.filter((x) => x.id !== id), payments: s.payments.filter((p) => p.studentId !== id) }),
  deleteTeacher: (s, id) => ({
    ...s,
    teachers: s.teachers.filter((t) => t.id !== id),
    classes: s.classes.map((c) => (c.teacherId === id ? { ...c, teacherId: null } : c)),
  }),
  deleteClass: (s, id) => ({
    ...s,
    classes: s.classes.filter((c) => c.id !== id),
    students: s.students.map((st) => (st.classId === id ? { ...st, classId: null } : st)),
  }),
}

const newStudent = (data) => ({ enrollDate: todayIso(), photo: '', discount: 0, ...data })

// ---------- الوضع المحلي: البيانات في متصفح المستخدم ----------
export function LocalStore({ children }) {
  const [state, setState] = useState(load)
  const latest = useRef(state)
  const view = useBranch(state, null)

  useLayoutEffect(() => {
    latest.current = state
  }, [state])

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
    } catch {
      // المساحة ممتلئة أو التخزين غير متاح
    }
  }, [state])

  const actions = useMemo(() => {
    const add = (key, data) => {
      const item = { ...data, id: nextId(latest.current[key]) }
      setState((s) => local.add(s, key, item))
      return item
    }
    const update = (key, id, data) => setState((s) => local.update(s, key, id, data))
    const remove = (key, id) => setState((s) => local.remove(s, key, id))

    return {
      addStudent: (data) => add('students', newStudent(data)),
      updateStudent: (id, data) => update('students', id, data),
      deleteStudent: (id) => setState((s) => local.deleteStudent(s, id)),
      addPayment: (data) => add('payments', data),
      deletePayment: (id) => remove('payments', id),
      addTeacher: (data) => add('teachers', data),
      updateTeacher: (id, data) => update('teachers', id, data),
      deleteTeacher: (id) => setState((s) => local.deleteTeacher(s, id)),
      addClass: (data) => add('classes', data),
      updateClass: (id, data) => update('classes', id, data),
      deleteClass: (id) => setState((s) => local.deleteClass(s, id)),
      addBranch: (data) => add('branches', data),
      updateBranch: (id, data) => update('branches', id, data),
      deleteBranch: (id) => remove('branches', id),
      markInvoiceSent: (number) => setState((s) => ({ ...s, invoicesSent: { ...s.invoicesSent, [number]: todayIso() } })),
      updateSettings: (data) => setState((s) => ({ ...s, settings: { ...s.settings, ...data } })),
      resetDemo: () => setState(withBranches(seed())),
    }
  }, [])

  const value = useMemo(
    () => ({ state: view.state, full: state, branch: view.branch, account: null, ...actions }),
    [view, state, actions],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// ---------- الوضع السحابي: بيانات مدرسة واحدة من قاعدة البيانات ----------
// account: { email, school, schools, signOut, switchSchool }
export function CloudStore({ initial, account, children }) {
  const [state, setState] = useState(initial)
  const sid = account.school.id
  const view = useBranch(state, account.school.branchId ?? null)

  const actions = useMemo(() => {
    // كل عملية تُحفظ في قاعدة البيانات أولًا، ثم تظهر على الشاشة
    const run = async (fn) => {
      try {
        return await fn()
      } catch (err) {
        console.error(err)
        alert(`تعذّر الحفظ، تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى.\n${err.message ?? ''}`)
        return null
      }
    }
    const add = (key, data) =>
      run(async () => {
        const item = await db.insertRow(key, sid, data)
        setState((s) => local.add(s, key, item))
        return item
      })
    const update = (key, id, data) =>
      run(async () => {
        const item = await db.updateRow(key, sid, id, data)
        setState((s) => local.update(s, key, id, item))
        return item
      })
    const remove = (key, id, change = (s) => local.remove(s, key, id)) =>
      run(async () => {
        await db.deleteRow(key, sid, id)
        setState(change)
        return true
      })

    return {
      addStudent: (data) => add('students', newStudent(data)),
      updateStudent: (id, data) => update('students', id, data),
      deleteStudent: (id) => remove('students', id, (s) => local.deleteStudent(s, id)),
      addPayment: (data) => add('payments', data),
      deletePayment: (id) => remove('payments', id),
      addTeacher: (data) => add('teachers', data),
      updateTeacher: (id, data) => update('teachers', id, data),
      deleteTeacher: (id) => remove('teachers', id, (s) => local.deleteTeacher(s, id)),
      addClass: (data) => add('classes', data),
      updateClass: (id, data) => update('classes', id, data),
      deleteClass: (id) => remove('classes', id, (s) => local.deleteClass(s, id)),
      addBranch: (data) => add('branches', data),
      updateBranch: (id, data) => update('branches', id, data),
      deleteBranch: (id) => remove('branches', id),
      markInvoiceSent: (number) =>
        run(async () => {
          const day = todayIso()
          await db.markSent(sid, number, day)
          setState((s) => ({ ...s, invoicesSent: { ...s.invoicesSent, [number]: day } }))
          return true
        }),
      updateSettings: (data) =>
        run(async () => {
          await db.updateSchool(sid, data)
          setState((s) => ({ ...s, settings: { ...s.settings, ...data } }))
          return true
        }),
      resetDemo: null,
    }
  }, [sid])

  const value = useMemo(
    () => ({ state: view.state, full: state, branch: view.branch, account, ...actions }),
    [view, state, account, actions],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useStore() {
  return useContext(StoreContext)
}
