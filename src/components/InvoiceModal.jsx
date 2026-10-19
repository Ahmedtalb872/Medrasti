import { useEffect, useState } from 'react'
import { Download, MessageCircle, Send } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { invoice } from '../utils/finance.js'
import { money } from '../utils/format.js'
import { invoiceMessage, waLink, waNumber } from '../utils/whatsapp.js'
import Invoice from './Invoice.jsx'
import { usePdf } from './PdfProvider.jsx'
import { Modal } from './ui.jsx'

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// نافذة الفاتورة: تجهّز ملف PDF ثم ترسله لولي الأمر على واتساب
export default function InvoiceModal({ student, onClose }) {
  const { state, markInvoiceSent } = useStore()
  const { exportPdf } = usePdf()
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const inv = invoice(state, student)
  const text = invoiceMessage(state, student, inv)
  const number = waNumber(student.guardianPhone, state.settings.countryCode)
  const filename = `${inv.number}.pdf`

  useEffect(() => {
    let alive = true
    exportPdf(<Invoice student={student} />, filename, { widthMm: 148, asBlob: true }).then((blob) => {
      if (alive && blob) setFile(new File([blob], filename, { type: 'application/pdf' }))
    })
    return () => {
      alive = false
    }
    // تُجهَّز الفاتورة مرة واحدة عند فتح النافذة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canShareFile = !!file && !!navigator.canShare?.({ files: [file] })

  async function shareFile() {
    try {
      await navigator.share({ files: [file], text })
      markInvoiceSent(inv.number)
    } catch (err) {
      if (err?.name !== 'AbortError') setNote('تعذّرت المشاركة. استخدم زر تحميل الفاتورة ثم أرفقها في واتساب.')
    }
  }

  return (
    <Modal title={`فاتورة ${student.name}`} onClose={onClose}>
      <div className="invoice-box">
        <div className="invoice-box__total">
          <span>المبلغ المطلوب الآن</span>
          <b>{money(inv.dueNow, state.settings.currency)}</b>
        </div>
        <pre className="invoice-box__msg">{text}</pre>
      </div>

      <div className="invoice-actions">
        {canShareFile && (
          <button className="btn btn--whatsapp" onClick={shareFile}>
            <Send size={18} /> إرسال الفاتورة PDF (واتساب)
          </button>
        )}
        <a className="btn btn--whatsapp-ghost" href={waLink(number, text)} target="_blank" rel="noreferrer" onClick={() => markInvoiceSent(inv.number)}>
          <MessageCircle size={18} /> رسالة واتساب لولي الأمر {number && <span dir="ltr">+{number}</span>}
        </a>
        <button className="btn btn--ghost" onClick={() => saveBlob(file, filename)} disabled={!file}>
          <Download size={18} /> {file ? 'تحميل الفاتورة PDF' : 'جارٍ تجهيز الفاتورة…'}
        </button>
      </div>
      <p className="muted small">
        {canShareFile
          ? 'زر «إرسال الفاتورة PDF» يفتح قائمة المشاركة في هاتفك، اختر واتساب ثم ولي الأمر.'
          : 'على الهاتف يمكنك إرسال ملف الفاتورة مباشرة. هنا: حمّل الفاتورة ثم أرفقها في محادثة واتساب.'}
      </p>
      {note && <p className="text-danger small">{note}</p>}
    </Modal>
  )
}
