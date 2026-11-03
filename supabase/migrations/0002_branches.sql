-- الفروع: مدرسة واحدة يمكن أن يكون لها أكثر من فرع.
-- كل قسم وطالب يتبع فرعًا، والمعلم يتبع فرعًا أو كل الفروع.
-- العضو الذي branch_id عنده فارغ يرى كل الفروع، وغيره يرى فرعه فقط.
-- التشغيل: بعد 0001_schools.sql، انسخ هذا الملف في Supabase → SQL Editor ثم Run.

create table public.branches (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  name text not null check (length(trim(name)) > 0),
  address text not null default '',
  phone text not null default '',
  primary key (school_id, id)
);

create trigger number_branches before insert on public.branches
  for each row execute function public.assign_school_id_number();

-- فرع رئيسي لكل مدرسة موجودة
insert into public.branches (school_id, name) select id, 'الفرع الرئيسي' from public.schools;

alter table public.school_members add column branch_id bigint;
alter table public.teachers add column branch_id bigint;
alter table public.classes add column branch_id bigint;
alter table public.students add column branch_id bigint;

update public.classes c set branch_id = (select min(b.id) from public.branches b where b.school_id = c.school_id);
update public.students s set branch_id = coalesce(
  (select c.branch_id from public.classes c where c.school_id = s.school_id and c.id = s.class_id),
  (select min(b.id) from public.branches b where b.school_id = s.school_id));

alter table public.classes alter column branch_id set not null;
alter table public.students alter column branch_id set not null;

-- لا يُحذف فرع فيه أقسام أو طلاب
alter table public.classes add foreign key (school_id, branch_id) references public.branches (school_id, id) on delete restrict;
alter table public.students add foreign key (school_id, branch_id) references public.branches (school_id, id) on delete restrict;
alter table public.teachers add foreign key (school_id, branch_id) references public.branches (school_id, id) on delete set null (branch_id);
alter table public.school_members add foreign key (school_id, branch_id) references public.branches (school_id, id) on delete set null (branch_id);

-- عند الإضافة بدون فرع: أول فرع في المدرسة (يفيد نقل البيانات القديمة)
create function public.default_branch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.branch_id is null then
    select min(id) into new.branch_id from branches where school_id = new.school_id;
  end if;
  return new;
end $$;

create trigger default_branch_classes before insert on public.classes for each row execute function public.default_branch();
create trigger default_branch_students before insert on public.students for each row execute function public.default_branch();

-- ---------- الحماية حسب الفرع ----------
create function public.can_branch(sid uuid, bid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from school_members
    where school_id = sid and user_id = auth.uid() and (branch_id is null or branch_id = bid)
  )
$$;

-- يرى كل الفروع (المالك، أو عضو غير مرتبط بفرع)
create function public.all_branches(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = sid and user_id = auth.uid() and branch_id is null)
$$;

alter table public.branches enable row level security;

create policy "members read branches" on public.branches for select to authenticated
  using (public.can_branch(school_id, id));
create policy "admins manage branches" on public.branches for all to authenticated
  using (public.all_branches(school_id) and public.has_role(school_id, array['owner', 'admin']))
  with check (public.all_branches(school_id) and public.has_role(school_id, array['owner', 'admin']));

drop policy "school data" on public.classes;
create policy "branch data" on public.classes for all to authenticated
  using (public.can_branch(school_id, branch_id)) with check (public.can_branch(school_id, branch_id));

drop policy "school data" on public.students;
create policy "branch data" on public.students for all to authenticated
  using (public.can_branch(school_id, branch_id)) with check (public.can_branch(school_id, branch_id));

drop policy "school data" on public.teachers;
create policy "branch data" on public.teachers for all to authenticated
  using (public.is_member(school_id) and (branch_id is null or public.can_branch(school_id, branch_id)))
  with check (public.is_member(school_id) and (branch_id is null or public.can_branch(school_id, branch_id)));

-- الدفعة تتبع فرع الطالب
drop policy "school data" on public.payments;
create policy "branch data" on public.payments for all to authenticated
  using (exists (select 1 from public.students s where s.school_id = payments.school_id and s.id = payments.student_id
                 and public.can_branch(s.school_id, s.branch_id)))
  with check (exists (select 1 from public.students s where s.school_id = payments.school_id and s.id = payments.student_id
                 and public.can_branch(s.school_id, s.branch_id)));

-- المدرسة الجديدة تبدأ بفرع رئيسي
create or replace function public.create_school(school_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into schools (name) values (trim(school_name)) returning id into sid;
  insert into school_members (school_id, user_id, role) values (sid, auth.uid(), 'owner');
  insert into branches (school_id, name) values (sid, 'الفرع الرئيسي');
  return sid;
end $$;

-- نقل بيانات المتصفح مع الفروع
create or replace function public.import_school_data(sid uuid, data jsonb) returns void
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

  insert into branches (school_id, id, name, address, phone)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'address', ''), coalesce(x ->> 'phone', '')
  from jsonb_array_elements(coalesce(data -> 'branches', '[]')) x
  on conflict (school_id, id) do update set name = excluded.name, address = excluded.address, phone = excluded.phone;

  insert into teachers (school_id, id, name, subject, phone, branch_id)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'subject', ''), coalesce(x ->> 'phone', ''),
         (select b.id from branches b where b.school_id = sid and b.id = (x ->> 'branchId')::bigint)
  from jsonb_array_elements(coalesce(data -> 'teachers', '[]')) x;

  insert into classes (school_id, id, name, level, teacher_id, fee, branch_id)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'level', ''),
         (select t.id from teachers t where t.school_id = sid and t.id = (x ->> 'teacherId')::bigint),
         coalesce((x ->> 'fee')::numeric, 0),
         (select b.id from branches b where b.school_id = sid and b.id = (x ->> 'branchId')::bigint)
  from jsonb_array_elements(coalesce(data -> 'classes', '[]')) x;

  insert into students (school_id, id, name, gender, birth_date, class_id, guardian_name, guardian_phone, discount, photo, enroll_date, branch_id)
  select sid, (x ->> 'id')::bigint, x ->> 'name', coalesce(x ->> 'gender', ''), nullif(x ->> 'birthDate', '')::date,
         (select c.id from classes c where c.school_id = sid and c.id = (x ->> 'classId')::bigint),
         coalesce(x ->> 'guardianName', ''), coalesce(x ->> 'guardianPhone', ''),
         coalesce((x ->> 'discount')::numeric, 0), coalesce(x ->> 'photo', ''),
         coalesce(nullif(x ->> 'enrollDate', '')::date, current_date),
         coalesce((select b.id from branches b where b.school_id = sid and b.id = (x ->> 'branchId')::bigint),
                  (select c.branch_id from classes c where c.school_id = sid and c.id = (x ->> 'classId')::bigint))
  from jsonb_array_elements(coalesce(data -> 'students', '[]')) x;

  insert into payments (school_id, id, student_id, amount, date, method, note)
  select sid, (x ->> 'id')::bigint, (x ->> 'studentId')::bigint, (x ->> 'amount')::numeric,
         (x ->> 'date')::date, coalesce(x ->> 'method', ''), coalesce(x ->> 'note', '')
  from jsonb_array_elements(coalesce(data -> 'payments', '[]')) x
  where exists (select 1 from students st where st.school_id = sid and st.id = (x ->> 'studentId')::bigint);

  insert into invoices_sent (school_id, number, sent_on)
  select sid, key, value::date from jsonb_each_text(coalesce(data -> 'invoicesSent', '{}'));
end $$;
