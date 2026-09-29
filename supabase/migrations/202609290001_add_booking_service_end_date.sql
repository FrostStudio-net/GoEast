begin;

alter table public.bookings
  add column service_end_date date;

alter table public.bookings
  add constraint bookings_service_end_date_check
  check (service_end_date is null or service_end_date >= service_date);

create index bookings_service_end_date_idx on public.bookings(service_end_date);

commit;
