import { getFontEmbedCSS, toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

import { CARD_MM } from './cardSize.js'

async function capture(el, fontEmbedCSS) {
  const opts = { pixelRatio: 3, backgroundColor: '#ffffff', fontEmbedCSS }
  // الالتقاط الأول يحمّل الخطوط والصور، والثاني يعطي نتيجة مكتملة
  await toPng(el, opts)
  return toPng(el, opts)
}

async function prepare(el) {
  await document.fonts.ready
  return getFontEmbedCSS(el)
}

// يحوّل عنصرًا واحدًا إلى ملف PDF بعرض محدد بالمليمتر، والارتفاع حسب المحتوى
export async function elementToPdf(el, filename, { widthMm = 210, minHeightMm = 0 } = {}) {
  const font = await prepare(el)
  const img = await capture(el, font)
  const ratio = el.offsetHeight / el.offsetWidth
  const heightMm = widthMm * ratio
  const pageH = Math.max(heightMm, minHeightMm)
  const pdf = new jsPDF({
    unit: 'mm',
    format: [widthMm, pageH],
    orientation: widthMm > pageH ? 'landscape' : 'portrait',
  })
  pdf.addImage(img, 'PNG', 0, 0, widthMm, heightMm)
  pdf.save(filename)
}

// يضع عدة بطاقات على صفحات A4 (8 بطاقات في الصفحة) مع خطوط قص خفيفة
export async function cardsToPdf(els, filename) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const cols = 2
  const rows = 4
  const gapX = 10
  const gapY = 10
  const left = (210 - cols * CARD_MM.w - gapX) / 2
  const top = (297 - rows * CARD_MM.h - (rows - 1) * gapY) / 2
  const font = els.length ? await prepare(els[0]) : ''
  for (let i = 0; i < els.length; i++) {
    const slot = i % (cols * rows)
    if (i > 0 && slot === 0) pdf.addPage()
    // في الاتجاه من اليمين لليسار نبدأ بالعمود الأيمن
    const col = cols - 1 - (slot % cols)
    const row = Math.floor(slot / cols)
    const x = left + col * (CARD_MM.w + gapX)
    const y = top + row * (CARD_MM.h + gapY)
    const img = await capture(els[i], font)
    pdf.setDrawColor(200)
    pdf.setLineWidth(0.1)
    pdf.roundedRect(x - 0.3, y - 0.3, CARD_MM.w + 0.6, CARD_MM.h + 0.6, 3, 3)
    pdf.addImage(img, 'PNG', x, y, CARD_MM.w, CARD_MM.h)
  }
  pdf.save(filename)
}
