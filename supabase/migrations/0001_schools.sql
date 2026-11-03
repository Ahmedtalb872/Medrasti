-- قاعدة بيانات واحدة لكل المدارس.
-- كل جدول فيه school_id، وسياسات الحماية (RLS) تمنع أي مستخدم من رؤية
-- بيانات مدرسة ليس عضوًا فيها.
-- التشغيل: انسخ هذا الملف كاملًا في Supabase → SQL Editor ثم Run.

-- ---------- المدارس والأعضاء ----------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text not null default '',
  phone text not null default '',
  country_code text not null default '222',
  currency text not null default 'MRU',
  academic_year text not null default '',
  start_year int not null default extract(year from now())::int,
  start_month int not null default 10 check (start_month between 1 and 12),
  installments int not null default 9 check (installments between 1 and 12),
  created_at timestamptz not null default now()
);

create table public.school_members (
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'accountant', 'secretary')),
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);
create index on public.school_members (user_id);

-- ترقيم مستقل لكل مدرسة: أول طالب في كل مدرسة رقمه 1
create table public.school_counters (
  school_id uuid not null references public.schools (id) on delete cascade,
  entity text not null,
  last bigint not null default 0,
  primary key (school_id, entity)
);

-- ---------- بيانات المدرسة ----------
create table public.teachers (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  name text not null,
  subject text not null default '',
  phone text not null default '',
  primary key (school_id, id)
);

create table public.classes (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  name text not null,
  level text not null default '',
  teacher_id bigint,
  fee numeric not null default 0 check (fee >= 0),
  primary key (school_id, id),
  foreign key (school_id, teacher_id) references public.teachers (school_id, id) on delete set null (teacher_id)
);

create table public.students (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  name text not null,
  gender text not null default '',
  birth_date date,
  class_id bigint,
  guardian_name text not null default '',
  guardian_phone text not null default '',
  discount numeric not null default 0 check (discount between 0 and 100),
  photo text not null default '',
  enroll_date date not null default current_date,
  primary key (school_id, id),
  foreign key (school_id, class_id) references public.classes (school_id, id) on delete set null (class_id)
);

create table public.payments (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  student_id bigint not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  method text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (school_id, id),
  foreign key (school_id, student_id) references public.students (school_id, id) on delete cascade
);
create index on public.payments (school_id, student_id);

create table public.invoices_sent (
  school_id uuid not null references public.schools (id) on delete cascade,
  number text not null,
  sent_on date not null default current_date,
  primary key (school_id, number)
);

-- ---------- الترقيم التلقائي ----------
create function public.assign_school_id_number() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into school_counters (school_id, entity) values (new.school_id, tg_table_name)
  on conflict do nothing;
  if new.id is null then
    update school_counters set last = last + 1
     where school_id = new.school_id and entity = tg_table_name
     returning last into new.id;
  else
    update school_counters set last = greatest(last, new.id)
     where school_id = new.school_id and entity = tg_table_name;
  end if;
  return new;
end $$;

create trigger number_teachers before insert on public.teachers for each row execute function public.assign_school_id_number();
create trigger number_classes before insert on public.classes for each row execute function public.assign_school_id_number();
create trigger number_students before insert on public.students for each row execute function public.assign_school_id_number();
create trigger number_payments before insert on public.payments for each row execute function public.assign_school_id_number();

-- ---------- الحماية ----------
create function public.is_member(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = sid and user_id = auth.uid())
$$;

create function public.has_role(sid uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = sid and user_id = auth.uid() and role = any (roles))
$$;

alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.school_counters enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.invoices_sent enable row level security;

create policy "members read their school" on public.schools
  for select to authenticated using (public.is_member(id));
create policy "owners edit their school" on public.schools
  for update to authenticated using (public.has_role(id, array['owner', 'admin'])) with check (public.has_role(id, array['owner', 'admin']));

create policy "members see their school members" on public.school_members
  for select to authenticated using (public.is_member(school_id));

-- school_counters بدون سياسات: لا يصل إليه إلا الترقيم التلقائي

create policy "school data" on public.teachers for all to authenticated
  using (public.is_member(school_id)) with check (public.is_member(school_id));
create policy "school data" on public.classes for all to authenticated
  using (public.is_member(school_id)) with check (public.is_member(school_id));
create policy "school data" on public.students for all to authenticated
  using (public.is_member(school_id)) with check (public.is_member(school_id));
create policy "school data" on public.payments for all to authenticated
  using (public.is_member(school_id)) with check (public.is_member(school_id));
create policy "school data" on public.invoices_sent for all to authenticated
  using (public.is_member(school_id)) with check (public.is_member(school_id));

-- ---------- إنشاء مدرسة جديدة ----------
-- ينشئ المدرسة ويجعل المستخدم الحالي مالكها
create function public.create_school(school_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into schools (name) values (trim(school_name)) returning id into sid;
  insert into school_members (school_id, user_id, role) values (sid, auth.uid(), 'owner');
  return sid;
end $$;

-- نقل بيانات محفوظة في المتصفح إلى مدرسة فارغة، في عملية واحدة (كلها أو لا شيء)
create function public.import_school_data(sid uuid, data jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare s jsonb := coalesce(data -> 'settings', '{}');
begin
  if not public.has_role(sid, array['owner', 'admin']) then raise exception 'not allowed'; end if;
  if exists (select 1 from students where school_id = sid) then raise exception 'school is not empty'; end if;

  update schools set
    name = coalesce(nullif(trim(s ->> 'schoolName'), ''), name),
    address = coalesce(s ->> 'address', address),
    phone = coalesce(s ->> 'phone', phone),
    country_code = coalesce(s ->> 'countryCode', country_code),
    currency = coalesce(s ->> 'currency', currency),
    academic_year = coalesce(s ->> 'academicYear', academic_year),
    start_year = coalesce((s ->> 'startYear')::int, start_year),
    start_month = coalesce((s ->> 'startMonth')::int, start_month),
    installments = coalesce((s ->> 'installments')::int, installments)
  where id = sid;

  insert into teachers (school_id, id, name, subject, phone)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'subject', ''), coalesce(x ->> 'phone', '')
  from jsonb_array_elements(coalesce(data -> 'teachers', '[]')) x;

  insert into classes (school_id, id, name, level, teacher_id, fee)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'level', ''),
         (select t.id from teachers t where t.school_id = sid and t.id = (x ->> 'teacherId')::bigint),
         coalesce((x ->> 'fee')::numeric, 0)
  from jsonb_array_elements(coalesce(data -> 'classes', '[]')) x;

  insert into students (school_id, id, name, gender, birth_date, class_id, guardian_name, guardian_phone, discount, photo, enroll_date)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'gender', ''), nullif(x ->> 'birthDate', '')::date,
         (select c.id from classes c where c.school_id = sid and c.id = (x ->> 'classId')::bigint),
         coalesce(x ->> 'guardianName', ''), coalesce(x ->> 'guardianPhone', ''),
         coalesce((x ->> 'discount')::numeric, 0), coalesce(x ->> 'photo', ''),
         coalesce(nullif(x ->> 'enrollDate', '')::date, current_date)
  from jsonb_array_elements(coalesce(data -> 'students', '[]')) x;

  insert into payments (school_id, id, student_id, amount, date, method, note)
  select sid, (x ->> 'id')::bigint, (x ->> 'studentId')::bigint, (x ->> 'amount')::numeric,
         (x ->> 'date')::date, coalesce(x ->> 'method', ''), coalesce(x ->> 'note', '')
  from jsonb_array_elements(coalesce(data -> 'payments', '[]')) x
  where exists (select 1 from students st where st.school_id = sid and st.id = (x ->> 'studentId')::bigint);

  insert into invoices_sent (school_id, number, sent_on)
  select sid, key, value::date from jsonb_each_text(coalesce(data -> 'invoicesSent', '{}'));
end $$;

revoke execute on function public.create_school(text) from public, anon;
revoke execute on function public.import_school_data(uuid, jsonb) from public, anon;
grant execute on function public.create_school(text) to authenticated;
grant execute on function public.import_school_data(uuid, jsonb) to authenticated;
