
-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('admin','client','operator','auditor');
create type public.account_status as enum ('active','frozen','closed');
create type public.txn_kind as enum ('internal_transfer','external_wire','withdrawal','deposit','fee','adjustment');
create type public.txn_status as enum ('draft','awaiting_otp','awaiting_approval','approved','rejected','settled','failed','cancelled');
create type public.otp_purpose as enum ('login','transfer','sensitive');

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Client',
  tier text not null default 'Tier I · Private',
  rm_name text not null default 'Élise Vaucher',
  phone_masked text not null default '+41 22 707 11 ••',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- =========================================================
-- USER ROLES (separate table, never on profile)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- =========================================================
-- ACCOUNTS
-- =========================================================
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_number text not null unique,
  nickname text not null,
  currency text not null default 'USD',
  status account_status not null default 'active',
  available_cents bigint not null default 0,
  held_cents bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.accounts enable row level security;
create index on public.accounts(owner_id);

-- =========================================================
-- BENEFICIARIES
-- =========================================================
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank_name text not null,
  iban text not null,
  swift text not null,
  country text not null default 'NL',
  created_at timestamptz not null default now()
);
alter table public.beneficiaries enable row level security;
create index on public.beneficiaries(owner_id);

-- =========================================================
-- TRANSACTIONS (transfer requests, maker-checker)
-- =========================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('WIRE-' || lpad((floor(random()*900000)+100000)::text,6,'0')),
  kind txn_kind not null,
  status txn_status not null default 'awaiting_otp',
  initiator_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id),
  to_account_id uuid references public.accounts(id),
  beneficiary_id uuid references public.beneficiaries(id),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'USD',
  memo text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create index on public.transactions(initiator_id);
create index on public.transactions(status);

-- =========================================================
-- LEDGER ENTRIES (double-entry, immutable)
-- =========================================================
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  direction text not null check (direction in ('debit','credit')),
  amount_cents bigint not null check (amount_cents > 0),
  balance_after_cents bigint not null,
  posted_at timestamptz not null default now()
);
alter table public.ledger_entries enable row level security;
create index on public.ledger_entries(account_id, posted_at desc);
create index on public.ledger_entries(transaction_id);

-- =========================================================
-- OTP CHALLENGES
-- =========================================================
create table public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose otp_purpose not null,
  code text not null,
  ref_id uuid,                       -- e.g. transaction id
  consumed boolean not null default false,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);
alter table public.otp_challenges enable row level security;
create index on public.otp_challenges(user_id, purpose);

-- =========================================================
-- AUDIT LOG
-- =========================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role app_role,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index on public.audit_log(created_at desc);

-- =========================================================
-- updated_at trigger helper
-- =========================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_txn_updated_at before update on public.transactions
for each row execute function public.tg_set_updated_at();

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
create policy "profiles self read" on public.profiles
for select using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "profiles self update" on public.profiles
for update using (auth.uid() = id);
create policy "profiles admin all" on public.profiles
for all using (public.has_role(auth.uid(),'admin'))
with check (public.has_role(auth.uid(),'admin'));

-- user_roles (read own; admin all). No client-side insert allowed.
create policy "roles self read" on public.user_roles
for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "roles admin manage" on public.user_roles
for all using (public.has_role(auth.uid(),'admin'))
with check (public.has_role(auth.uid(),'admin'));

-- accounts
create policy "accounts owner read" on public.accounts
for select using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "accounts admin manage" on public.accounts
for all using (public.has_role(auth.uid(),'admin'))
with check (public.has_role(auth.uid(),'admin'));

-- beneficiaries (full CRUD by owner)
create policy "ben owner all" on public.beneficiaries
for all using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- transactions
create policy "txn owner read" on public.transactions
for select using (initiator_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "txn owner insert" on public.transactions
for insert with check (initiator_id = auth.uid());
create policy "txn admin update" on public.transactions
for update using (public.has_role(auth.uid(),'admin'))
with check (public.has_role(auth.uid(),'admin'));
-- owners may cancel their own awaiting_* txn
create policy "txn owner cancel" on public.transactions
for update using (initiator_id = auth.uid() and status in ('awaiting_otp','awaiting_approval'))
with check (initiator_id = auth.uid());

-- ledger entries: read via own account or admin; insert only via SECURITY DEFINER
create policy "ledger read" on public.ledger_entries
for select using (
  public.has_role(auth.uid(),'admin')
  or exists (select 1 from public.accounts a where a.id = ledger_entries.account_id and a.owner_id = auth.uid())
);

-- otp: only the user
create policy "otp self all" on public.otp_challenges
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit
create policy "audit admin read" on public.audit_log
for select using (public.has_role(auth.uid(),'admin'));
create policy "audit self read" on public.audit_log
for select using (actor_id = auth.uid());

-- =========================================================
-- BUSINESS LOGIC FUNCTIONS
-- =========================================================

-- generate OTP (returns the code so demo can show it; in real prod it would be emailed)
create or replace function public.issue_otp(_purpose otp_purpose, _ref uuid default null)
returns table (id uuid, code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare _code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  _code := lpad((floor(random()*1000000))::text, 6, '0');
  return query
  insert into public.otp_challenges(user_id, purpose, code, ref_id)
  values (auth.uid(), _purpose, _code, _ref)
  returning otp_challenges.id, otp_challenges.code, otp_challenges.expires_at;
end $$;

-- verify OTP
create or replace function public.verify_otp(_id uuid, _code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare _ok boolean;
begin
  update public.otp_challenges
     set consumed = true
   where id = _id and user_id = auth.uid()
     and code = _code and not consumed and expires_at > now()
  returning true into _ok;
  return coalesce(_ok,false);
end $$;

-- submit transfer: creates txn (awaiting_otp), holds funds
create or replace function public.submit_transfer(
  _from_account uuid, _kind txn_kind, _amount_cents bigint,
  _to_account uuid default null, _beneficiary uuid default null, _memo text default null
) returns public.transactions
language plpgsql security definer set search_path = public as $$
declare _from public.accounts; _txn public.transactions;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into _from from public.accounts where id = _from_account and owner_id = auth.uid() for update;
  if not found then raise exception 'source account not found'; end if;
  if _from.available_cents < _amount_cents then raise exception 'insufficient funds'; end if;

  update public.accounts
     set available_cents = available_cents - _amount_cents,
         held_cents      = held_cents + _amount_cents
   where id = _from.id;

  insert into public.transactions(kind,status,initiator_id,from_account_id,to_account_id,beneficiary_id,amount_cents,currency,memo)
  values (_kind,'awaiting_otp',auth.uid(),_from.id,_to_account,_beneficiary,_amount_cents,_from.currency,_memo)
  returning * into _txn;

  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'client','transfer.submitted','transaction',_txn.id,
          jsonb_build_object('amount_cents',_amount_cents,'kind',_kind));
  return _txn;
end $$;

-- confirm OTP for a transfer -> moves to awaiting_approval (or settles internal)
create or replace function public.confirm_transfer_otp(_txn uuid, _otp_id uuid, _code text)
returns public.transactions
language plpgsql security definer set search_path = public as $$
declare _ok boolean; _txn public.transactions;
begin
  select * into _txn from public.transactions where id = _txn and initiator_id = auth.uid() for update;
  if not found then raise exception 'transaction not found'; end if;
  if _txn.status <> 'awaiting_otp' then raise exception 'transaction not awaiting otp'; end if;

  select public.verify_otp(_otp_id, _code) into _ok;
  if not _ok then raise exception 'invalid or expired code'; end if;

  update public.transactions set status = 'awaiting_approval' where id = _txn.id returning * into _txn;
  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id)
  values (auth.uid(),'client','transfer.otp_confirmed','transaction',_txn.id);
  return _txn;
end $$;

-- ADMIN: approve transfer -> post double-entry ledger and settle
create or replace function public.approve_transfer(_txn uuid)
returns public.transactions
language plpgsql security definer set search_path = public as $$
declare _t public.transactions; _from public.accounts; _to public.accounts;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  select * into _t from public.transactions where id = _txn for update;
  if not found then raise exception 'txn not found'; end if;
  if _t.status <> 'awaiting_approval' then raise exception 'not awaiting approval'; end if;

  select * into _from from public.accounts where id = _t.from_account_id for update;
  -- Release hold and debit
  update public.accounts
     set held_cents = held_cents - _t.amount_cents
   where id = _from.id
  returning * into _from;

  insert into public.ledger_entries(transaction_id,account_id,direction,amount_cents,balance_after_cents)
  values (_t.id, _from.id, 'debit', _t.amount_cents, _from.available_cents);

  -- Internal? credit the destination
  if _t.kind = 'internal_transfer' and _t.to_account_id is not null then
    update public.accounts
       set available_cents = available_cents + _t.amount_cents
     where id = _t.to_account_id
    returning * into _to;
    insert into public.ledger_entries(transaction_id,account_id,direction,amount_cents,balance_after_cents)
    values (_t.id, _to.id, 'credit', _t.amount_cents, _to.available_cents);
  end if;

  update public.transactions
     set status='settled', approved_by = auth.uid(), approved_at = now()
   where id = _t.id
  returning * into _t;

  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','transfer.approved','transaction',_t.id,
          jsonb_build_object('amount_cents',_t.amount_cents));
  return _t;
end $$;

-- ADMIN: reject -> release hold, return funds
create or replace function public.reject_transfer(_txn uuid, _reason text)
returns public.transactions
language plpgsql security definer set search_path = public as $$
declare _t public.transactions;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'admin only'; end if;
  select * into _t from public.transactions where id = _txn for update;
  if _t.status not in ('awaiting_approval','awaiting_otp') then raise exception 'not rejectable'; end if;

  update public.accounts
     set held_cents = held_cents - _t.amount_cents,
         available_cents = available_cents + _t.amount_cents
   where id = _t.from_account_id;

  update public.transactions
     set status='rejected', approved_by = auth.uid(), approved_at = now(), rejected_reason = _reason
   where id = _t.id
  returning * into _t;

  insert into public.audit_log(actor_id,actor_role,action,entity,entity_id,meta)
  values (auth.uid(),'admin','transfer.rejected','transaction',_t.id, jsonb_build_object('reason',_reason));
  return _t;
end $$;

-- =========================================================
-- AUTO-PROVISION new users: profile + client role + 2 accounts
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _full text;
begin
  _full := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
  insert into public.profiles(id, full_name) values (new.id, _full)
  on conflict (id) do nothing;

  insert into public.user_roles(user_id, role) values (new.id, 'client')
  on conflict do nothing;

  insert into public.accounts(owner_id,account_number,nickname,currency,available_cents)
  values
    (new.id, '1100-' || lpad((floor(random()*99999))::text,5,'0') || '-001', 'USD Operating','USD', 1284020122),
    (new.id, '2200-' || lpad((floor(random()*99999))::text,5,'0') || '-002', 'EUR Reserve','EUR',  742019045);
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- realtime
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.accounts;
alter publication supabase_realtime add table public.audit_log;
