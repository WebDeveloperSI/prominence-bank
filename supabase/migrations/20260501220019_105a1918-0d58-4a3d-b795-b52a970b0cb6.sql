-- Update new-user handler to grant admin role to the demo admin email
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

  -- Demo admin: auto-grant admin role
  if lower(new.email) = 'admin@prominencebank.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;

  insert into public.accounts(owner_id,account_number,nickname,currency,available_cents)
  values
    (new.id, '1100-' || lpad((floor(random()*99999))::text,5,'0') || '-001', 'USD Operating','USD', 1284020122),
    (new.id, '2200-' || lpad((floor(random()*99999))::text,5,'0') || '-002', 'EUR Reserve','EUR',  742019045);
  return new;
end $function$;

-- Promote any existing demo admin user that is missing the admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'admin@prominencebank.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = u.id AND r.role = 'admin'
  );

-- SECURITY DEFINER RPC so the demo admin can self-promote on first login
-- (RLS otherwise blocks the client-side upsert because only existing admins can write user_roles).
CREATE OR REPLACE FUNCTION public.promote_demo_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare _email text;
begin
  if auth.uid() is null then return false; end if;
  select lower(email) into _email from auth.users where id = auth.uid();
  if _email = 'admin@prominencebank.com' then
    insert into public.user_roles(user_id, role) values (auth.uid(), 'admin')
    on conflict do nothing;
    return true;
  end if;
  return false;
end $$;

GRANT EXECUTE ON FUNCTION public.promote_demo_admin() TO authenticated;