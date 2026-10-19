import { QRCodeSVG } from 'qrcode.react'
import Logo from './Logo.jsx'
import { useStore } from '../store/AppStore.jsx'
import { classOf, studentNo } from '../utils/finance.js'
import { Avatar } from './ui.jsx'

// بطاقة هوية الطالب بمقاس البطاقة القياسي (85.6 × 54 مم)
export default function StudentCard({ student }) {
  const { state } = useStore()
  const { settings } = state
  const no = studentNo(state, student)
  return (
    <div className="id-card">
      <div className="id-card__band">
        <Logo size={40} className="id-card__logo" />
        <div className="id-card__school">
          <strong>{settings.schoolName}</strong>
          <span>بطاقة طالب · <bdi dir="ltr">{settings.academicYear}</bdi></span>
        </div>
      </div>
      <div className="id-card__body">
        <Avatar student={student} size={86} square />
        <div className="id-card__info">
          <div className="id-card__name">{student.name}</div>
          <div className="id-card__row">
            <span>رقم الطالب</span>
            <b dir="ltr">{no}</b>
          </div>
          <div className="id-card__row">
            <span>القسم</span>
            <b>{classOf(state, student)?.name ?? '-'}</b>
          </div>
          <div className="id-card__row">
            <span>ولي الأمر</span>
            <b dir="ltr">{student.guardianPhone || '-'}</b>
          </div>
        </div>
        <div className="id-card__qr">
          <QRCodeSVG value={`MEDRASTI:${no}`} size={66} level="M" />
        </div>
      </div>
      <div className="id-card__foot">
        <span>{settings.address || 'للتواصل'}</span>
        <span dir="ltr">{settings.phone}</span>
      </div>
    </div>
  )
}
