import { createClient } from '@supabase/supabase-js'

// يعمل النظام سحابيًا عند وضع رابط ومفتاح Supabase في متغيرات البناء،
// وبدونهما يعمل محليًا في المتصفح كما كان.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// pkce: يعيد Supabase المستخدم برابط ?code= بدل # حتى لا يتعارض مع مسارات الصفحات
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null
export const cloud = Boolean(supabase)

export const LOCAL_KEY = 'medrasti:data:v2'

// صفحة العودة بعد تأكيد البريد أو استعادة كلمة المرور
export const redirectUrl = () => `${location.origin}${location.pathname}`
