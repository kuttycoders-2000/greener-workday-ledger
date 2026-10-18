
create type public.app_role as enum ('admin','employee');

create table public.companies (id uuid primary key default gen_random_uuid(), name text not null, is_demo boolean not null default false, created_at timestamptz not null default now());
create table public.teams (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, name text not null);
create table public.profiles (
  id uuid primary key, company_id uuid references public.companies(id) on delete set null, full_name text not null default '', email text,
  team_id uuid references public.teams(id) on delete set null, location text default 'Bengaluru',
  home_distance_km numeric not null default 10, usual_mode text not null default 'car', office_days_per_week int not null default 5,
  tracking_consent boolean not null default false, tracking_paused boolean not null default false,
  baseline_kg_per_week numeric, onboarded boolean not null default false, created_at timestamptz not null default now());
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role public.app_role not null, unique(user_id, role));
create table public.emission_factors (mode text primary key, label text not null, factor numeric not null, sort int not null default 0, updated_at timestamptz not null default now());
create table public.trips (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date, mode text not null references public.emission_factors(mode), distance_km numeric not null check (distance_km >= 0 and distance_km < 20000),
  co2_kg numeric not null default 0, category text not null default 'commute', status text not null default 'confirmed', source text not null default 'manual', created_at timestamptz not null default now());
create index on public.trips(user_id, date);
create index on public.trips(date);
create table public.office_habits (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, date date not null default current_date, habit_type text not null, co2_saved_kg numeric not null default 0, created_at timestamptz not null default now());
create table public.rewards (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, name text not null, description text, kind text not null default 'voucher', created_at timestamptz not null default now());
create table public.challenges (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, name text not null, description text, start_date date not null, end_date date not null, reward text, target_modes text[] not null default array['metro','bus','walk','cycle'], created_at timestamptz not null default now());
create table public.invites (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, email text not null, invited_by uuid, created_at timestamptz not null default now(), unique(company_id, email));

grant select on public.companies, public.teams, public.emission_factors, public.user_roles to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, team_id, location, home_distance_km, usual_mode, office_days_per_week, tracking_consent, tracking_paused, baseline_kg_per_week, onboarded) on public.profiles to authenticated;
grant update (factor) on public.emission_factors to authenticated;
grant select, insert, update, delete on public.trips, public.office_habits, public.rewards, public.challenges to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant all on public.companies, public.teams, public.profiles, public.user_roles, public.emission_factors, public.trips, public.office_habits, public.rewards, public.challenges, public.invites to service_role;

alter table public.companies enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.emission_factors enable row level security;
alter table public.trips enable row level security;
alter table public.office_habits enable row level security;
alter table public.rewards enable row level security;
alter table public.challenges enable row level security;
alter table public.invites enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create or replace function public.my_company_id() returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own company" on public.companies for select to authenticated using (id = public.my_company_id());
create policy "company teams" on public.teams for select to authenticated using (company_id = public.my_company_id());
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "factors read" on public.emission_factors for select to authenticated using (true);
create policy "factors admin update" on public.emission_factors for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own trips" on public.trips for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own habits" on public.office_habits for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "company rewards read" on public.rewards for select to authenticated using (company_id = public.my_company_id());
create policy "admin rewards write" on public.rewards for all to authenticated using (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin')) with check (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin'));
create policy "company challenges read" on public.challenges for select to authenticated using (company_id = public.my_company_id());
create policy "admin challenges write" on public.challenges for all to authenticated using (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin')) with check (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin'));
create policy "admin invites" on public.invites for all to authenticated using (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin')) with check (company_id = public.my_company_id() and public.has_role(auth.uid(),'admin'));

-- emission engine
create or replace function public.trips_set_co2() returns trigger language plpgsql set search_path = public as $$
begin
  new.co2_kg := round(new.distance_km * coalesce((select factor from public.emission_factors where mode = new.mode), 0), 3);
  if new.mode = 'flight' then new.category := 'business'; end if;
  return new;
end $$;
create trigger trips_co2 before insert or update of mode, distance_km on public.trips for each row execute function public.trips_set_co2();

insert into public.emission_factors(mode,label,factor,sort) values
('walk','Walk',0,1),('cycle','Cycle',0,2),('metro','Metro',0.04,3),('bus','Bus',0.08,4),('auto','Auto-rickshaw',0.10,5),
('bike','Two-wheeler',0.05,6),('car','Car',0.17,7),('cab','Cab',0.19,8),('flight','Flight',0.15,9);

-- signup trigger
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select company_id into cid from public.invites where lower(email) = lower(new.email) order by created_at desc limit 1;
  if cid is null then select id into cid from public.companies order by created_at limit 1; end if;
  insert into public.profiles(id, company_id, full_name, email)
  values (new.id, cid, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do update set email = excluded.email;
  insert into public.user_roles(user_id, role) values (new.id, 'employee') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Aggregates (privacy-preserving)
create or replace function public.employee_stats(_company uuid) returns table(user_id uuid, full_name text, team_id uuid, location text, baseline numeric, recent_week numeric, pct numeric)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.team_id, p.location, p.baseline_kg_per_week,
    coalesce((select sum(t.co2_kg) from public.trips t where t.user_id = p.id and t.status='confirmed' and t.category='commute' and t.date > current_date - 28),0)/4.0,
    case when p.baseline_kg_per_week > 0 then round(((coalesce((select sum(t.co2_kg) from public.trips t where t.user_id = p.id and t.status='confirmed' and t.category='commute' and t.date > current_date - 28),0)/4.0) - p.baseline_kg_per_week)/p.baseline_kg_per_week*100, 1) end
  from public.profiles p where p.company_id = _company and p.baseline_kg_per_week > 0 and not public.has_role(p.id,'admin')
$$;
revoke execute on function public.employee_stats(uuid) from public, anon, authenticated;

create or replace function public.leaderboard_people() returns table(rank bigint, name text, pct numeric, is_me boolean)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by s.pct asc nulls last), s.full_name, s.pct, s.user_id = auth.uid()
  from public.employee_stats(public.my_company_id()) s order by 1
$$;

create or replace function public.leaderboard_teams() returns table(rank bigint, name text, people bigint, pct numeric, is_mine boolean)
language sql stable security definer set search_path = public as $$
  with g as (
    select tm.id, tm.name, count(*) people, round((sum(s.recent_week)-sum(s.baseline))/nullif(sum(s.baseline),0)*100,1) pct
    from public.employee_stats(public.my_company_id()) s join public.teams tm on tm.id = s.team_id group by tm.id, tm.name having count(*) >= 5)
  select row_number() over (order by pct asc), name, people, pct, id = (select team_id from public.profiles where id = auth.uid()) from g order by 1
$$;

create or replace function public.admin_dashboard() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cid uuid := public.my_company_id(); res jsonb; ws date := date_trunc('week', current_date)::date - 77;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  with emp as (select * from public.employee_stats(cid)),
  tr as (select t.* from public.trips t join emp on emp.user_id = t.user_id where t.status='confirmed' and t.date >= ws)
  select jsonb_build_object(
    'company', (select jsonb_build_object('name', name, 'is_demo', is_demo) from public.companies where id = cid),
    'total_kg', (select coalesce(sum(co2_kg),0) from tr),
    'cat6_kg', (select coalesce(sum(co2_kg),0) from tr where category='business'),
    'cat7_kg', (select coalesce(sum(co2_kg),0) from tr where category='commute'),
    'baseline_week_kg', (select coalesce(sum(baseline),0) from emp),
    'recent_week_kg', (select coalesce(sum(recent_week),0) from emp),
    'employees', (select count(*) from emp),
    'active', (select count(distinct user_id) from tr where date > current_date - 14),
    'habits_saved_kg', (select coalesce(sum(h.co2_saved_kg),0) from public.office_habits h join emp on emp.user_id = h.user_id where h.date >= ws),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week', w::date, 'kg', coalesce((select sum(co2_kg) from tr where date_trunc('week', tr.date) = w),0)) order by w),'[]')
               from generate_series(ws::timestamp, date_trunc('week', current_date), interval '1 week') w),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', src, 'kg', kg) order by kg desc),'[]') from (
               select case mode when 'car' then 'Car' when 'bike' then 'Two-wheeler' when 'cab' then 'Cab / auto' when 'auto' then 'Cab / auto' when 'flight' then 'Flights' when 'bus' then 'Bus' when 'metro' then 'Metro / rail' else 'Walk / cycle' end src, sum(co2_kg) kg
               from tr group by 1) x),
    'teams', (select coalesce(jsonb_agg(row_to_json(x) order by x.pct),'[]') from (
               select tm.name, count(*) people, round((select coalesce(sum(co2_kg),0) from tr join emp e2 on e2.user_id = tr.user_id where e2.team_id = tm.id)/1000.0, 2) t,
               round((sum(e.recent_week)-sum(e.baseline))/nullif(sum(e.baseline),0)*100,1) pct
               from emp e join public.teams tm on tm.id = e.team_id group by tm.id, tm.name having count(*) >= 5) x),
    'hidden_teams', (select count(*) from (select team_id from emp group by team_id having count(*) < 5) h),
    'locations', (select coalesce(jsonb_agg(row_to_json(x) order by x.t desc),'[]') from (
               select e.location name, count(*) people, round((select coalesce(sum(co2_kg),0) from tr join emp e2 on e2.user_id = tr.user_id where e2.location = e.location)/1000.0,2) t,
               round((sum(e.recent_week)-sum(e.baseline))/nullif(sum(e.baseline),0)*100,1) pct
               from emp e group by e.location having count(*) >= 5) x),
    'challenges', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'description', c.description, 'start_date', c.start_date, 'end_date', c.end_date, 'reward', c.reward,
               'participants', (select count(distinct t.user_id) from public.trips t join emp on emp.user_id = t.user_id where t.status='confirmed' and t.mode = any(c.target_modes) and t.date between c.start_date and c.end_date)) order by c.start_date desc),'[]')
               from public.challenges c where c.company_id = cid)
  ) into res;
  return res;
end $$;

grant execute on function public.leaderboard_people(), public.leaderboard_teams(), public.admin_dashboard(), public.my_company_id() to authenticated;

-- SEED
do $$
declare
  cid uuid := 'a0000000-0000-0000-0000-000000000001';
  team_names text[] := array['Engineering','Product','Sales','Finance','People & HR','Operations'];
  team_sizes int[] := array[14,9,12,8,4,13];
  team_ids uuid[] := array[]::uuid[];
  names text[] := array['Priya Sharma','Arjun Mehta','Kavya Iyer','Rohan Gupta','Sneha Reddy','Vikram Nair','Ananya Das','Karthik Rao','Meera Pillai','Aditya Joshi','Ishita Banerjee','Rahul Verma','Pooja Kulkarni','Siddharth Menon','Neha Agarwal','Amit Patel','Divya Krishnan','Nikhil Bhat','Riya Chatterjee','Manish Yadav','Shreya Desai','Varun Malhotra','Tanvi Shetty','Harsh Vardhan','Lakshmi Narayan','Kunal Saxena','Aishwarya Hegde','Gaurav Singh','Nandini Murthy','Abhishek Jain','Swati Mishra','Pranav Kapoor','Deepika Rangan','Sameer Khan','Bhavana Rao','Akash Thakur','Pallavi Ghosh','Tarun Bose','Gayatri Subramanian','Mohit Arora','Sanjana Prasad','Yash Chauhan','Keerthi Varma','Rajesh Kumar','Anjali Sinha','Dev Malik','Madhuri Shenoy','Imran Sheikh','Ritika Sethi','Suresh Babu','Fatima Ansari','Kabir Dutta','Lavanya Gowda','Omkar Pawar','Zoya Mirza','Hari Krishnan','Esha Tiwari','Naveen Reddy','Charu Bhatia','Vivek Anand'];
  modes text[] := array['car','car','car','bike','bike','bike','cab','auto','bus','metro','car','bike'];
  locs text[] := array['Bengaluru','Bengaluru','Pune','Gurugram'];
  i int := 0; ti int; k int; uid uuid; m text; dist numeric; days int; d int; dt date; w int; use_mode text; f numeric; p numeric;
begin
  insert into public.companies(id,name,is_demo,created_at) values (cid,'Northwind Technologies',true, now() - interval '200 days');
  for ti in 1..6 loop
    team_ids := team_ids || gen_random_uuid();
    insert into public.teams(id,company_id,name) values (team_ids[ti], cid, team_names[ti]);
  end loop;
  for ti in 1..6 loop
    for k in 1..team_sizes[ti] loop
      i := i + 1;
      if i = 1 then uid := '11111111-1111-1111-1111-111111111111'; m := 'car'; dist := 12; days := 4;
      else uid := gen_random_uuid(); m := modes[1 + floor(random()*12)::int]; dist := round((4 + random()*20)::numeric,1); days := 3 + floor(random()*3)::int; end if;
      select factor into f from public.emission_factors where mode = m;
      insert into public.profiles(id,company_id,full_name,email,team_id,location,home_distance_km,usual_mode,office_days_per_week,tracking_consent,baseline_kg_per_week,onboarded)
      values (uid, cid, names[i], case when i=1 then 'priya.demo@northwind.example' else lower(replace(names[i],' ','.'))||'@northwind.example' end,
        team_ids[ti], case when i=1 then 'Bengaluru' else locs[1+floor(random()*4)::int] end, dist, m, days, true, round(dist*2*days*f,2), true);
      insert into public.user_roles(user_id, role) values (uid,'employee');
      for d in 1..83 loop
        dt := current_date - d;
        continue when extract(dow from dt) in (0,6);
        continue when random() > days/5.0;
        w := d / 7;
        p := case when i=1 then 0.1 + (11-w)*0.04 else 0.04 + (11-w)*0.025 end;
        use_mode := m;
        if m in ('car','cab','bike','auto') and random() < p then
          use_mode := case when dist < 7 and random() < 0.5 then 'cycle' when random() < 0.65 then 'metro' else 'bus' end;
        end if;
        insert into public.trips(user_id,date,mode,distance_km) values (uid, dt, use_mode, dist*2);
        if random() < 0.25 then
          insert into public.office_habits(user_id,date,habit_type,co2_saved_kg) values (uid, dt, (array['ac_off','lights_off','no_printing','zero_food_waste'])[1+floor(random()*4)::int], 0.2);
        end if;
        if ti = 3 and random() < 0.012 then
          insert into public.trips(user_id,date,mode,distance_km) values (uid, dt, 'flight', 1700);
        end if;
      end loop;
    end loop;
  end loop;
  insert into public.trips(user_id,date,mode,distance_km,status,source) values ('11111111-1111-1111-1111-111111111111', current_date, 'metro', 24, 'pending', 'auto');
  insert into public.profiles(id,company_id,full_name,email,onboarded) values ('22222222-2222-2222-2222-222222222222', cid, 'Ananya Rao', 'admin.demo@northwind.example', true);
  insert into public.user_roles(user_id, role) values ('22222222-2222-2222-2222-222222222222','admin');
  insert into public.rewards(company_id,name,description,kind) values
    (cid,'Extra day of leave','One additional paid day off for the top team','leave'),
    (cid,'Voucher worth Rs 1,000','Gift voucher for top individual improvers','voucher'),
    (cid,'Tree planted in your name','Native sapling planted with a partner NGO','tree');
  insert into public.challenges(company_id,name,description,start_date,end_date,reward,target_modes) values
    (cid,'Metro Month','Take the metro at least 8 times this month',current_date - 10, current_date + 20,'Extra day of leave', array['metro']);
end $$;
