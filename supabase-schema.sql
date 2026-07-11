-- قاعدة بيانات مجمع خدمات إصطباري
-- شغّل هذا الملف مرة واحدة داخل Supabase SQL Editor.

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
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.providers enable row level security;

-- الزائر يرى الخدمات المعتمدة فقط.
drop policy if exists "Public can view approved providers" on public.providers;
create policy "Public can view approved providers"
on public.providers
for select
to anon, authenticated
using (status = 'approved');

-- الزائر يستطيع إضافة طلب جديد فقط، ولا يقدر يعتمد نفسه أو يميّز خدمته.
drop policy if exists "Public can submit pending providers" on public.providers;
create policy "Public can submit pending providers"
on public.providers
for insert
to anon, authenticated
with check (
  status = 'pending'
  and verified = false
  and featured = false
  and rejection_reason is null
);

-- لا توجد سياسات عامة للتعديل أو الحذف.
-- الاعتماد والرفض يتمان من Supabase Dashboard أو من لوحة إدارة آمنة تستخدم Service Role على الخادم فقط.

comment on table public.providers is 'مقدمو الخدمات المسجلون في مجمع خدمات إصطباري';
comment on column public.providers.status is 'pending للمراجعة، approved للنشر، rejected للمرفوض، suspended للموقوف';
