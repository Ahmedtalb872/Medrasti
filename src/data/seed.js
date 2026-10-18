// بيانات تجريبية أولية. تُحفظ أي تعديلات في متصفح المستخدم (localStorage).
export function seed() {
  return {
    settings: {
      schoolName: 'مدرسة المستقبل الأهلية',
      address: 'شارع المعرفة، الحي الجامعي',
      phone: '0600000000',
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
      { id: 1, name: 'الأول أ', level: 'ابتدائي', teacherId: 1, fee: 36000 },
      { id: 2, name: 'الثاني ب', level: 'ابتدائي', teacherId: 2, fee: 36000 },
      { id: 3, name: 'الخامس أ', level: 'ابتدائي', teacherId: 5, fee: 40500 },
      { id: 4, name: 'الأول متوسط', level: 'متوسط', teacherId: 3, fee: 45000 },
      { id: 5, name: 'الثالث متوسط', level: 'متوسط', teacherId: 4, fee: 49500 },
    ],
    students: [
      { id: 1, name: 'أحمد علي', gender: 'ذكر', birthDate: '2019-03-14', classId: 1, guardianName: 'علي محمد', guardianPhone: '0611111111', discount: 0, photo: '', enrollDate: '2026-09-20' },
      { id: 2, name: 'مريم حسن', gender: 'أنثى', birthDate: '2019-07-02', classId: 1, guardianName: 'حسن إبراهيم', guardianPhone: '0622222222', discount: 10, photo: '', enrollDate: '2026-09-21' },
      { id: 3, name: 'يوسف عمر', gender: 'ذكر', birthDate: '2018-01-25', classId: 2, guardianName: 'عمر خالد', guardianPhone: '0633333333', discount: 0, photo: '', enrollDate: '2026-09-21' },
      { id: 4, name: 'خديجة سيدي', gender: 'أنثى', birthDate: '2013-11-09', classId: 4, guardianName: 'سيدي أحمد', guardianPhone: '0644444444', discount: 0, photo: '', enrollDate: '2026-09-22' },
      { id: 5, name: 'إبراهيم الأمين', gender: 'ذكر', birthDate: '2015-05-30', classId: 3, guardianName: 'الأمين محمود', guardianPhone: '0655555555', discount: 20, photo: '', enrollDate: '2026-09-22' },
      { id: 6, name: 'سارة عبد الرحمن', gender: 'أنثى', birthDate: '2011-08-17', classId: 5, guardianName: 'عبد الرحمن سعيد', guardianPhone: '0666666666', discount: 0, photo: '', enrollDate: '2026-09-23' },
      { id: 7, name: 'محمد الطالب', gender: 'ذكر', birthDate: '2012-02-11', classId: 5, guardianName: 'الطالب أحمد', guardianPhone: '0677777777', discount: 0, photo: '', enrollDate: '2026-09-23' },
      { id: 8, name: 'آمنة يحيى', gender: 'أنثى', birthDate: '2018-10-05', classId: 2, guardianName: 'يحيى عثمان', guardianPhone: '0688888888', discount: 0, photo: '', enrollDate: '2026-09-24' },
    ],
    payments: [
      { id: 1, studentId: 1, amount: 8000, date: '2026-09-20', method: 'نقدًا', note: 'رسوم أكتوبر ونوفمبر' },
      { id: 2, studentId: 2, amount: 3600, date: '2026-09-21', method: 'تحويل بنكي', note: '' },
      { id: 3, studentId: 3, amount: 36000, date: '2026-09-21', method: 'تحويل بنكي', note: 'دفع كامل السنة' },
      { id: 4, studentId: 4, amount: 5000, date: '2026-10-05', method: 'نقدًا', note: '' },
      { id: 5, studentId: 5, amount: 7200, date: '2026-09-25', method: 'بطاقة', note: '' },
      { id: 6, studentId: 6, amount: 11000, date: '2026-10-02', method: 'نقدًا', note: '' },
    ],
  }
}
