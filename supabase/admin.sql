-- لوحة التحكم الخاصة بالمالك (admin.html): أرقام مجمّعة فقط، بلا أسماء ولا صور ولا إيميلات.
-- تعمل فقط لحسابات مسجّلة في جدول public.admins، ولها كلمة سر خاصة (مخزّنة كـ bcrypt) مع قفل 15 دقيقة بعد 5 محاولات خاطئة.
-- (هذا الملف نسخة من الدوال المطبّقة فعليًا على المشروع. شغّله فقط لو أنشأت مشروعًا جديدًا بعد schema.sql.)
--
-- لإضافة مدير (بدّل boshaf3 باسم المستخدم):
--   insert into public.admins(user_id) select id from auth.users where lower(email) = 'boshaf3@kafo.invalid';

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pass_hash text,
  fails int not null default 0,
  locked_until timestamptz
);
alter table public.admins enable row level security;     -- بلا سياسات: لا أحد يقرأها أو يكتب فيها عبر الـ API
revoke all on public.admins from anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$function$;

CREATE OR REPLACE FUNCTION public.admin_gate()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a record;
begin
  select * into a from public.admins where user_id = (select auth.uid());
  if not found then return jsonb_build_object('admin', false); end if;
  return jsonb_build_object('admin', true, 'has_password', a.pass_hash is not null,
    'locked_seconds', greatest(0, coalesce(extract(epoch from (a.locked_until - now()))::int, 0)));
end $function$;

CREATE OR REPLACE FUNCTION public.set_admin_password(p_new text, p_old text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a record;
begin
  select * into a from public.admins where user_id = (select auth.uid()) for update;
  if not found then raise exception 'forbidden'; end if;
  if char_length(coalesce(p_new,'')) < 6 then return jsonb_build_object('error','too_short'); end if;
  if a.locked_until is not null and a.locked_until > now() then return jsonb_build_object('error','locked'); end if;
  if a.pass_hash is not null and (p_old is null or extensions.crypt(p_old, a.pass_hash) <> a.pass_hash) then
    return jsonb_build_object('error','bad_password');
  end if;
  update public.admins set pass_hash = extensions.crypt(p_new, extensions.gen_salt('bf')), fails = 0, locked_until = null where user_id = a.user_id;
  return jsonb_build_object('ok', true);
end $function$;

CREATE OR REPLACE FUNCTION public.admin_stats(p_pass text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a record; r jsonb;
begin
  select * into a from public.admins where user_id = (select auth.uid()) for update;
  if not found then raise exception 'forbidden'; end if;
  if a.pass_hash is null then return jsonb_build_object('error','no_password'); end if;
  if a.locked_until is not null and a.locked_until > now() then
    return jsonb_build_object('error','locked','locked_seconds', extract(epoch from (a.locked_until - now()))::int);
  end if;
  if p_pass is null or extensions.crypt(p_pass, a.pass_hash) <> a.pass_hash then
    if a.fails + 1 >= 5 then
      update public.admins set fails = 0, locked_until = now() + interval '15 minutes' where user_id = a.user_id;
    else
      update public.admins set fails = a.fails + 1 where user_id = a.user_id;
    end if;
    return jsonb_build_object('error','bad_password');
  end if;
  update public.admins set fails = 0, locked_until = null where user_id = a.user_id;

  with k as (select user_id, data, mt from public.cloud_kids where not deleted),
       fam as (select user_id, count(*) n, max(mt) last_mt from k group by user_id),
       dd as (select k.user_id, e.key d, (e.value->>0)::numeric p, (e.value->>1)::numeric n, (e.value->>2)::numeric s
              from k, jsonb_each(case when jsonb_typeof(k.data->'days')='object' then k.data->'days' else '{}'::jsonb end) e
              where e.key >= to_char(now() - interval '60 days', 'YYYY-MM-DD') and jsonb_typeof(e.value)='array')
  select jsonb_build_object(
    'generated_at', now(),
    'today', to_char(now() at time zone 'Asia/Bahrain', 'YYYY-MM-DD'),
    'accounts', (select count(*) from auth.users),
    'accounts_username', (select count(*) from auth.users where email like '%@kafo.invalid'),
    'accounts_email', (select count(*) from auth.users where email not like '%@kafo.invalid'),
    'accounts_by_day', (select coalesce(jsonb_object_agg(d, c), '{}'::jsonb) from (
        select to_char(created_at at time zone 'Asia/Bahrain', 'YYYY-MM-DD') d, count(*) c
        from auth.users where created_at > now() - interval '70 days' group by 1) x),
    'families_with_kids', (select count(*) from fam),
    'active_1d',  (select count(*) from fam where to_timestamp(last_mt/1000.0) > now() - interval '1 day'),
    'active_7d',  (select count(*) from fam where to_timestamp(last_mt/1000.0) > now() - interval '7 days'),
    'active_30d', (select count(*) from fam where to_timestamp(last_mt/1000.0) > now() - interval '30 days'),
    'kids', (select count(*) from k),
    'girls', (select count(*) from k where data->'av'->>'g' = 'f'),
    'boys',  (select count(*) from k where coalesce(data->'av'->>'g','m') <> 'f'),
    'ages', (select coalesce(jsonb_object_agg(a2, c), '{}'::jsonb) from (
        select data->>'age' a2, count(*) c from k where coalesce(data->>'age','') <> '' group by 1) x),
    'kids_per_family', (select coalesce(jsonb_object_agg(n, c), '{}'::jsonb) from (
        select least(n, 5)::text n, count(*) c from fam group by 1) x),
    'tiers', (select coalesce(jsonb_object_agg(t, c), '{}'::jsonb) from (
        select coalesce(data->>'tier','0') t, count(*) c from k group by 1) x),
    'points_total', (select coalesce(sum((data->>'pts')::numeric), 0) from k),
    'behaviors_pos', (select coalesce(sum((data->'cnt'->>'pos')::numeric), 0) from k),
    'behaviors_neg', (select coalesce(sum((data->'cnt'->>'neg')::numeric), 0) from k),
    'maps_selected', (select coalesce(jsonb_object_agg(m, c), '{}'::jsonb) from (
        select coalesce(data->>'mapId','peak') m, count(*) c from public.cloud_cfg group by 1) x),
    'certs_total', (select coalesce(sum(jsonb_array_length(case when jsonb_typeof(data->'certs')='array' then data->'certs' else '[]'::jsonb end)), 0) from k),
    'certs_by_map', (select coalesce(jsonb_object_agg(m, c), '{}'::jsonb) from (
        select cert->>'mapId' m, count(*) c
        from k, jsonb_array_elements(case when jsonb_typeof(k.data->'certs')='array' then k.data->'certs' else '[]'::jsonb end) cert
        group by 1) x),
    'badges', (select coalesce(jsonb_object_agg(b, c), '{}'::jsonb) from (
        select b, count(*) c
        from k, jsonb_object_keys(case when jsonb_typeof(k.data->'badges')='object' then k.data->'badges' else '{}'::jsonb end) b
        group by 1) x),
    'days', (select coalesce(jsonb_object_agg(d, jsonb_build_object('pos', p, 'neg', n, 'pts', s)), '{}'::jsonb) from (
        select d, sum(p) p, sum(n) n, sum(s) s from dd group by d) x),
    'dau', (select coalesce(jsonb_object_agg(d, c), '{}'::jsonb) from (
        select d, count(distinct user_id) c from dd where p + n > 0 group by d) x)
  ) into r;
  return r;
end $function$;

revoke all on function public.is_admin(), public.admin_gate(), public.set_admin_password(text, text), public.admin_stats(text) from public, anon;
grant execute on function public.is_admin(), public.admin_gate(), public.set_admin_password(text, text), public.admin_stats(text) to authenticated;
