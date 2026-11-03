// فئات المصاريف ولون كل فئة في الرسم
export const EXPENSE_CATEGORIES = [
  { name: 'رواتب', color: '#6d28d9' },
  { name: 'إيجار', color: '#8b5cf6' },
  { name: 'كهرباء وماء', color: '#f59e0b' },
  { name: 'إنترنت وهاتف', color: '#0ea5e9' },
  { name: 'أدوات ومستلزمات', color: '#10b981' },
  { name: 'صيانة', color: '#ef4444' },
  { name: 'نقل', color: '#ec4899' },
  { name: 'أخرى', color: '#94a3b8' },
]

export const categoryColor = (name) => EXPENSE_CATEGORIES.find((c) => c.name === name)?.color ?? '#94a3b8'

export const expenseNo = (e) => `E-${String(e.id).padStart(6, '0')}`
