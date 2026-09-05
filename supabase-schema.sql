-- Chowly (The Grill House build) — schema matching the submitted data model:
-- Customer, Restaurant, MenuItem, Waiter, Chef, Bartender, Order, OrderItem
-- (bridge table), Payment, Complaint.

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  contact_number text
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text,
  email text
);

create table waiters (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name text not null,
  contact_number text
);

create table chefs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name text not null,
  specialty text
);

create table bartenders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name text not null,
  contact_number text
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  item_name text not null,
  item_type text check (item_type in ('Food', 'Drink')),
  price numeric not null,
  avg_waiting_time int not null
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  restaurant_id uuid references restaurants(id),
  waiter_id uuid references waiters(id),
  order_datetime timestamp default now(),
  order_status text check (order_status in ('In Progress', 'Completed', 'Delayed')) default 'In Progress'
);

-- Bridge table for the M-M relationship between Order and MenuItem.
-- Each line item is prepared by a chef OR a bartender, never both.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  menu_item_id uuid references menu_items(id),
  chef_id uuid references chefs(id),
  bartender_id uuid references bartenders(id),
  quantity int default 1,
  waiting_time int
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references orders(id),
  amount numeric not null,
  payment_method text check (payment_method in ('Card', 'Cash', 'Transfer')),
  is_pretend boolean default true,
  payment_datetime timestamp default now()
);

create table complaints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  customer_id uuid references customers(id),
  complaint_description text,
  rating int check (rating between 1 and 5),
  complaint_datetime timestamp default now()
);

-- Grant read/write access to the app (no login system — see documentation).
grant usage on schema public to anon, authenticated;
grant select, insert, update on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Sample data: The Grill House
insert into restaurants (name, location, contact_number)
values ('The Grill House', 'Lekki, Lagos', '08011112233');

insert into waiters (restaurant_id, name, contact_number)
select id, 'Musa Ibrahim', '08044445566' from restaurants where name = 'The Grill House';

insert into chefs (restaurant_id, name, specialty)
select id, 'Femi Adekunle', 'Continental' from restaurants where name = 'The Grill House';

insert into bartenders (restaurant_id, name, contact_number)
select id, 'Kelvin Ude', '08077778899' from restaurants where name = 'The Grill House';

insert into menu_items (restaurant_id, item_name, item_type, price, avg_waiting_time)
select id, 'Jollof Rice & Chicken', 'Food', 6500, 20 from restaurants where name = 'The Grill House';

insert into menu_items (restaurant_id, item_name, item_type, price, avg_waiting_time)
select id, 'Grilled Suya Platter', 'Food', 7000, 25 from restaurants where name = 'The Grill House';

insert into menu_items (restaurant_id, item_name, item_type, price, avg_waiting_time)
select id, 'Chapman', 'Drink', 2500, 5 from restaurants where name = 'The Grill House';

insert into menu_items (restaurant_id, item_name, item_type, price, avg_waiting_time)
select id, 'Red Wine (Glass)', 'Drink', 4000, 3 from restaurants where name = 'The Grill House';
