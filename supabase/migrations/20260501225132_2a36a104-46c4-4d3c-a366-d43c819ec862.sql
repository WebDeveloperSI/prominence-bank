-- Fix confirm_transfer_otp: parameter name "_txn" collided with the local
-- row variable "_txn", so "where id = _txn" never matched and the transaction
-- was never found / verified properly. Rename the parameter to "_txn_id".
create or replace function public.confirm_transfer_otp(_txn uuid, _otp_id uuid, _code text)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  _ok  boolean;
  _row public.transactions;
  _txn_id uuid := _txn;
begin
  select * into _row
    from public.transactions
   where id = _txn_id and initiator_id = auth.uid()
   for update;
  if not found then raise exception 'transaction not found'; end if;
  if _row.status <> 'awaiting_otp' then raise exception 'transaction not awaiting otp'; end if;

  select public.verify_otp(_otp_id, _code) into _ok;
  if not _ok then raise exception 'invalid or expired code'; end if;

  update public.transactions set status = 'awaiting_approval'
    where id = _row.id
  returning * into _row;

  insert into public.audit_log(actor_id, actor_role, action, entity, entity_id)
  values (auth.uid(), 'client', 'transfer.otp_confirmed', 'transaction', _row.id);

  return _row;
end $$;