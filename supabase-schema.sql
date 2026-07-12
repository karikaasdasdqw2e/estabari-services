-- قاعدة بيانات مجمع خدمات إصطباري
-- شغّل الملف كاملًا داخل Supabase SQL Editor.
-- الملف آمن لإعادة التشغيل ويضيف لوحة الإدارة والتقييمات وسياسات التحكم.

create extension if not exists pgcrypto;

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  phone text not null check (phone ~ '^(\+20|0)?1[0125][0-9]{8}$'),
  whatsapp text check (whatsapp is null or whatsapp = '' or whatsapp ~ '^(\+20|0)?1[0125][0-9]{8}$'),
  category text not null check (category in (
    'carpentry','plumbing','electricity','painting','metal','construction',
    'appliances','phones','transport','food','cafes','doctors','pharmacies',
    'education','events','beauty','clothing','agriculture','legal','shops',
    'cleaning','security','religious','other'
  )),
  service_name text not null check (char_length(service_name) between 2 and 80),
  description text check (description is null or char_length(description) <= 300),
  area text not null check (char_length(area) between 2 and 80),
  address text check (address is null or char_length(address) <= 160),
  opening_hours text check (opening_hours is null or char_length(opening_hours) <= 100),
  social_url text check (social_url is null or social_url = '' or social_url ~ '^https?://'),
  maps_url text check (maps_url is null or maps_url = '' or maps_url ~ '^https?://'),
  latitude numeric(10,7) check (latitude is null or latitude between -90 and 90),
  longitude numeric(10,7) check (longitude is null or longitude between -180 and 180),
  delivery boolean not null default false,
  emergency boolean not null default false,
  verified boolean not null default false,
  featured boolean not null default false,
  status text not null default 'approved' check (status in ('pending','approved','rejected','suspended')),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers alter column status set default 'approved';
update public.providers set status = 'approved' where status = 'pending';

create index if not exists providers_status_idx on public.providers(status);
create index if not exists providers_category_idx on public.providers(category);
create index if not exists providers_created_at_idx on public.providers(created_at desc);
create index if not exists providers_featured_idx on public.providers(featured desc) where status = 'approved';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

-- ============================================================
-- حساب الإدارة
-- اسم المستخدم داخل لوحة الموقع: karika
-- البريد الداخلي المستخدم في Supabase Auth: karika@estabari.local
-- كلمة المرور لا توضع داخل GitHub أو SQL.
-- أنشئ المستخدم يدويًا من Authentication > Users واجعله Confirmed.
-- ============================================================

create or replace function public.is_estabari_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'karika@estabari.local';
$$;

revoke all on function public.is_estabari_admin() from public;
grant execute on function public.is_estabari_admin() to anon, authenticated;

-- النشر التلقائي للزوار، مع السماح للإدارة بالتحكم الكامل في الحالة والخصائص.
create or replace function public.prepare_public_provider()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_estabari_admin() then
    return new;
  end if;

  new.status = 'approved';
  new.verified = false;
  new.featured = false;
  new.rejection_reason = null;
  return new;
end;
$$;

drop trigger if exists providers_prepare_public_insert on public.providers;
create trigger providers_prepare_public_insert
before insert on public.providers
for each row execute function public.prepare_public_provider();

alter table public.providers enable row level security;

drop policy if exists "Public can view approved providers" on public.providers;
create policy "Public can view approved providers"
on public.providers
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Public can submit pending providers" on public.providers;
drop policy if exists "Public can submit approved providers" on public.providers;
create policy "Public can submit approved providers"
on public.providers
for insert
to anon, authenticated
with check (
  status = 'approved'
  and verified = false
  and featured = false
  and rejection_reason is null
);

-- الإدارة وحدها تستطيع قراءة كل الحالات وإضافة وتعديل وحذف الخدمات.
drop policy if exists "Estabari admin can manage all providers" on public.providers;
create policy "Estabari admin can manage all providers"
on public.providers
for all
to authenticated
using (public.is_estabari_admin())
with check (public.is_estabari_admin());

grant select, insert on public.providers to anon, authenticated;
grant update, delete on public.providers to authenticated;

-- ============================================================
-- عداد الزوار الحقيقي
-- يحسب كل متصفح مرة واحدة باستخدام UUID عشوائي محفوظ محليًا.
-- لا يتم تخزين الاسم أو الهاتف أو عنوان IP أو الموقع الجغرافي.
-- ============================================================

create table if not exists public.site_visitors (
  visitor_id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visit_count bigint not null default 1 check (visit_count > 0)
);

create index if not exists site_visitors_last_seen_idx
on public.site_visitors(last_seen desc);

alter table public.site_visitors enable row level security;

drop policy if exists "Public can read visitors" on public.site_visitors;
drop policy if exists "Public can insert visitors" on public.site_visitors;
drop policy if exists "Public can update visitors" on public.site_visitors;

drop policy if exists "Estabari admin can view visitor statistics" on public.site_visitors;
create policy "Estabari admin can view visitor statistics"
on public.site_visitors
for select
to authenticated
using (public.is_estabari_admin());

create or replace function public.track_site_visit(p_visitor_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total_unique_visitors bigint;
begin
  insert into public.site_visitors (visitor_id, first_seen, last_seen, visit_count)
  values (p_visitor_id, now(), now(), 1)
  on conflict (visitor_id)
  do update set
    last_seen = now(),
    visit_count = public.site_visitors.visit_count + 1;

  select count(*) into total_unique_visitors
  from public.site_visitors;

  return total_unique_visitors;
end;
$$;

revoke all on function public.track_site_visit(uuid) from public;
grant execute on function public.track_site_visit(uuid) to anon, authenticated;

-- ============================================================
-- تقييم مقدمي الخدمات بالنجوم
-- كل متصفح يحصل على UUID عشوائي، ويملك تقييمًا واحدًا لكل خدمة.
-- إعادة التقييم تعدّل التقييم السابق بدل إنشاء تقييم مكرر.
-- لا يتم إظهار معرفات المصوتين للعامة.
-- ============================================================

create table if not exists public.provider_ratings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  voter_id uuid not null,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, voter_id)
);

create index if not exists provider_ratings_provider_idx
on public.provider_ratings(provider_id);

create index if not exists provider_ratings_updated_at_idx
on public.provider_ratings(updated_at desc);

drop trigger if exists provider_ratings_set_updated_at on public.provider_ratings;
create trigger provider_ratings_set_updated_at
before update on public.provider_ratings
for each row execute function public.set_updated_at();

alter table public.provider_ratings enable row level security;

-- لا توجد قراءة أو كتابة مباشرة للعامة؛ الاستخدام يتم عبر دوال محمية فقط.
drop policy if exists "Public can read provider ratings" on public.provider_ratings;
drop policy if exists "Public can insert provider ratings" on public.provider_ratings;
drop policy if exists "Public can update provider ratings" on public.provider_ratings;

drop policy if exists "Estabari admin can manage provider ratings" on public.provider_ratings;
create policy "Estabari admin can manage provider ratings"
on public.provider_ratings
for all
to authenticated
using (public.is_estabari_admin())
with check (public.is_estabari_admin());

grant select, insert, update, delete on public.provider_ratings to authenticated;

create or replace function public.submit_provider_rating(
  p_provider_id uuid,
  p_voter_id uuid,
  p_stars smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_is_public boolean;
  result jsonb;
begin
  if p_provider_id is null or p_voter_id is null then
    raise exception 'بيانات التقييم غير مكتملة';
  end if;

  if p_stars < 1 or p_stars > 5 then
    raise exception 'التقييم يجب أن يكون من نجمة إلى 5 نجوم';
  end if;

  select exists(
    select 1
    from public.providers
    where id = p_provider_id and status = 'approved'
  ) into provider_is_public;

  if not provider_is_public then
    raise exception 'الخدمة غير متاحة للتقييم';
  end if;

  insert into public.provider_ratings (provider_id, voter_id, stars)
  values (p_provider_id, p_voter_id, p_stars)
  on conflict (provider_id, voter_id)
  do update set
    stars = excluded.stars,
    updated_at = now();

  select jsonb_build_object(
    'provider_id', p_provider_id,
    'average_rating', round(avg(stars)::numeric, 2),
    'ratings_count', count(*)
  ) into result
  from public.provider_ratings
  where provider_id = p_provider_id;

  return result;
end;
$$;

revoke all on function public.submit_provider_rating(uuid, uuid, smallint) from public;
grant execute on function public.submit_provider_rating(uuid, uuid, smallint) to anon, authenticated;

create or replace function public.get_provider_rating_summaries()
returns table (
  provider_id uuid,
  average_rating numeric,
  ratings_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ratings.provider_id,
    round(avg(ratings.stars)::numeric, 2) as average_rating,
    count(*)::bigint as ratings_count
  from public.provider_ratings as ratings
  inner join public.providers as providers
    on providers.id = ratings.provider_id
  where providers.status = 'approved'
  group by ratings.provider_id;
$$;

revoke all on function public.get_provider_rating_summaries() from public;
grant execute on function public.get_provider_rating_summaries() to anon, authenticated;

-- إحصائيات لوحة التحكم، لا تعمل إلا لحساب الإدارة.
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_estabari_admin() then
    raise exception 'غير مصرح لك بقراءة إحصائيات الإدارة';
  end if;

  select jsonb_build_object(
    'total_providers', (select count(*) from public.providers),
    'approved_providers', (select count(*) from public.providers where status = 'approved'),
    'suspended_providers', (select count(*) from public.providers where status = 'suspended'),
    'pending_providers', (select count(*) from public.providers where status = 'pending'),
    'rejected_providers', (select count(*) from public.providers where status = 'rejected'),
    'featured_providers', (select count(*) from public.providers where featured = true),
    'verified_providers', (select count(*) from public.providers where verified = true),
    'unique_visitors', (select count(*) from public.site_visitors),
    'total_visits', (select coalesce(sum(visit_count), 0) from public.site_visitors),
    'total_ratings', (select count(*) from public.provider_ratings),
    'rated_providers', (select count(distinct provider_id) from public.provider_ratings)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

comment on table public.providers is 'مقدمو الخدمات المسجلون في مجمع خدمات إصطباري';
comment on column public.providers.status is 'approved للنشر، pending للمراجعة، rejected للمرفوض، suspended للموقوف';
comment on table public.site_visitors is 'عداد المتصفحات الفريدة وزياراتها بدون بيانات شخصية';
comment on table public.provider_ratings is 'تقييم نجوم واحد لكل متصفح لكل مقدم خدمة';
comment on function public.is_estabari_admin() is 'يتحقق أن المستخدم الحالي هو حساب إدارة مجمع خدمات إصطباري';
comment on function public.admin_dashboard_stats() is 'إحصائيات محمية للوحة الإدارة';
comment on function public.submit_provider_rating(uuid, uuid, smallint) is 'يحفظ أو يعدل تقييم متصفح واحد لخدمة محددة';
comment on function public.get_provider_rating_summaries() is 'يعرض متوسط وعدد تقييمات الخدمات المنشورة بدون كشف معرفات المصوتين';
