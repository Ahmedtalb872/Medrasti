// بيانات تجريبية أولية. تُحفظ أي تعديلات في متصفح المستخدم (localStorage).
export function seed() {
  return {
    settings: {
      schoolName: 'Epsilon',
      address: '',
      phone: '20522064',
      countryCode: '222',
      currency: 'MRU',
      academicYear: '2026-2027',
      startYear: 2026,
      startMonth: 10,
      installments: 9,
    },
    teachers: [
      { id: 1, name: 'فاطمة أحمد', subject: 'اللغة العربية', phone: '0600000001' },
      { id: 2, name: 'محمد سالم', subject: 'الرياضيات', phone: '0600000002' },
      { id: 3, name: 'عائشة محمود', subject: 'العلوم', phone: '0600000003' },
      { id: 4, name: 'عبد الله يوسف', subject: 'اللغة الفرنسية', phone: '0600000004' },
      { id: 5, name: 'زينب الحسن', subject: 'التربية الإسلامية', phone: '0600000005' },
    ],
    classes: [
      { id: 1, name: 'MPIC', level: 'ثانوي', teacherId: 2, fee: 10000 },
      { id: 2, name: 'MPI', level: 'ثانوي', teacherId: 3, fee: 10000 },
      { id: 3, name: 'PC', level: 'ثانوي', teacherId: 4, fee: 10000 },
    ],
    students: [
      { id: 1, name: 'أحمد علي', gender: 'ذكر', birthDate: '2009-03-14', classId: 1, guardianName: 'علي محمد', guardianPhone: '22111111', discount: 0, photo: '', enrollDate: '2026-09-20' },
      { id: 2, name: 'مريم حسن', gender: 'أنثى', birthDate: '2009-07-02', classId: 1, guardianName: 'حسن إبراهيم', guardianPhone: '36222222', discount: 10, photo: '', enrollDate: '2026-09-21' },
      { id: 3, name: 'يوسف عمر', gender: 'ذكر', birthDate: '2008-01-25', classId: 2, guardianName: 'عمر خالد', guardianPhone: '46333333', discount: 0, photo: '', enrollDate: '2026-09-21' },
      { id: 4, name: 'خديجة سيدي', gender: 'أنثى', birthDate: '2008-11-09', classId: 2, guardianName: 'سيدي أحمد', guardianPhone: '22444444', discount: 0, photo: '', enrollDate: '2026-09-22' },
      { id: 5, name: 'إبراهيم الأمين', gender: 'ذكر', birthDate: '2009-05-30', classId: 3, guardianName: 'الأمين محمود', guardianPhone: '36555555', discount: 20, photo: '', enrollDate: '2026-09-22' },
      { id: 6, name: 'سارة عبد الرحمن', gender: 'أنثى', birthDate: '2008-08-17', classId: 3, guardianName: 'عبد الرحمن سعيد', guardianPhone: '46666666', discount: 0, photo: '', enrollDate: '2026-09-23' },
      { id: 7, name: 'محمد الطالب', gender: 'ذكر', birthDate: '2008-02-11', classId: 1, guardianName: 'الطالب أحمد', guardianPhone: '22777777', discount: 0, photo: '', enrollDate: '2026-09-23' },
      { id: 8, name: 'آمنة يحيى', gender: 'أنثى', birthDate: '2009-10-05', classId: 3, guardianName: 'يحيى عثمان', guardianPhone: '36888888', discount: 0, photo: '', enrollDate: '2026-09-24' },
    ],
    // الفواتير التي أُرسلت على واتساب: { رقم الفاتورة: تاريخ الإرسال }
    invoicesSent: {},
    expenses: [
      { id: 1, date: '2026-10-01', category: 'إيجار', amount: 25000, description: 'إيجار المبنى لشهر أكتوبر', method: 'تحويل بنكي' },
      { id: 2, date: '2026-10-05', category: 'كهرباء وماء', amount: 4500, description: 'فاتورة الكهرباء', method: 'نقدًا' },
      { id: 3, date: '2026-10-08', category: 'أدوات ومستلزمات', amount: 6000, description: 'طباشير وأوراق وحبر الطابعة', method: 'نقدًا' },
      { id: 4, date: '2026-10-30', category: 'رواتب', amount: 60000, description: 'رواتب المعلمين لشهر أكتوبر', method: 'تحويل بنكي' },
      { id: 5, date: '2026-11-01', category: 'إيجار', amount: 25000, description: 'إيجار المبنى لشهر نوفمبر', method: 'تحويل بنكي' },
      { id: 6, date: '2026-11-02', category: 'إنترنت وهاتف', amount: 2500, description: 'اشتراك الإنترنت', method: 'نقدًا' },
    ],
    payments: [
      { id: 1, studentId: 1, amount: 20000, date: '2026-09-20', method: 'نقدًا', note: 'شهرا أكتوبر ونوفمبر' },
      { id: 2, studentId: 2, amount: 9000, date: '2026-09-21', method: 'تحويل بنكي', note: '' },
      { id: 3, studentId: 3, amount: 90000, date: '2026-09-21', method: 'تحويل بنكي', note: 'دفع كامل السنة' },
      { id: 4, studentId: 4, amount: 10000, date: '2026-10-05', method: 'نقدًا', note: '' },
      { id: 5, studentId: 5, amount: 8000, date: '2026-09-25', method: 'بطاقة', note: '' },
      { id: 6, studentId: 6, amount: 10000, date: '2026-10-02', method: 'نقدًا', note: '' },
    ],
  }
}
