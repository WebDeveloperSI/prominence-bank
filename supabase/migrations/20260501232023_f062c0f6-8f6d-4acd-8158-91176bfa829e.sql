-- Enums
do $$ begin
  create type public.loan_status as enum ('pending','approved','rejected','disbursed','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.instrument_status as enum ('pending','active','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open','in_progress','awaiting_client','resolved','closed');
exception when duplicate_object then null; end $$;

-- Add a couple txn kinds for deposit / loan disbursement / hold ops if missing
do $$
declare _exists boolean;
begin
  select exists(select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='txn_kind' and e.enumlabel='loan_disbursement') into _exists;
  if not _exists then alter type public.txn_kind add value 'loan_disbursement'; end if;
end $$;

-- =============== Loans ===============
create table if not exists public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null,
  account_id uuid not null,
  purpose text not null,
  amount_cents bigint not null check (amount_cents > 0),
  term_months int not null check (term_months between 1 and 360),
  interest_rate numeric(5,2) not null default 6.20,
  status public.loan_status not null default 'pending',
  notes text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.loan_applications enable row level security;
drop policy if exists "loan owner read" on public.loan_applications;
create policy "loan owner read" on public.loan_applications for select
  using (applicant_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "loan owner insert" on public.loan_applications;
create policy "loan owner insert" on public.loan_applications for insert
  with check (applicant_id = auth.uid());
drop policy if exists "loan admin update" on public.loan_applications;
create policy "loan admin update" on public.loan_applications for update
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
drop trigger if exists tr_loans_updated on public.loan_applications;
create trigger tr_loans_updated before update on public.loan_applications
  for each row execute function public.tg_set_updated_at();

-- =============== Instruments ===============
create table if not exists public.bank_instruments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('INS-' || lpad((floor(random()*900000)+100000)::text, 6, '0')),
  owner_id uuid not null,
  code text not null,           -- SBLC, BG, MT760, POF, SKR, CD, BF, KTT
  beneficiary text not null,
  face_value_cents bigint not null check (face_value_cents > 0),
  currency text not null default 'USD',
  issue_date date not null default current_date,
  expiry_date date,
  status public.instrument_status not null default 'pending',
  notes text,
  issued_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bank_instruments enable row level security;
drop policy if exists "ins owner read" on public.bank_instruments;
create policy "ins owner read" on public.bank_instruments for select
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "ins admin all" on public.bank_instruments;
create policy "ins admin all" on public.bank_instruments for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
drop trigger if exists tr_ins_updated on public.bank_instruments;
create trigger tr_ins_updated before update on public.bank_instruments
  for each row execute function public.tg_set_updated_at();

-- =============== Support ===============
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('TCK-' || lpad((floor(random()*900000)+100000)::text, 6, '0')),
  owner_id uuid not null,
  subject text not null,
  body text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
drop policy if exists "tk owner read" on public.support_tickets;
create policy "tk owner read" on public.support_tickets for select
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "tk owner insert" on public.support_tickets;
create policy "tk owner insert" on public.support_tickets for insert
  with check (owner_id = auth.uid());
drop policy if exists "tk admin update" on public.support_tickets;
create policy "tk admin update" on public.support_tickets for update
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
drop trigger if exists tr_tk_updated on public.support_tickets;
create trigger tr_tk_updated before update on public.support_tickets
  for each row execute function public.tg_set_updated_at();

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null,
  author_role public.app_role not null default 'client',
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
drop policy if exists "msg read" on public.support_messages;
create policy "msg read" on public.support_messages for select
  using (
    public.has_role(auth.uid(),'admin')
    or exists(select 1 from public.support_tickets t where t.id = ticket_id and t.owner_id = auth.uid())
  );
drop policy if exists "msg insert" on public.support_messages;
create policy "msg insert" on public.support_messages for insert
  with check (
    author_id = auth.uid() and (
      public.has_role(auth.uid(),'admin')
      or exists(select 1 from public.support_tickets t where t.id = ticket_id and t.owner_id = auth.uid())
    )
  );

-- =============== Settings ===============
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.system_settings enable row level security;
drop policy if exists "set read" on public.system_settings;
create policy "set read" on public.system_settings for select
  using (auth.uid() is not null);
drop policy if exists "set admin write" on public.system_settings;
create policy "set admin write" on public.system_settings for all
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

insert into public.system_settings(key,value)
values
  ('per_transaction_limit_cents', to_jsonb(250000000::bigint)),
  ('daily_limit_cents',           to_jsonb(500000000::bigint))
on conflict (key) do nothing;

-- =============== RPCs: deposits / holds (admin) ===============
create or replace function public.admin_credit_account(_account uuid, _amount_cents bigint, _memo text default null)
returns public.transactions language plpgsql security definer set search_path=public as $$
declare _a public.accounts; _t public.transactions;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  if _amount_cents <= 0 then raise exception 'amount must be positive'; end if;
  select * into _a from public.accounts where id = _account for update;
  if not found then raise exception 'account not found'; end if;

  update public.accounts set available_cents = available_cents + _amount_cents where id = _a.id
    returning * into _a;

  insert into public.transactions(kind,status,initiator_id,from_account_id,to_account_id,amount_cents,currency,memo)
  values ('deposit','settled',auth.uid(),_a.id,_a.id,_amount_cents,_a.currency,coalesce(_memo,'Admin deposit'))
  returning * into _t;

  insert into public.ledger_entries(transaction_id,account_id,direction,amount_cents,balance_after_cents)
  values (_t.id,_a.id,'credit',_amount_cents,_a.available_cents);

  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','account.credited','account',_a.id, jsonb_build_object('amount_cents',_amount_cents,'memo',_memo));
  return _t;
end $$;

create or replace function public.admin_place_hold(_account uuid, _amount_cents bigint, _memo text default null)
returns public.accounts language plpgsql security definer set search_path=public as $$
declare _a public.accounts;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  select * into _a from public.accounts where id=_account for update;
  if not found then raise exception 'account not found'; end if;
  if _a.available_cents < _amount_cents then raise exception 'insufficient available funds'; end if;
  update public.accounts
     set available_cents = available_cents - _amount_cents,
         held_cents      = held_cents + _amount_cents
   where id = _a.id returning * into _a;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','account.hold_placed','account',_a.id, jsonb_build_object('amount_cents',_amount_cents,'memo',_memo));
  return _a;
end $$;

create or replace function public.admin_release_hold(_account uuid, _amount_cents bigint, _memo text default null)
returns public.accounts language plpgsql security definer set search_path=public as $$
declare _a public.accounts;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  select * into _a from public.accounts where id=_account for update;
  if not found then raise exception 'account not found'; end if;
  if _a.held_cents < _amount_cents then raise exception 'insufficient held funds'; end if;
  update public.accounts
     set held_cents      = held_cents - _amount_cents,
         available_cents = available_cents + _amount_cents
   where id = _a.id returning * into _a;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','account.hold_released','account',_a.id, jsonb_build_object('amount_cents',_amount_cents,'memo',_memo));
  return _a;
end $$;

-- =============== RPCs: loans ===============
create or replace function public.submit_loan_application(_account uuid, _amount_cents bigint, _term_months int, _purpose text, _rate numeric default 6.20)
returns public.loan_applications language plpgsql security definer set search_path=public as $$
declare _row public.loan_applications;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.loan_applications(applicant_id,account_id,purpose,amount_cents,term_months,interest_rate)
  values (auth.uid(),_account,_purpose,_amount_cents,_term_months,_rate)
  returning * into _row;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'client','loan.submitted','loan_application',_row.id,jsonb_build_object('amount_cents',_amount_cents));
  return _row;
end $$;

create or replace function public.admin_decide_loan(_loan uuid, _approve boolean, _notes text default null)
returns public.loan_applications language plpgsql security definer set search_path=public as $$
declare _row public.loan_applications;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  update public.loan_applications
     set status = case when _approve then 'approved'::loan_status else 'rejected'::loan_status end,
         decided_by = auth.uid(), decided_at = now(), notes = coalesce(_notes,notes)
   where id = _loan and status = 'pending'
  returning * into _row;
  if not found then raise exception 'loan not pending'; end if;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin', case when _approve then 'loan.approved' else 'loan.rejected' end,'loan_application',_row.id,jsonb_build_object('notes',_notes));
  return _row;
end $$;

create or replace function public.admin_disburse_loan(_loan uuid)
returns public.loan_applications language plpgsql security definer set search_path=public as $$
declare _row public.loan_applications; _a public.accounts; _t public.transactions;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  select * into _row from public.loan_applications where id=_loan for update;
  if not found then raise exception 'loan not found'; end if;
  if _row.status <> 'approved' then raise exception 'loan must be approved first'; end if;

  select * into _a from public.accounts where id=_row.account_id for update;
  update public.accounts set available_cents = available_cents + _row.amount_cents where id=_a.id returning * into _a;

  insert into public.transactions(kind,status,initiator_id,from_account_id,to_account_id,amount_cents,currency,memo)
  values ('loan_disbursement','settled',auth.uid(),_a.id,_a.id,_row.amount_cents,_a.currency,'Loan disbursement')
  returning * into _t;
  insert into public.ledger_entries(transaction_id,account_id,direction,amount_cents,balance_after_cents)
  values (_t.id,_a.id,'credit',_row.amount_cents,_a.available_cents);

  update public.loan_applications set status='disbursed' where id=_row.id returning * into _row;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','loan.disbursed','loan_application',_row.id,jsonb_build_object('amount_cents',_row.amount_cents));
  return _row;
end $$;

-- =============== RPCs: instruments ===============
create or replace function public.admin_issue_instrument(
  _owner uuid, _code text, _beneficiary text, _face_value_cents bigint,
  _currency text default 'USD', _expiry date default null, _notes text default null
) returns public.bank_instruments language plpgsql security definer set search_path=public as $$
declare _row public.bank_instruments;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  insert into public.bank_instruments(owner_id,code,beneficiary,face_value_cents,currency,expiry_date,notes,status,issued_by)
  values (_owner,_code,_beneficiary,_face_value_cents,_currency,_expiry,_notes,'active',auth.uid())
  returning * into _row;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','instrument.issued','bank_instrument',_row.id,jsonb_build_object('code',_code,'face_value_cents',_face_value_cents));
  return _row;
end $$;

-- =============== RPCs: support ===============
create or replace function public.submit_support_ticket(_subject text, _body text, _category text default 'general', _priority text default 'normal')
returns public.support_tickets language plpgsql security definer set search_path=public as $$
declare _row public.support_tickets;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.support_tickets(owner_id,subject,body,category,priority)
  values (auth.uid(),_subject,_body,_category,_priority) returning * into _row;
  insert into public.support_messages(ticket_id,author_id,author_role,body)
  values (_row.id,auth.uid(),'client',_body);
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'client','ticket.opened','support_ticket',_row.id,jsonb_build_object('subject',_subject));
  return _row;
end $$;

create or replace function public.post_support_message(_ticket uuid, _body text)
returns public.support_messages language plpgsql security definer set search_path=public as $$
declare _row public.support_messages; _t public.support_tickets; _is_admin boolean;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  _is_admin := public.has_role(auth.uid(),'admin');
  select * into _t from public.support_tickets where id=_ticket;
  if not found then raise exception 'ticket not found'; end if;
  if not _is_admin and _t.owner_id <> auth.uid() then raise exception 'not your ticket'; end if;

  insert into public.support_messages(ticket_id,author_id,author_role,body)
  values (_ticket,auth.uid(), case when _is_admin then 'admin' else 'client' end, _body)
  returning * into _row;

  update public.support_tickets
     set status = case when _is_admin then 'awaiting_client'::ticket_status else 'in_progress'::ticket_status end,
         updated_at = now()
   where id = _ticket;

  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id)
  values (auth.uid(), case when _is_admin then 'admin' else 'client' end, 'ticket.message','support_ticket',_ticket);
  return _row;
end $$;

create or replace function public.admin_update_ticket_status(_ticket uuid, _status public.ticket_status)
returns public.support_tickets language plpgsql security definer set search_path=public as $$
declare _row public.support_tickets;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  update public.support_tickets set status=_status, updated_at=now() where id=_ticket returning * into _row;
  if not found then raise exception 'ticket not found'; end if;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','ticket.status_changed','support_ticket',_row.id,jsonb_build_object('status',_status));
  return _row;
end $$;