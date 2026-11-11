-- طلبات تسجيل المدارس: المدرسة الجديدة لا تُنشأ مباشرة، بل ترسل طلبًا
-- يظهر في لوحة المنصة، وصاحب المنصة يقبله (فتُنشأ المدرسة) أو يرفضه.
-- التشغيل: بعد 0001 إلى 0003، انسخ هذا الملف في Supabase → SQL Editor ثم Run.
--
-- بعد التشغيل، اجعل حسابك مديرًا للمنصة (بعد إنشاء الحساب من الموقع):
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'بريدك@example.com';

-- ---------- مديرو المنصة ----------
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- بدون سياسات: لا يُقرأ ولا يُعدَّل إلا من قاعدة البيانات أو عبر الدالة أدناه

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;
grant execute on function public.is_platform_admin() to authenticated;

-- مدير المنصة يرى كل المدارس (للمتابعة فقط)
create policy "platform admins read schools" on public.schools
  for select to authenticated using (public.is_platform_admin());

-- ---------- الطلبات ----------
create table public.school_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text not null default '',
  school_name text not null check (length(trim(school_name)) > 0),
  contact_name text not null default '',
  phone text not null default '',
  city text not null default '',
  students_estimate int check (students_estimate is null or students_estimate >= 0),
  branches_count int not null default 1 check (branches_count >= 1),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text not null default '',
  school_id uuid references public.schools (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);
create index on public.school_requests (status, created_at desc);
create index on public.school_requests (user_id);
-- طلب واحد قيد المراجعة لكل حساب
create unique index school_requests_one_pending on public.school_requests (user_id) where status = 'pending';

alter table public.school_requests enable row level security;

-- صاحب الطلب يرسل طلبه ويرى طلباته فقط، ولا يستطيع تغيير حالته
create policy "users send their request" on public.school_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and school_id is null and reviewed_at is null);
create policy "users read their requests" on public.school_requests for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- البريد يُؤخذ من الحساب نفسه، لا مما يكتبه المستخدم
create function public.request_fill_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select email into new.email from auth.users where id = new.user_id;
  new.email := coalesce(new.email, '');
  return new;
end $$;
create trigger school_requests_email before insert on public.school_requests
  for each row execute function public.request_fill_email();

-- ---------- قرار المدير ----------
create function public.approve_school_request(request_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare r school_requests; sid uuid;
begin
  if not public.is_platform_admin() then raise exception 'not allowed'; end if;
  select * into r from school_requests where id = request_id for update;
  if r.id is null then raise exception 'request not found'; end if;
  if r.status <> 'pending' then raise exception 'request already reviewed'; end if;

  insert into schools (name, phone) values (trim(r.school_name), r.phone) returning id into sid;
  insert into school_members (school_id, user_id, role) values (sid, r.user_id, 'owner');
  insert into branches (school_id, name) values (sid, 'الفرع الرئيسي');

  update school_requests
     set status = 'approved', school_id = sid, reviewed_at = now(), reviewed_by = auth.uid()
   where id = request_id;
  return sid;
end $$;

create function public.reject_school_request(request_id uuid, reason text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'not allowed'; end if;
  update school_requests
     set status = 'rejected', reject_reason = coalesce(reason, ''), reviewed_at = now(), reviewed_by = auth.uid()
   where id = request_id and status = 'pending';
  if not found then raise exception 'request not found or already reviewed'; end if;
end $$;

revoke execute on function public.approve_school_request(uuid) from public, anon;
revoke execute on function public.reject_school_request(uuid, text) from public, anon;
grant execute on function public.approve_school_request(uuid) to authenticated;
grant execute on function public.reject_school_request(uuid, text) to authenticated;

-- إنشاء مدرسة مباشرة صار لمدير المنصة فقط؛ غيره يرسل طلبًا
create or replace function public.create_school(school_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not public.is_platform_admin() then raise exception 'send a school request instead'; end if;
  insert into schools (name) values (trim(school_name)) returning id into sid;
  insert into school_members (school_id, user_id, role) values (sid, auth.uid(), 'owner');
  insert into branches (school_id, name) values (sid, 'الفرع الرئيسي');
  return sid;
end $$;
