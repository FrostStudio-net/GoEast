begin;

create extension if not exists pgcrypto;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cruise_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.ships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cruise_line_id uuid references public.cruise_lines(id),
  created_at timestamptz not null default now()
);

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_duration_minutes integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_number text,
  capacity integer,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  can_drive boolean not null default false,
  can_guide boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  status text not null constraint bookings_status_check check (status in ('inquiry','confirmed','completed','cancelled')),
  booked_on date,
  service_date date not null,
  start_time time not null,
  end_time time,
  customer_id uuid references public.customers(id),
  ship_id uuid references public.ships(id),
  tour_id uuid not null references public.tours(id),
  guest_count integer not null constraint bookings_guest_count_check check (guest_count >= 1),
  vehicle_id uuid references public.vehicles(id),
  driver_id uuid references public.staff(id),
  guide_id uuid references public.staff(id),
  port_or_departure_location text,
  pickup_location text,
  meeting_instructions text,
  price numeric not null default 0 constraint bookings_price_check check (price >= 0),
  currency text not null default 'ISK',
  payment_status text not null default 'unpaid' constraint bookings_payment_status_check check (payment_status in ('unpaid','invoiced','paid','not_applicable')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index bookings_service_date_idx on public.bookings(service_date);
create index bookings_status_idx on public.bookings(status);
create index bookings_ship_id_idx on public.bookings(ship_id);
create index bookings_driver_id_idx on public.bookings(driver_id);
create index bookings_vehicle_id_idx on public.bookings(vehicle_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger tours_set_updated_at before update on public.tours for each row execute function public.set_updated_at();
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger staff_set_updated_at before update on public.staff for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.customers enable row level security;
alter table public.cruise_lines enable row level security;
alter table public.ships enable row level security;
alter table public.tours enable row level security;
alter table public.vehicles enable row level security;
alter table public.staff enable row level security;
alter table public.bookings enable row level security;
alter table public.admin_users enable row level security;

create policy customers_admin_all on public.customers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cruise_lines_admin_all on public.cruise_lines for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ships_admin_all on public.ships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tours_admin_all on public.tours for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy vehicles_admin_all on public.vehicles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_admin_all on public.staff for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin_all on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_users_select_self on public.admin_users for select to authenticated using (user_id = auth.uid());

revoke all on public.customers, public.cruise_lines, public.ships, public.tours, public.vehicles, public.staff, public.bookings, public.admin_users from anon;
grant select, insert, update, delete on public.customers, public.cruise_lines, public.ships, public.tours, public.vehicles, public.staff, public.bookings to authenticated;
grant select on public.admin_users to authenticated;

commit;
