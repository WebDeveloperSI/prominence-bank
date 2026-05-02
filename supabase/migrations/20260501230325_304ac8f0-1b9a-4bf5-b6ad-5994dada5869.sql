-- Cancel transfer RPC: releases hold and marks as cancelled
create or replace function public.cancel_transfer(_txn uuid)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare _t public.transactions;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into _t from public.transactions
   where id = _txn
     and (initiator_id = auth.uid() or public.has_role(auth.uid(),'admin'))
   for update;
  if not found then raise exception 'transaction not found'; end if;

  if _t.status not in ('awaiting_otp','awaiting_approval') then
    raise exception 'transaction not cancellable';
  end if;

  update public.accounts
     set held_cents = held_cents - _t.amount_cents,
         available_cents = available_cents + _t.amount_cents
   where id = _t.from_account_id;

  update public.transactions
     set status = 'cancelled', updated_at = now()
   where id = _t.id
  returning * into _t;

  insert into public.audit_log(actor_id, actor_role, action, entity, entity_id)
  values (auth.uid(),
          case when public.has_role(auth.uid(),'admin') then 'admin' else 'client' end,
          'transfer.cancelled', 'transaction', _t.id);

  return _t;
end $$;

-- Clean up the two stuck awaiting_otp rows + release their holds
do $$
declare r record;
begin
  for r in select id, from_account_id, amount_cents
             from public.transactions
            where status = 'awaiting_otp'
              and created_at < now() - interval '5 minutes'
  loop
    update public.accounts
       set held_cents = greatest(held_cents - r.amount_cents, 0),
           available_cents = available_cents + r.amount_cents
     where id = r.from_account_id;
    update public.transactions
       set status = 'cancelled', updated_at = now()
     where id = r.id;
  end loop;
end $$;