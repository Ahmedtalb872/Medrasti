import { useStore } from '../store/AppStore.jsx'
import { invoice, receiptNo, studentNo } from '../utils/finance.js'
import { CARD_MM } from '../utils/cardSize.js'
import PaymentCard from './PaymentCard.jsx'
import { usePdf } from './PdfProvider.jsx'
import Receipt from './Receipt.jsx'
import StudentCard from './StudentCard.jsx'
import Invoice from './Invoice.jsx'

// أوامر تحميل المستندات (بطاقة الطالب، بطاقة الدفع، الإيصال) بصيغة PDF
export function useDocs() {
  const { exportPdf, busy } = usePdf()
  const { state } = useStore()
  return {
    busy,
    idCard: (s) =>
      exportPdf(<StudentCard student={s} />, `student-card-${studentNo(state, s)}.pdf`, { widthMm: CARD_MM.w }),
    paymentCard: (s) =>
      exportPdf(<PaymentCard student={s} />, `payment-card-${studentNo(state, s)}.pdf`, { widthMm: 210, minHeightMm: 297 }),
    receipt: (p) => exportPdf(<Receipt payment={p} />, `receipt-${receiptNo(p)}.pdf`, { widthMm: 148 }),
    invoice: (s) => exportPdf(<Invoice student={s} />, `${invoice(state, s).number}.pdf`, { widthMm: 148 }),
    allInvoices: (list) =>
      exportPdf(
        list.map((s) => <Invoice key={s.id} student={s} />),
        'invoices.pdf',
        { kind: 'pages', widthMm: 148 },
      ),
    allCards: (list) =>
      exportPdf(
        list.map((s) => <StudentCard key={s.id} student={s} />),
        'student-cards.pdf',
        { kind: 'cards' },
      ),
  }
}
