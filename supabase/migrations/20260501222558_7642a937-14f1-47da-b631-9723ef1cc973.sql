
-- Extend handle_new_user to seed two demo beneficiaries
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _full text;
begin
  _full := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
  insert into public.profiles(id, full_name) values (new.id, _full)
  on conflict (id) do nothing;

  insert into public.user_roles(user_id, role) values (new.id, 'client')
  on conflict do nothing;

  if lower(new.email) = 'admin@prominencebank.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;

  insert into public.accounts(owner_id,account_number,nickname,currency,available_cents)
  values
    (new.id, '1100-' || lpad((floor(random()*99999))::text,5,'0') || '-001', 'USD Operating','USD', 1284020122),
    (new.id, '2200-' || lpad((floor(random()*99999))::text,5,'0') || '-002', 'EUR Reserve','EUR',  742019045);

  -- Seed demo beneficiaries so transfer flow works immediately
  insert into public.beneficiaries(owner_id, name, bank_name, iban, swift, country) values
    (new.id, 'Trade Partners B.V.',   'ING Bank N.V.', 'NL91ABNA0417164300',      'INGBNL2A',    'NL'),
    (new.id, 'Sterling & Crowe LLP',  'HSBC UK',       'GB29NWBK60161331926819',  'HBUKGB4B',    'GB'),
    (new.id, 'Helvetia Maison SA',    'UBS Switzerland','CH5600235235923480001',  'UBSWCHZH80A', 'CH');
  return new;
end $function$;

-- Back-fill for existing users with no beneficiaries
INSERT INTO public.beneficiaries(owner_id, name, bank_name, iban, swift, country)
SELECT u.id, x.name, x.bank_name, x.iban, x.swift, x.country
FROM auth.users u
CROSS JOIN (VALUES
  ('Trade Partners B.V.',  'ING Bank N.V.',  'NL91ABNA0417164300',     'INGBNL2A',    'NL'),
  ('Sterling & Crowe LLP', 'HSBC UK',        'GB29NWBK60161331926819', 'HBUKGB4B',    'GB'),
  ('Helvetia Maison SA',   'UBS Switzerland','CH5600235235923480001',  'UBSWCHZH80A', 'CH')
) AS x(name, bank_name, iban, swift, country)
WHERE NOT EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.owner_id = u.id);
