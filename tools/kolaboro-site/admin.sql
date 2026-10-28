create or replace function public.kolaboro_event(p_kind text, p_ref text default null, p_page text default null, p_data jsonb default null)
returns text language plpgsql security definer set search_path to 'public' as $f$
declare n int;
begin
  if p_kind not in ('paypal_return','desk_done','desk_error','pay_click','demo_view') then return 'invalid'; end if;
  select count(*) into n from kolaboro_events where created_at > now() - interval '1 hour';
  if n > 2000 then return 'busy'; end if;
  insert into kolaboro_events(kind, ref, page, data) values (p_kind, left(p_ref,300), left(p_page,200), case when pg_column_size(p_data) < 4000 then p_data else null end);
  return 'ok';
end $f$;
grant execute on function public.kolaboro_event(text,text,text,jsonb) to anon;

create or replace function public.kolaboro_admin(p_key text, p_action text default 'all', p_payload jsonb default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $f$
declare ok boolean; r jsonb;
begin
  select encode(sha256(convert_to(coalesce(p_key,''),'UTF8')),'hex') = key_hash into ok from kolaboro_admin_cfg where id = 1;
  if not coalesce(ok,false) then perform pg_sleep(1.5); return jsonb_build_object('error','denied'); end if;
  if p_action = 'add_payment' then
    insert into kolaboro_payments(paid_at,email,name,amount,currency,product,ref,note)
    values (coalesce((p_payload->>'paid_at')::date, current_date), p_payload->>'email', p_payload->>'name', (p_payload->>'amount')::numeric, coalesce(p_payload->>'currency','EUR'), p_payload->>'product', p_payload->>'ref', p_payload->>'note');
    return jsonb_build_object('ok',true);
  elsif p_action = 'del_payment' then
    delete from kolaboro_payments where id = (p_payload->>'id')::bigint; return jsonb_build_object('ok',true);
  elsif p_action = 'set_status' then
    update kolaboro_applications set status = left(p_payload->>'status',30) where id = (p_payload->>'id')::uuid; return jsonb_build_object('ok',true);
  end if;
  select jsonb_build_object(
    'now', now(),
    'leads', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]') from (select id,created_at,name,email,country,phone,who,bring,learn,week,lang,source,status,plan from kolaboro_applications order by created_at desc limit 500) a),
    'events', (select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]') from (select * from kolaboro_events order by created_at desc limit 300) e),
    'payments', (select coalesce(jsonb_agg(to_jsonb(p) order by p.paid_at desc, p.id desc),'[]') from kolaboro_payments p),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d',d,'n',n) order by d),'[]') from (select created_at::date d, count(*) n from kolaboro_applications where created_at > now() - interval '30 days' group by 1) x)
  ) into r;
  return r;
end $f$;
revoke all on function public.kolaboro_admin(text,text,jsonb) from public;
grant execute on function public.kolaboro_admin(text,text,jsonb) to anon;
