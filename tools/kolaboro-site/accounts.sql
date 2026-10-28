create table if not exists public.kolaboro_users(id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), email text unique not null, name text, pw_hash text not null, status text default 'pending', country text, paypal_ref text, last_login timestamptz);
create table if not exists public.kolaboro_sessions(token_hash text primary key, user_id uuid references public.kolaboro_users(id) on delete cascade, created_at timestamptz default now(), expires_at timestamptz, by_admin boolean default false);
create sequence if not exists public.kolaboro_case_seq start 1001;
create table if not exists public.kolaboro_cases(id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(), user_id uuid references public.kolaboro_users(id) on delete cascade, code text unique, paid boolean default false, project_url text, project_name text, developer text, location text, price_text text, contract_url text, user_notes text, next_payment_date date, next_payment_amount text, stage int default 0, verdict text default 'pending', stage_note text, report_url text, eta date, desk jsonb);
create table if not exists public.kolaboro_case_log(id bigserial primary key, case_id uuid references public.kolaboro_cases(id) on delete cascade, created_at timestamptz default now(), stage int, note text);
create table if not exists public.kolaboro_messages(id bigserial primary key, case_id uuid references public.kolaboro_cases(id) on delete cascade, created_at timestamptz default now(), from_admin boolean default false, body text not null, read_at timestamptz);
create table if not exists public.kolaboro_login_fail(id bigserial primary key, email text, at timestamptz default now());
alter table public.kolaboro_users enable row level security; alter table public.kolaboro_sessions enable row level security; alter table public.kolaboro_cases enable row level security; alter table public.kolaboro_case_log enable row level security; alter table public.kolaboro_messages enable row level security; alter table public.kolaboro_login_fail enable row level security;

create or replace function public.kolaboro__session(p_user uuid, p_hours int default 720, p_admin boolean default false) returns text language plpgsql security definer set search_path to 'public','extensions' as $f$
declare t text := encode(gen_random_bytes(24),'hex');
begin insert into kolaboro_sessions(token_hash,user_id,expires_at,by_admin) values (encode(digest(t,'sha256'),'hex'), p_user, now() + make_interval(hours => p_hours), p_admin); return t; end $f$;
revoke all on function public.kolaboro__session(uuid,int,boolean) from public, anon, authenticated;

create or replace function public.kolaboro__new_case(p_user uuid, p_url text, p_paid boolean) returns uuid language plpgsql security definer set search_path to 'public' as $f$
declare cid uuid; nm text;
begin
  insert into kolaboro_cases(user_id, code, paid, project_url, eta) values (p_user, 'KB-' || nextval('kolaboro_case_seq'), p_paid, nullif(left(trim(coalesce(p_url,'')),500),''), (now() + interval '7 days')::date) returning id into cid;
  insert into kolaboro_case_log(case_id, stage, note) values (cid, 0, case when p_paid then 'Case opened. Payment confirmed.' else 'Case opened. We are confirming your PayPal payment.' end);
  select name into nm from kolaboro_users where id = p_user;
  insert into kolaboro_messages(case_id, from_admin, body) values (cid, true, 'Hi ' || coalesce(split_part(nm,' ',1),'there') || ', welcome to Kolaboro. Your case is open. Next: add what you know about the project (developer, price, payment plan, contract) in "Project details", and upload or link your contract if you have it. Your local agent starts with the land office and the building permit. You will see every step here, and you can write to us any time in this chat.');
  return cid;
end $f$;
revoke all on function public.kolaboro__new_case(uuid,text,boolean) from public, anon, authenticated;

create or replace function public.kolaboro_signup(p_email text, p_password text, p_name text, p_project_url text default null, p_paypal_ref text default null, p_country text default null)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $f$
declare e text := lower(trim(coalesce(p_email,''))); uid uuid; paid boolean; url text;
begin
  if e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('error','email'); end if;
  if length(coalesce(p_password,'')) < 8 then return jsonb_build_object('error','password'); end if;
  if coalesce(trim(p_name),'') = '' then return jsonb_build_object('error','name'); end if;
  if exists(select 1 from kolaboro_users where email = e) then return jsonb_build_object('error','exists'); end if;
  if (select count(*) from kolaboro_users where created_at > now() - interval '1 hour') > 50 then return jsonb_build_object('error','busy'); end if;
  paid := exists(select 1 from kolaboro_payments where lower(email) = e);
  insert into kolaboro_users(email,name,pw_hash,status,country,paypal_ref,last_login) values (e, left(trim(p_name),120), crypt(p_password, gen_salt('bf', 10)), case when paid then 'active' else 'pending' end, left(p_country,80), left(p_paypal_ref,80), now()) returning id into uid;
  url := coalesce(nullif(trim(coalesce(p_project_url,'')),''), (select learn from kolaboro_applications where lower(email) = e and plan = 'yc-desk' and learn ~ '^https?://' order by created_at desc limit 1));
  perform kolaboro__new_case(uid, url, paid);
  return jsonb_build_object('token', kolaboro__session(uid), 'status', case when paid then 'active' else 'pending' end);
end $f$;
grant execute on function public.kolaboro_signup(text,text,text,text,text,text) to anon;

create or replace function public.kolaboro_login(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $f$
declare e text := lower(trim(coalesce(p_email,''))); u kolaboro_users;
begin
  if (select count(*) from kolaboro_login_fail where email = e and at > now() - interval '1 hour') >= 10 then return jsonb_build_object('error','locked'); end if;
  select * into u from kolaboro_users where email = e;
  if u.id is null or u.pw_hash <> crypt(coalesce(p_password,''), u.pw_hash) then
    insert into kolaboro_login_fail(email) values (e); perform pg_sleep(1); return jsonb_build_object('error','wrong');
  end if;
  update kolaboro_users set last_login = now() where id = u.id;
  return jsonb_build_object('token', kolaboro__session(u.id));
end $f$;
grant execute on function public.kolaboro_login(text,text) to anon;

create or replace function public.kolaboro_portal(p_token text, p_action text default 'me', p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $f$
declare s kolaboro_sessions; u kolaboro_users; cid uuid; r jsonb; pl jsonb := coalesce(p_payload,'{}'::jsonb);
begin
  select * into s from kolaboro_sessions where token_hash = encode(digest(coalesce(p_token,''),'sha256'),'hex') and expires_at > now();
  if s.user_id is null then return jsonb_build_object('error','auth'); end if;
  select * into u from kolaboro_users where id = s.user_id;
  if p_action = 'logout' then delete from kolaboro_sessions where token_hash = s.token_hash; return jsonb_build_object('ok',true); end if;
  if p_action in ('message','update_case','save_desk','read') then
    select id into cid from kolaboro_cases where id = (pl->>'case_id')::uuid and user_id = u.id;
    if cid is null then return jsonb_build_object('error','case'); end if;
  end if;
  if p_action = 'message' then
    if length(trim(coalesce(pl->>'body',''))) = 0 then return jsonb_build_object('error','empty'); end if;
    if (select count(*) from kolaboro_messages m join kolaboro_cases c on c.id = m.case_id where c.user_id = u.id and not m.from_admin and m.created_at > now() - interval '1 hour') > 60 then return jsonb_build_object('error','busy'); end if;
    insert into kolaboro_messages(case_id, from_admin, body) values (cid, s.by_admin, left(pl->>'body',4000));
  elsif p_action = 'update_case' then
    update kolaboro_cases set project_name = left(pl->>'project_name',200), developer = left(pl->>'developer',200), location = left(pl->>'location',200), price_text = left(pl->>'price_text',100), contract_url = left(pl->>'contract_url',500), user_notes = left(pl->>'user_notes',4000), project_url = coalesce(nullif(left(pl->>'project_url',500),''), project_url), next_payment_date = nullif(pl->>'next_payment_date','')::date, next_payment_amount = left(pl->>'next_payment_amount',60), updated_at = now() where id = cid;
  elsif p_action = 'save_desk' then
    update kolaboro_cases set desk = pl->'desk', project_name = coalesce(project_name, left(pl->'desk'->'report'->>'project',200)), developer = coalesce(developer, left(pl->'desk'->'report'->>'developer',200)), location = coalesce(location, left(pl->'desk'->'report'->>'location',200)) where id = cid and desk is null;
  elsif p_action = 'read' then
    if not s.by_admin then update kolaboro_messages set read_at = now() where case_id = cid and from_admin and read_at is null; end if;
  elsif p_action = 'new_case' then
    if (select count(*) from kolaboro_cases where user_id = u.id) >= 20 then return jsonb_build_object('error','limit'); end if;
    perform kolaboro__new_case(u.id, pl->>'project_url', false);
  elsif p_action = 'password' then
    if u.pw_hash <> crypt(coalesce(pl->>'old',''), u.pw_hash) then return jsonb_build_object('error','wrong'); end if;
    if length(coalesce(pl->>'new','')) < 8 then return jsonb_build_object('error','password'); end if;
    update kolaboro_users set pw_hash = crypt(pl->>'new', gen_salt('bf',10)) where id = u.id;
  end if;
  select jsonb_build_object(
    'user', jsonb_build_object('email', u.email, 'name', u.name, 'status', u.status, 'since', u.created_at, 'admin_view', s.by_admin),
    'cases', coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id, 'code', c.code, 'created_at', c.created_at, 'paid', c.paid, 'project_url', c.project_url, 'project_name', c.project_name, 'developer', c.developer, 'location', c.location, 'price_text', c.price_text, 'contract_url', c.contract_url, 'user_notes', c.user_notes, 'next_payment_date', c.next_payment_date, 'next_payment_amount', c.next_payment_amount,
        'stage', c.stage, 'verdict', c.verdict, 'stage_note', c.stage_note, 'report_url', c.report_url, 'eta', c.eta, 'desk', c.desk,
        'log', coalesce((select jsonb_agg(jsonb_build_object('at', l.created_at, 'stage', l.stage, 'note', l.note) order by l.created_at) from kolaboro_case_log l where l.case_id = c.id), '[]'),
        'messages', coalesce((select jsonb_agg(jsonb_build_object('at', m.created_at, 'admin', m.from_admin, 'body', m.body, 'read', m.read_at is not null) order by m.created_at) from kolaboro_messages m where m.case_id = c.id), '[]')
      ) order by c.created_at desc) from kolaboro_cases c where c.user_id = u.id), '[]')
  ) into r;
  return r;
end $f$;
grant execute on function public.kolaboro_portal(text,text,jsonb) to anon;
