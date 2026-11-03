-- المصاريف: رواتب، إيجار، كهرباء... لكل مدرسة، وكل مصروف يتبع فرعًا.
-- التشغيل: بعد 0001 و 0002، انسخ هذا الملف في Supabase → SQL Editor ثم Run.

create table public.expenses (
  school_id uuid not null references public.schools (id) on delete cascade,
  id bigint not null,
  branch_id bigint,
  date date not null default current_date,
  category text not null default 'أخرى',
  amount numeric not null check (amount > 0),
  description text not null default '',
  method text not null default '',
  created_at timestamptz not null default now(),
  primary key (school_id, id),
  foreign key (school_id, branch_id) references public.branches (school_id, id) on delete restrict
);
create index on public.expenses (school_id, date);

create trigger number_expenses before insert on public.expenses
  for each row execute function public.assign_school_id_number();
create trigger default_branch_expenses before insert on public.expenses
  for each row execute function public.default_branch();

alter table public.expenses alter column branch_id set not null;
alter table public.expenses enable row level security;

create policy "branch data" on public.expenses for all to authenticated
  using (public.can_branch(school_id, branch_id)) with check (public.can_branch(school_id, branch_id));

-- نقل بيانات المتصفح: يشمل المصاريف (يُضاف بعد نقل باقي البيانات)
create or replace function public.import_school_expenses(sid uuid, data jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.has_role(sid, array['owner', 'admin']) then raise exception 'not allowed'; end if;
  insert into expenses (school_id, id, branch_id, date, category, amount, description, method)
  select sid, (x ->> 'id')::bigint,
         (select b.id from branches b where b.school_id = sid and b.id = (x ->> 'branchId')::bigint),
         (x ->> 'date')::date, coalesce(nullif(x ->> 'category', ''), 'أخرى'), (x ->> 'amount')::numeric,
         coalesce(x ->> 'description', ''), coalesce(x ->> 'method', '')
  from jsonb_array_elements(coalesce(data -> 'expenses', '[]')) x
  where (x ->> 'amount')::numeric > 0;
end $$;

revoke execute on function public.import_school_expenses(uuid, jsonb) from public, anon;
grant execute on function public.import_school_expenses(uuid, jsonb) to authenticated;
