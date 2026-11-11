// مشهد تعليمي متحرك لشاشة الدخول: كتاب تتقلب صفحاته، تطفو منه حروف وأرقام ونجوم،
// وفوقه قبعة تخرّج، وقلم يكتب سطرًا. كله SVG وحركات CSS بدون مكتبات.

const GLYPHS = [
  { t: 'أ', x: 196, d: 0 },
  { t: '١', x: 244, d: 1.1 },
  { t: 'ب', x: 290, d: 2.2 },
  { t: '+', x: 222, d: 3.3 },
  { t: 'π', x: 268, d: 4.4 },
  { t: 'ت', x: 178, d: 5.5 },
  { t: '√', x: 306, d: 6.6 },
  { t: '٢', x: 236, d: 7.7 },
]

const STARS = [
  [70, 70, 0], [410, 60, 0.8], [120, 190, 1.6], [430, 210, 2.4],
  [52, 300, 3.2], [400, 330, 0.4], [250, 30, 2], [330, 120, 2.8],
]

export default function LearningScene() {
  return (
    <div className="scene" aria-hidden="true">
      <svg viewBox="0 0 480 440" className="scene__svg">
        <defs>
          <radialGradient id="sceneGlow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pageL" x1="0" x2="1">
            <stop offset="0%" stopColor="#ede9fe" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="pageR" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
        </defs>

        <circle cx="240" cy="250" r="210" fill="url(#sceneGlow)" />

        {/* نجوم تتلألأ في الخلفية */}
        {STARS.map(([x, y, d], i) => (
          <path
            key={i}
            className="scene__star"
            style={{ animationDelay: `${d}s` }}
            transform={`translate(${x} ${y})`}
            d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
            fill="#fde68a"
          />
        ))}

        {/* مدار حول القبعة: المعرفة تدور */}
        <ellipse cx="240" cy="118" rx="104" ry="30" fill="none" stroke="#ddd6fe" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 7" />
        <circle className="scene__planet" r="5" fill="#fbbf24" />
        <circle className="scene__planet scene__planet--2" r="3.5" fill="#c4b5fd" />

        {/* قبعة التخرج */}
        <g className="scene__cap">
          <path d="M240 78 L318 108 L240 138 L162 108 Z" fill="#2e1065" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
          <path d="M196 124 L196 150 C196 162 284 162 284 150 L284 124 L240 141 Z" fill="#4c1d95" />
          <g className="scene__tassel">
            <path d="M240 108 L296 122 L296 150" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <circle cx="296" cy="156" r="6" fill="#fbbf24" />
          </g>
          <circle cx="240" cy="108" r="4.5" fill="#fbbf24" />
        </g>

        {/* حروف وأرقام تطفو من الكتاب */}
        {GLYPHS.map((g) => (
          <text
            key={g.t + g.x}
            x={g.x}
            y="318"
            className="scene__glyph"
            style={{ animationDelay: `${g.d}s` }}
            textAnchor="middle"
          >
            {g.t}
          </text>
        ))}

        {/* الكتاب المفتوح */}
        <g className="scene__book">
          <path d="M240 336 C206 318 160 314 112 322 L112 402 C160 394 206 398 240 414 Z" fill="url(#pageL)" />
          <path d="M240 336 C274 318 320 314 368 322 L368 402 C320 394 274 398 240 414 Z" fill="url(#pageR)" />
          <path d="M104 326 L104 408 C160 398 206 402 240 420 C274 402 320 398 376 408 L376 326" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* أسطر الكتابة */}
          {[344, 358, 372, 386].map((y, i) => (
            <path key={y} className="scene__line" style={{ animationDelay: `${i * 0.35}s` }} d={`M${132} ${y - 2 + i} Q${180} ${y - 8 + i} ${224} ${y + 4 + i}`} fill="none" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" />
          ))}
          {/* صفحة تتقلّب */}
          <path className="scene__page" d="M240 336 C274 318 320 314 368 322 L368 402 C320 394 274 398 240 414 Z" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1" />
          <line x1="240" y1="336" x2="240" y2="414" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* قلم يكتب */}
        <g className="scene__pencil-wrap">
          <path className="scene__ink" d="M268 368 q10 -10 20 0 t20 0 t20 0 t20 0" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
          <g className="scene__pencil">
            <g transform="rotate(-40 0 0)">
              <rect x="-6" y="-62" width="12" height="50" rx="2" fill="#fbbf24" />
              <rect x="-6" y="-70" width="12" height="10" rx="2" fill="#f472b6" />
              <rect x="-6" y="-61" width="12" height="4" fill="#a78bfa" />
              <path d="M-6 -12 L6 -12 L0 0 Z" fill="#fde68a" />
              <path d="M-2 -4 L2 -4 L0 0 Z" fill="#2e1065" />
            </g>
          </g>
        </g>
      </svg>
      <div className="scene__caption">
        <b>تعليم أذكى، إدارة أسهل</b>
        <span>الطلاب والرسوم والفواتير في مكان واحد</span>
      </div>
    </div>
  )
}
