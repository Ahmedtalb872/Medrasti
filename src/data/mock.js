// بيانات تجريبية مؤقتة حتى يتم ربط النظام بقاعدة بيانات
export const classes = [
  { id: 1, name: 'الأول أ', level: 'ابتدائي', teacherId: 1 },
  { id: 2, name: 'الثاني ب', level: 'ابتدائي', teacherId: 2 },
  { id: 3, name: 'الأول متوسط', level: 'متوسط', teacherId: 3 },
]

export const teachers = [
  { id: 1, name: 'فاطمة أحمد', subject: 'اللغة العربية', phone: '0600000001' },
  { id: 2, name: 'محمد سالم', subject: 'الرياضيات', phone: '0600000002' },
  { id: 3, name: 'عائشة محمود', subject: 'العلوم', phone: '0600000003' },
]

export const students = [
  { id: 1, name: 'أحمد علي', classId: 1, guardianPhone: '0611111111' },
  { id: 2, name: 'مريم حسن', classId: 1, guardianPhone: '0622222222' },
  { id: 3, name: 'يوسف عمر', classId: 2, guardianPhone: '0633333333' },
  { id: 4, name: 'خديجة سيدي', classId: 3, guardianPhone: '0644444444' },
]
