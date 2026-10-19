import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PdfContext = createContext(null)

// يرسم المستند المطلوب خارج الشاشة، ثم يحوّله إلى PDF ويحمّله أو يعيده كملف
export function PdfProvider({ children }) {
  const [job, setJob] = useState(null)
  const stageRef = useRef(null)
  const running = useRef(null)

  useEffect(() => {
    if (!job || running.current === job) return
    running.current = job
    const nodes = [...stageRef.current.children]
    // مكتبة PDF كبيرة الحجم، لذلك تُحمَّل فقط عند الحاجة
    import('../utils/pdf.js')
      .then(({ cardsToPdf, elementToPdf }) =>
        job.kind === 'cards' ? cardsToPdf(nodes) : elementToPdf(nodes[0], job.options),
      )
      .then((pdf) => {
        // asBlob: يعيد الملف بدل تحميله (لمشاركته على واتساب مثلًا)
        if (job.options.asBlob) return job.resolve(pdf.output('blob'))
        pdf.save(job.filename)
        job.resolve()
      })
      .catch((err) => {
        console.error(err)
        alert('تعذّر إنشاء ملف PDF، حاول مرة أخرى.')
        job.reject(err)
      })
      .finally(() => setJob(null))
  }, [job])

  const exportPdf = useCallback(
    (content, filename, options = {}) =>
      new Promise((resolve, reject) => {
        setJob({ content, filename, kind: options.kind, options, resolve, reject })
      }).catch(() => {}),
    [],
  )

  return (
    <PdfContext.Provider value={{ exportPdf, busy: !!job }}>
      {children}
      {job &&
        createPortal(
          <div className="pdf-stage" aria-hidden="true">
            <div ref={stageRef} className="pdf-stage__inner">
              {job.content}
            </div>
          </div>,
          document.body,
        )}
      {job && <div className="pdf-toast">جارٍ تجهيز ملف PDF…</div>}
    </PdfContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components
export function usePdf() {
  return useContext(PdfContext)
}
