const numberFmt = new Intl.NumberFormat('en-US')
const dateFmt = new Intl.DateTimeFormat('ar', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  numberingSystem: 'latn',
})

export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export const PAYMENT_METHODS = ['نقدًا', 'تحويل بنكي', 'بطاقة', 'شيك']

export function money(value, currency) {
  return `${numberFmt.format(Math.round(value || 0))} ${currency}`
}

export function parseDate(iso) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
}

export function fmtDate(iso) {
  return iso ? dateFmt.format(parseDate(iso)) : '-'
}

export function toIso(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayIso() {
  return toIso(new Date())
}

export function initials(name = '') {
  // نتجاوز «ال» التعريف حتى يكون الحرف الأول معبّرًا (الأمين ← أ)
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w.startsWith('ال') && w.length > 3 ? w[2] : w[0]))
    .join(' ')
}

// تصغير الصورة المرفوعة حتى لا تشغل مساحة كبيرة في التخزين
export function resizeImage(file, size = 240) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const side = Math.min(img.width, img.height)
        canvas
          .getContext('2d')
          .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
