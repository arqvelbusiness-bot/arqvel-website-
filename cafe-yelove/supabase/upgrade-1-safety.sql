-- Cafe Yelove — upgrade 1: run once in Supabase (SQL Editor → New query → paste → Run)

-- ---------- safety: real prices, sold-out and spam checks (server side) ----------
create table if not exists public.menu_prices (
  name text not null,
  option text not null default '',
  price numeric(10,2) not null check (price >= 0),
  updated_at timestamptz not null default now(),
  primary key (name, option)
);
alter table public.menu_prices enable row level security;
drop policy if exists "public reads prices" on public.menu_prices;
create policy "public reads prices" on public.menu_prices for select to anon, authenticated using (true);
drop policy if exists "staff manage prices" on public.menu_prices;
create policy "staff manage prices" on public.menu_prices for all to authenticated using (true) with check (true);

-- Every new order is re-priced from menu_prices, so totals can't be edited on the phone.
create or replace function public.check_order() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  it jsonb; p numeric; q int; sub numeric := 0; arr jsonb := '[]'::jsonb; recent int; opt text;
begin
  select count(*) into recent from orders where table_no = new.table_no and created_at > now() - interval '10 minutes';
  if recent >= 6 then raise exception 'Too many orders from this table just now. Please ask the staff.'; end if;
  select count(*) into recent from orders where created_at > now() - interval '1 minute';
  if recent >= 40 then raise exception 'We are very busy right now. Please try again in a minute.'; end if;
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then raise exception 'Your order is empty'; end if;
  for it in select value from jsonb_array_elements(new.items) loop
    q := nullif(it->>'qty','')::int;
    if q is null or q < 1 or q > 20 then raise exception 'Invalid quantity'; end if;
    opt := coalesce(it->>'option', '');
    if exists (select 1 from menu_availability where name = it->>'name' and sold_out) then
      raise exception '% is sold out today', it->>'name';
    end if;
    select price into p from menu_prices where name = it->>'name' and option = opt;
    if p is null then select price into p from menu_prices where name = it->>'name' and option = ''; end if;
    if p is null then raise exception 'Sorry, % is not on the menu', it->>'name'; end if;
    sub := sub + p * q;
    arr := arr || jsonb_build_object('name', it->>'name', 'option', nullif(opt, ''), 'qty', q, 'price', p);
  end loop;
  new.items := arr;
  new.subtotal := sub;
  new.gst := round(sub * 0.05);
  new.total := sub + round(sub * 0.05);
  new.status := 'new'; new.paid := false; new.paid_method := null; new.created_at := now();
  return new;
end $fn$;
drop trigger if exists orders_check on public.orders;
create trigger orders_check before insert on public.orders for each row execute function public.check_order();

-- Current menu prices (the dashboard also re-syncs these from js/menu.js every time staff log in)
insert into public.menu_prices (name, option, price) values
  ('Classic Margherita', '', 470),
  ('Farm House Pizza', '', 489),
  ('Paneer Twist Pizza', '', 499),
  ('Pesto Milano Pizza', '', 499),
  ('Chicken Makhani Pizza', '', 489),
  ('Fiery Chicken Pepperoni Pizza', '', 519),
  ('Chicken Overloaded Pizza', '', 649),
  ('Sweet Sriracha Dynamite Pizza', '', 549),
  ('Chicken Keema Maxx Pizza', '', 589),
  ('Yelove Delight Burger', '', 289),
  ('Crispy Paneer Burger', '', 349),
  ('Crispy Paneer Burger', 'Nashville', 349),
  ('Crispy Paneer Burger', 'Korean', 349),
  ('Classic American Burger', '', 389),
  ('Korean / Nashville Burger', '', 369),
  ('Korean / Nashville Burger', 'Korean', 369),
  ('Korean / Nashville Burger', 'Nashville', 369),
  ('Mexican Chicken Burger', '', 369),
  ('Stroganoff Chicken Burger', '', 429),
  ('Smash Beef Burger', '', 469),
  ('Stroganoff Beef Burger', '', 489),
  ('Mac & Cheese', '', 389),
  ('Arrabbiata', '', 389),
  ('Spaghetti Aglio e Olio', '', 369),
  ('Spaghetti Pesto', '', 389),
  ('Pasta Lasagne', '', 449),
  ('Fettuccine Alfredo', '', 449),
  ('Beef Bolognese', '', 449),
  ('Fries', '', 199),
  ('Fries', 'Plain', 199),
  ('Fries', 'Peri Peri', 249),
  ('Fries', 'Loaded', 299),
  ('Popcorn Fries', '', 299),
  ('Italian Parmesan Fries', '', 349),
  ('Cheese Garlic Bread', '', 299),
  ('Bruschetta (Broccoli & Mushroom)', '', 349),
  ('Baby Corn Tempura', '', 349),
  ('Honey Lotus Stem', '', 349),
  ('Cigaro', '', 389),
  ('Dynamite Paneer', '', 449),
  ('Honey Chilli Paneer', '', 449),
  ('Chicken Pops', '', 349),
  ('Chicken Wings', '', 369),
  ('Chicken Wings', 'Nashville', 369),
  ('Chicken Wings', 'Korean', 369),
  ('Chicken Wings', 'Sweet Chilli', 369),
  ('Chicken Wings', 'BBQ', 369),
  ('Chicken Loaded (Fries/Nachos)', '', 389),
  ('Chicken Loaded (Fries/Nachos)', 'Fries', 389),
  ('Chicken Loaded (Fries/Nachos)', 'Nachos', 389),
  ('Chicken Tender Crunch', '', 389),
  ('Chilli Beef', '', 389),
  ('Dynamite Chicken', '', 449),
  ('Cigaro Chicken', '', 449),
  ('Chicken Parmigiana', '', 449),
  ('Jamaican Jerk Chicken Wings', '', 489),
  ('Achari Kataifi Prawn', '', 489),
  ('Creme De Coco Prawn', '', 549),
  ('Prawn Tempura', '', 589),
  ('Beef Chimichurri', '', 549),
  ('Balsamic Beef Steak', '', 599),
  ('Grilled Chicken Steak', '', 529),
  ('Grilled Chicken Steak', 'Peppercorn', 529),
  ('Grilled Chicken Steak', 'Sriracha', 529),
  ('Grilled Chicken Steak', 'Rosemary', 529),
  ('Yelove Di Chicken', '', 489),
  ('Chicken Shawarma', '', 549),
  ('Fish & Chips', '', 489),
  ('Miso Grilled Fish', '', 549),
  ('Creamy Rice Bowl', '', 489),
  ('Creamy Rice Bowl', 'Mushroom', 489),
  ('Creamy Rice Bowl', 'Chicken', 529),
  ('Creamy Rice Bowl', 'Prawn', 549),
  ('Burnt Garlic Rice', '', 489),
  ('Burnt Garlic Rice', 'Corn & Egg', 489),
  ('Burnt Garlic Rice', 'Chicken', 529),
  ('Pink Lady', '', 389),
  ('Ocean Latte', '', 349),
  ('Spanish Latte', '', 289),
  ('Mocha', '', 275),
  ('Café Macchiato', '', 259),
  ('Latte (Hot/Iced)', '', 249),
  ('Latte (Hot/Iced)', 'Hot', 249),
  ('Latte (Hot/Iced)', 'Iced', 249),
  ('Cappuccino (Hot/Iced)', '', 219),
  ('Cappuccino (Hot/Iced)', 'Hot', 219),
  ('Cappuccino (Hot/Iced)', 'Iced', 219),
  ('Café Americano (Hot/Iced)', '', 199),
  ('Café Americano (Hot/Iced)', 'Hot', 199),
  ('Café Americano (Hot/Iced)', 'Iced', 199),
  ('Cold Coffee', '', 199),
  ('Espresso', '', 199),
  ('Ferrero Rocher Shake', '', 299),
  ('Triple Chocolate Shake', '', 299),
  ('Tiramisu Shake', '', 299),
  ('Biscoff Shake', '', 289),
  ('Caramel Shake', '', 259),
  ('Oreo Shake', '', 249),
  ('Butterscotch Shake', '', 189),
  ('Strawberry Shake', '', 149),
  ('Milo Shake', '', 119)
on conflict (name, option) do update set price = excluded.price, updated_at = now();
