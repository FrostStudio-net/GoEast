begin;

insert into public.cruise_lines (id,name) values
('10000000-0000-4000-8000-000000000001','Viking Ocean Cruises'),
('10000000-0000-4000-8000-000000000002','Celebrity Cruises'),
('10000000-0000-4000-8000-000000000003','Holland America Line'),
('10000000-0000-4000-8000-000000000004','Princess Cruises'),
('10000000-0000-4000-8000-000000000005','Costa Cruises')
on conflict (id) do nothing;

insert into public.ships (id,name,cruise_line_id) values
('20000000-0000-4000-8000-000000000001','Viking Neptune','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000002','Viking Mars','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000003','Celebrity Silhouette','10000000-0000-4000-8000-000000000002'),
('20000000-0000-4000-8000-000000000004','Rotterdam','10000000-0000-4000-8000-000000000003'),
('20000000-0000-4000-8000-000000000005','Regal Princess','10000000-0000-4000-8000-000000000004'),
('20000000-0000-4000-8000-000000000006','Costa Favolosa','10000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;

insert into public.tours (id,name,default_duration_minutes) values
('30000000-0000-4000-8000-000000000001','Nature & Wildlife RIB Safari',180),
('30000000-0000-4000-8000-000000000002','Stuðlagil Canyon Adventure',360),
('30000000-0000-4000-8000-000000000003','Eastfjords Private Explorer',300),
('30000000-0000-4000-8000-000000000004','Vök Baths & Highland Circle',300),
('30000000-0000-4000-8000-000000000005','Seyðisfjörður Scenic Tour',210)
on conflict (id) do nothing;

insert into public.vehicles (id,name,registration_number,capacity,notes) values
('40000000-0000-4000-8000-000000000001','GE-01 · Defender','GE-01',6,'Land Rover Defender'),
('40000000-0000-4000-8000-000000000002','GE-02 · Transit','GE-02',14,'Ford Transit'),
('40000000-0000-4000-8000-000000000003','GE-03 · Sprinter','GE-03',16,'Mercedes-Benz Sprinter'),
('40000000-0000-4000-8000-000000000004','GE-04 · Transit','GE-04',14,'Ford Transit'),
('40000000-0000-4000-8000-000000000005','GE-05 · Land Cruiser','GE-05',6,'Toyota Land Cruiser'),
('40000000-0000-4000-8000-000000000006','GE-06 · Crafter','GE-06',18,'Volkswagen Crafter'),
('40000000-0000-4000-8000-000000000007','GE-07 · Sprinter','GE-07',16,'Mercedes-Benz Sprinter'),
('40000000-0000-4000-8000-000000000008','GE-08 · Sprinter','GE-08',16,'Mercedes-Benz Sprinter')
on conflict (id) do nothing;

insert into public.staff (id,name,can_drive,can_guide) values
('50000000-0000-4000-8000-000000000001','Árni Pálsson',true,false),
('50000000-0000-4000-8000-000000000002','Hrafn Eiríksson',true,false),
('50000000-0000-4000-8000-000000000003','Jón Einarsson',true,true),
('50000000-0000-4000-8000-000000000004','Magnús Þórsson',true,false),
('50000000-0000-4000-8000-000000000005','Sara Björnsdóttir',true,false),
('50000000-0000-4000-8000-000000000006','Bjarni Karlsson',true,false),
('50000000-0000-4000-8000-000000000007','Sara Jónsdóttir',false,true),
('50000000-0000-4000-8000-000000000008','Elín Róbertsdóttir',false,true),
('50000000-0000-4000-8000-000000000009','Anna María Helgadóttir',false,true),
('50000000-0000-4000-8000-000000000010','Katrín Ólafsdóttir',false,true),
('50000000-0000-4000-8000-000000000011','Þóra Guðmundsdóttir',false,true)
on conflict (id) do nothing;

insert into public.customers (id,name,contact_person,email,phone) values
('60000000-0000-4000-8000-000000000001','Elliot Hansen','Elliot Hansen','elliot.hansen@email.dk','+45 22 84 19 03'),
('60000000-0000-4000-8000-000000000002','Mia Thompson','Mia Thompson','mia.thompson@outlook.com','+44 7700 903118'),
('60000000-0000-4000-8000-000000000003','Noah Williams','Noah Williams','noah.williams@gmail.com','+1 415 555 0186'),
('60000000-0000-4000-8000-000000000004','Emilia Rossi','Emilia Rossi','emilia.rossi@email.it','+39 340 882 1044'),
('60000000-0000-4000-8000-000000000005','Lucas Martin','Lucas Martin','lucas.martin@email.fr','+33 6 12 44 78 20'),
('60000000-0000-4000-8000-000000000006','Sofia Klein','Sofia Klein','sofia.klein@email.de','+49 151 220 1842'),
('60000000-0000-4000-8000-000000000007','Charlotte Reed','Charlotte Reed','charlotte.reed@mail.com','+44 7700 903442'),
('60000000-0000-4000-8000-000000000008','Oliver Chen','Oliver Chen','oliver.chen@email.ca','+1 604 555 0119'),
('60000000-0000-4000-8000-000000000009','Isabelle Moreau','Isabelle Moreau','isabelle.moreau@email.fr','+33 6 80 52 18 42')
on conflict (id) do nothing;

insert into public.bookings (id,booking_number,status,booked_on,service_date,start_time,end_time,customer_id,ship_id,tour_id,guest_count,vehicle_id,driver_id,guide_id,port_or_departure_location,pickup_location,price,currency,payment_status,internal_notes) values
('70000000-0000-4000-8000-000000000001','GE-260924-01','confirmed','2026-09-18','2026-09-24','08:30',null,'60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',4,'40000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000007','Seyðisfjörður harbour','Berth 2',156000,'ISK','invoiced','Meet at Berth 2 with GoEast sign. One guest has limited mobility.'),
('70000000-0000-4000-8000-000000000002','GE-260924-02','inquiry','2026-09-20','2026-09-24','09:00','12:00','60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001',8,'40000000-0000-4000-8000-000000000006',null,'50000000-0000-4000-8000-000000000008','Seyðisfjörður harbour','Tender harbour',248000,'ISK','unpaid','Awaiting final passenger manifest. Guests require waterproof overalls in mixed sizes.'),
('70000000-0000-4000-8000-000000000003','GE-260924-03','confirmed','2026-09-19','2026-09-24','10:30',null,'60000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003',6,'40000000-0000-4000-8000-000000000001',null,'50000000-0000-4000-8000-000000000007','Seyðisfjörður harbour','Seyðisfjörður cruise terminal',252000,'ISK','paid','Private family group. Child seat needed for one 5-year-old.'),
('70000000-0000-4000-8000-000000000004','GE-260925-01','confirmed','2026-09-20','2026-09-25','08:00','12:15','60000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000005',12,'40000000-0000-4000-8000-000000000008','50000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000009','Seyðisfjörður harbour','Cruise terminal',318000,'ISK','invoiced','Italian-speaking guide requested. Return to ship no later than 12:15.'),
('70000000-0000-4000-8000-000000000005','GE-260925-02','completed','2026-09-17','2026-09-25','09:30','14:30','60000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000004',5,'40000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000010','Eskifjörður harbour','Cruise terminal',215000,'ISK','paid','Tour completed on schedule. Guest complimented guide and vehicle comfort.'),
('70000000-0000-4000-8000-000000000006','GE-260926-01','inquiry','2026-09-22','2026-09-26','08:15',null,'60000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002',9,null,'50000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000008','Seyðisfjörður harbour','Berth 1',297000,'ISK','unpaid','Provisional request. Confirm ship arrival time before assigning final pickup point.'),
('70000000-0000-4000-8000-000000000007','GE-260926-02','cancelled','2026-09-19','2026-09-26','09:00','12:00','60000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001',10,'40000000-0000-4000-8000-000000000007','50000000-0000-4000-8000-000000000001',null,'Seyðisfjörður harbour','Tender harbour',290000,'ISK','not_applicable','Cancelled after cruise line removed the port call due to weather.'),
('70000000-0000-4000-8000-000000000008','GE-260927-01','confirmed','2026-09-21','2026-09-27','08:45','12:15','60000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000005',7,'40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000009','Seyðisfjörður harbour','Tender landing',203000,'ISK','paid','Vegetarian lunch for two guests.'),
('70000000-0000-4000-8000-000000000009','GE-260927-02','confirmed','2026-09-22','2026-09-27','10:00','15:00','60000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000004',4,'40000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000010','Seyðisfjörður harbour','Cruise terminal',176000,'ISK','invoiced','Vök admission confirmed. Bring two booster seats.')
on conflict (id) do nothing;

commit;
