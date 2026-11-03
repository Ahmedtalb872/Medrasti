import { useCallback, useEffect, useState } from 'react'
import { LogIn, School, UserPlus } from 'lucide-react'
import { LOCAL_KEY, redirectUrl, supabase } from '../lib/supabase.js'
import * as db from '../lib/db.js'
import { CloudStore } from '../store/AppStore.jsx'
import { APP_LOGO, APP_NAME } from '../brand.js'

const AppLogo = ({ size }) => <img src={APP_LOGO} alt="" width={size} height={size} className="app-logo" />

const SCHOOL_KEY = 'medrasti:school'

const ERRORS = {
  'Invalid login credentials': 'البريد أو كلمة المرور غير صحيحة',
  'Email not confirmed': 'لم يتم تأكيد البريد بعد. افتح رسالة التأكيد في بريدك أولًا',
  'User already registered': 'هذا البريد مسجّل من قبل، سجّل الدخول بدلًا من ذلك',
}
const arabic = (err) => ERRORS[err?.message] ?? err?.message ?? 'حدث خطأ غير متوقع'

function readLocalData() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
    return data?.students?.length ? data : null
  } catch {
    return null
  }
}

function Screen({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <AppLogo size={56} />
          <b>{APP_NAME}</b>
        </div>
        <h1>{title}</h1>
        {subtitle && <p className="auth__sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

function Splash({ text = 'جارٍ التحميل…' }) {
  return (
    <div className="auth">
      <div className="auth__splash">
        <AppLogo size={72} />
        <span>{text}</span>
      </div>
    </div>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } })
        if (error) throw error
        if (!data.session) setInfo('أرسلنا رابط تأكيد إلى بريدك. افتحه ثم عُد لتسجيل الدخول.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() })
        if (error) throw error
        setInfo('إذا كان البريد مسجّلًا، ستصلك رسالة فيها رابط لتعيين كلمة مرور جديدة.')
      }
    } catch (err) {
      setError(arabic(err))
    } finally {
      setBusy(false)
    }
  }

  const titles = { login: 'تسجيل الدخول', signup: 'إنشاء حساب جديد', forgot: 'استعادة كلمة المرور' }
  const go = (m) => () => {
    setMode(m)
    setError('')
    setInfo('')
  }

  return (
    <Screen title={titles[mode]} subtitle={mode === 'signup' ? 'أنشئ حسابًا ثم أضف مدرستك' : 'نظام إدارة المدارس'}>
      {mode !== 'forgot' && (
        <div className="tabs auth__tabs">
          <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={go('login')}>دخول</button>
          <button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={go('signup')}>حساب جديد</button>
        </div>
      )}
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>البريد الإلكتروني</span>
          <input type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {mode !== 'forgot' && (
          <label className="field">
            <span>كلمة المرور</span>
            <input
              type="password"
              dir="ltr"
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        )}
        {error && <div className="auth__msg auth__msg--error">{error}</div>}
        {info && <div className="auth__msg">{info}</div>}
        <button className="btn btn--primary auth__submit" disabled={busy}>
          {mode === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />}
          {busy ? 'لحظة…' : mode === 'login' ? 'دخول' : mode === 'signup' ? 'إنشاء الحساب' : 'إرسال الرابط'}
        </button>
      </form>
      <div className="auth__links">
        {mode === 'login' && <button type="button" className="link" onClick={go('forgot')}>نسيت كلمة المرور؟</button>}
        {mode === 'forgot' && <button type="button" className="link" onClick={go('login')}>العودة لتسجيل الدخول</button>}
      </div>
    </Screen>
  )
}

function NewPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(arabic(error))
    else onDone()
  }

  return (
    <Screen title="كلمة مرور جديدة">
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>كلمة المرور الجديدة</span>
          <input type="password" dir="ltr" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="auth__msg auth__msg--error">{error}</div>}
        <button className="btn btn--primary auth__submit" disabled={busy}>{busy ? 'لحظة…' : 'حفظ كلمة المرور'}</button>
      </form>
    </Screen>
  )
}

function CreateSchool({ email, onCreated }) {
  const [localData] = useState(readLocalData)
  const [name, setName] = useState(localData?.settings?.schoolName ?? '')
  const [importLocal, setImportLocal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const id = await db.createSchool(name.trim())
      if (importLocal && localData) {
        // الاسم الذي كتبه المستخدم هو المعتمد
        await db.importSchool(id, { ...localData, settings: { ...localData.settings, schoolName: name.trim() } })
      }
      onCreated(id)
    } catch (err) {
      setError(arabic(err))
      setBusy(false)
    }
  }

  return (
    <Screen title="أضف مدرستك" subtitle={`مرحبًا ${email}، لا توجد مدرسة مرتبطة بحسابك بعد.`}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>اسم المدرسة</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {localData && (
          <label className="auth__check">
            <input type="checkbox" checked={importLocal} onChange={(e) => setImportLocal(e.target.checked)} />
            <span>
              نقل البيانات المحفوظة في هذا المتصفح إلى المدرسة
              <small>
                {localData.students.length} طلاب، {localData.payments?.length ?? 0} دفعات، {localData.classes?.length ?? 0} أقسام
              </small>
            </span>
          </label>
        )}
        {error && <div className="auth__msg auth__msg--error">{error}</div>}
        <button className="btn btn--primary auth__submit" disabled={busy}>
          <School size={18} /> {busy ? 'جارٍ الإنشاء…' : 'إنشاء المدرسة'}
        </button>
      </form>
      <div className="auth__links">
        <button type="button" className="link" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
      </div>
    </Screen>
  )
}

function SchoolLoader({ user, children }) {
  const [schools, setSchools] = useState(null)
  const [schoolId, setSchoolId] = useState(() => localStorage.getItem(SCHOOL_KEY))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let live = true
    db.mySchools(user.id)
      .then((list) => live && setSchools(list))
      .catch((err) => live && setError(arabic(err)))
    return () => {
      live = false
    }
  }, [user.id, reload])

  const school = schools?.find((s) => s.id === schoolId) ?? schools?.[0]

  useEffect(() => {
    if (!school) return
    let live = true
    db.loadSchool(school.id)
      .then((d) => live && setData({ id: school.id, ...d }))
      .catch((err) => live && setError(arabic(err)))
    return () => {
      live = false
    }
  }, [school])

  const switchSchool = useCallback((id) => {
    try {
      localStorage.setItem(SCHOOL_KEY, id)
    } catch {
      // التخزين غير متاح
    }
    setData(null)
    setSchoolId(id)
  }, [])

  if (error) {
    return (
      <Screen title="تعذّر تحميل البيانات" subtitle={error}>
        <button className="btn btn--primary auth__submit" onClick={() => location.reload()}>إعادة المحاولة</button>
        <div className="auth__links">
          <button type="button" className="link" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
        </div>
      </Screen>
    )
  }
  if (!schools) return <Splash />
  if (!school) {
    return (
      <CreateSchool
        email={user.email}
        onCreated={(id) => {
          switchSchool(id)
          setReload((n) => n + 1)
        }}
      />
    )
  }
  if (!data || data.id !== school.id) return <Splash text="جارٍ تحميل بيانات المدرسة…" />

  const account = {
    email: user.email,
    school,
    schools,
    switchSchool,
    signOut: () => supabase.auth.signOut(),
  }
  return (
    <CloudStore key={school.id} initial={data} account={account}>
      {children}
    </CloudStore>
  )
}

export default function CloudGate({ children }) {
  const [session, setSession] = useState(undefined)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  if (!session) return <AuthScreen />
  if (recovery) return <NewPassword onDone={() => setRecovery(false)} />
  return <SchoolLoader user={session.user}>{children}</SchoolLoader>
}
