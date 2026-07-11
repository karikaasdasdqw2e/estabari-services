-- قاعدة بيانات مجمع خدمات إصطباري
-- شغّل الملف كاملًا داخل Supabase SQL Editor.
-- الملف آمن لإعادة التشغيل ويحدّث القاعدة القديمة إلى النشر التلقائي.

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
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- لو الجدول كان متعمل بالنظام القديم، غيّر الافتراضي واعتمد الطلبات المعلقة الحالية.
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

-- النشر التلقائي مؤقتًا، مع منع الزائر من توثيق أو تمييز نفسه.
create or replace function public.prepare_public_provider()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
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

grant select, insert on public.providers to anon, authenticated;

-- لا توجد سياسات عامة للتعديل أو الحذف.
-- تقدر توقف أو تحذف أي خدمة من Supabase Dashboard باستخدام حساب الإدارة.


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

-- لا نضيف سياسة SELECT عامة حتى لا يستطيع الزوار قراءة معرّفات بعضهم.
drop policy if exists "Public can read visitors" on public.site_visitors;
drop policy if exists "Public can insert visitors" on public.site_visitors;
drop policy if exists "Public can update visitors" on public.site_visitors;

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

comment on table public.providers is 'مقدمو الخدمات المسجلون في مجمع خدمات إصطباري';
comment on column public.providers.status is 'approved للنشر، pending للمراجعة لاحقًا، rejected للمرفوض، suspended للموقوف';
comment on table public.site_visitors is 'عداد المتصفحات الفريدة وزياراتها بدون بيانات شخصية';
