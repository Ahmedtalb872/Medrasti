import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { seed } from '../data/seed.js'
import { todayIso } from '../utils/format.js'

const KEY = 'medrasti:data:v1'
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const base = seed()
      return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } }
    }
  } catch {
    // تجاهل البيانات التالفة والبدء بالبيانات التجريبية
  }
  return seed()
}

const nextId = (list) => Math.max(0, ...list.map((x) => x.id)) + 1

export function AppProvider({ children }) {
  const [state, setState] = useState(load)
  const latest = useRef(state)

  useLayoutEffect(() => {
    latest.current = state
  }, [state])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // المساحة ممتلئة أو التخزين غير متاح
    }
  }, [state])

  const actions = useMemo(() => {
    const add = (key, data) => {
      const item = { ...data, id: nextId(latest.current[key]) }
      setState((s) => ({ ...s, [key]: [...s[key], item] }))
      return item
    }
    const update = (key, id, data) =>
      setState((s) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...data } : x)) }))
    const remove = (key, id) => setState((s) => ({ ...s, [key]: s[key].filter((x) => x.id !== id) }))

    return {
      addStudent: (data) => add('students', { enrollDate: todayIso(), photo: '', discount: 0, ...data }),
      updateStudent: (id, data) => update('students', id, data),
      deleteStudent: (id) =>
        setState((s) => ({
          ...s,
          students: s.students.filter((x) => x.id !== id),
          payments: s.payments.filter((p) => p.studentId !== id),
        })),
      addPayment: (data) => add('payments', data),
      deletePayment: (id) => remove('payments', id),
      addTeacher: (data) => add('teachers', data),
      updateTeacher: (id, data) => update('teachers', id, data),
      deleteTeacher: (id) =>
        setState((s) => ({
          ...s,
          teachers: s.teachers.filter((t) => t.id !== id),
          classes: s.classes.map((c) => (c.teacherId === id ? { ...c, teacherId: null } : c)),
        })),
      addClass: (data) => add('classes', data),
      updateClass: (id, data) => update('classes', id, data),
      deleteClass: (id) => remove('classes', id),
      updateSettings: (data) => setState((s) => ({ ...s, settings: { ...s.settings, ...data } })),
      resetDemo: () => setState(seed()),
    }
  }, [])

  const value = useMemo(() => ({ state, ...actions }), [state, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useStore() {
  return useContext(StoreContext)
}
