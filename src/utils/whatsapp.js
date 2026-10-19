import { classOf } from './finance.js'
import { money } from './format.js'

// يحوّل رقم ولي الأمر إلى الصيغة الدولية المطلوبة لروابط واتساب
export function waNumber(phone, countryCode) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (!digits) return ''
  if (countryCode && digits.length <= 8) digits = `${countryCode}${digits}`
  return digits
}

export function invoiceMessage(state, student, inv) {
  const { currency, schoolName, phone } = state.settings
  const lines = [
    'السلام عليكم ورحمة الله',
    `ولي أمر الطالب(ة): *${student.name}*`,
    `القسم: ${classOf(state, student)?.name ?? '-'}`,
    '',
    `فاتورة رقم: ${inv.number}`,
  ]
  if (inv.dueNow > 0) {
    lines.push(`المبلغ المطلوب الآن: *${money(inv.dueNow, currency)}*`)
    lines.push(`عن شهر: ${inv.lines.map((l) => l.label).join('، ')}`)
  } else if (inv.next) {
    lines.push('لا توجد أقساط مستحقة حاليًا ✅')
    lines.push(`القسط القادم: ${inv.next.label} — ${money(inv.next.amount - inv.next.paid, currency)}`)
  } else {
    lines.push('تم سداد كامل الرسوم ✅ شكرًا لكم')
  }
  lines.push(
    '',
    `المدفوع حتى الآن: ${money(inv.paid, currency)}`,
    `المتبقي من السنة: ${money(inv.remaining, currency)}`,
    '',
    `${schoolName} — للتواصل: ${phone}`,
  )
  return lines.join('\n')
}

export function waLink(number, text) {
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
