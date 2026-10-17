-- «كفو عليك»: إعداد قاعدة بيانات Supabase (شغّله مرة واحدة من SQL Editor)
-- يخزّن فقط: الإعدادات والأبناء (أسماء، أعمار، نقاط، شارات، شهادات). الصور لا تُرفع أبدًا.
-- كل حساب يرى ويعدّل بياناته فقط (Row Level Security).

-- ───────────── الجداول ─────────────
create table if not exists public.cloud_cfg (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data    jsonb  not null default '{}'::jsonb,
  mt      bigint not null default 0,
  constraint cloud_cfg_size check (octet_length(data::text) < 100000)
);

create table if not exists public.cloud_kids (
  user_id uuid   not null references auth.users(id) on delete cascade,
  id      text   not null check (char_length(id) between 1 and 40),
  data    jsonb  not null default '{}'::jsonb,
  mt      bigint not null default 0,
  deleted boolean not null default false,
  primary key (user_id, id),
  constraint cloud_kids_size check (octet_length(data::text) < 100000)
);

-- ───────────── الأمان: RLS ─────────────
alter table public.cloud_cfg  enable row level security;
alter table public.cloud_kids enable row level security;

drop policy if exists own_cfg  on public.cloud_cfg;
drop policy if exists own_kids on public.cloud_kids;

create policy own_cfg on public.cloud_cfg
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy own_kids on public.cloud_kids
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- لا صلاحية للزائر غير المسجّل إطلاقًا
revoke all on public.cloud_cfg  from anon;
revoke all on public.cloud_kids from anon;

-- ───────────── حماية من الإساءة ─────────────
-- أقصى عدد صفوف للحساب (يشمل الأبناء المحذوفين)
create or replace function public.cloud_kids_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (select count(*) from public.cloud_kids where user_id = new.user_id) >= 300 then
    raise exception 'too many rows';
  end if;
  return new;
end $$;

drop trigger if exists cloud_kids_limit on public.cloud_kids;
create trigger cloud_kids_limit before insert on public.cloud_kids
  for each row execute function public.cloud_kids_limit();

-- التعديل الأقدم لا يستبدل الأحدث (إذا جهاز قديم رفع متأخرًا)
create or replace function public.cloud_keep_newest() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.mt < old.mt then
    return null;  -- يتجاهل هذا التعديل
  end if;
  return new;
end $$;

drop trigger if exists cloud_kids_newest on public.cloud_kids;
create trigger cloud_kids_newest before update on public.cloud_kids
  for each row execute function public.cloud_keep_newest();
drop trigger if exists cloud_cfg_newest on public.cloud_cfg;
create trigger cloud_cfg_newest before update on public.cloud_cfg
  for each row execute function public.cloud_keep_newest();

-- ───────────── حذف الحساب وكل بياناته (يستدعيه الزر داخل اللعبة) ─────────────
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ───────────── التحديث الفوري بين الأجهزة (Realtime) ─────────────
do $$ begin
  alter publication supabase_realtime add table public.cloud_kids;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.cloud_cfg;
exception when duplicate_object then null; end $$;

-- ───────────── اختبار العزل (RLS) بحسابين — اختياري ─────────────
-- 1) سجّل حسابين تجريبيين من اللعبة وأضف ابنًا في كل واحد.
-- 2) من SQL Editor شغّل (بدّل المعرّف بمعرّف الحساب الأول من Auth > Users):
--      set local role authenticated;
--      set local request.jwt.claims = '{"sub":"<USER_A_ID>"}';
--      select user_id, id from public.cloud_kids;
--    يجب أن ترى أبناء الحساب الأول فقط. جرّب بمعرّف الحساب الثاني وتأكد أن النتيجة تختلف.
