-- ============================================================================
-- ALI MOBILE - STEP 1: PASTE THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard → SQL Editor → New query → Paste → Run
-- ============================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'agent',
    city TEXT DEFAULT 'Bukavu',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_role_check;
ALTER TABLE public.agents ADD CONSTRAINT agents_role_check
    CHECK (role IN ('admin', 'agent', 'operator'));
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.smartphones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    value_usd NUMERIC NOT NULL,
    imei TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.smartphones ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_name TEXT NOT NULL,
    middle_name TEXT,
    first_name TEXT NOT NULL,
    phone_whatsapp TEXT NOT NULL,
    phone_urgency TEXT NOT NULL,
    address_num TEXT NOT NULL,
    address_avenue TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    city_commune TEXT NOT NULL,
    identity_doc_type TEXT NOT NULL,
    identity_doc_num TEXT NOT NULL,
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    identity_card_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    smartphone_id UUID NOT NULL REFERENCES public.smartphones(id) ON DELETE RESTRICT,
    subscription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('hebdo', 'mensuel')),
    initial_deposit_usd NUMERIC NOT NULL,
    installment_amount_usd NUMERIC NOT NULL,
    total_installments INTEGER NOT NULL,
    payment_day TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine', 'en_retard', 'bloque')),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL REFERENCES public.contracts(contract_number) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount_usd NUMERIC NOT NULL,
    amount_cdf NUMERIC NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Terminé' CHECK (status IN ('Terminé', 'Échec', 'En attente')),
    transaction_ref TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.delay_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL REFERENCES public.contracts(contract_number) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount_usd NUMERIC NOT NULL,
    days_overdue INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Résolu')),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.delay_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('dépôt', 'retrait')),
    phone_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
    operator TEXT NOT NULL CHECK (operator IN ('Airtel', 'Vodacom', 'Voda-e')),
    operator_transaction_number TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    operator_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "agents_select" ON public.agents;
DROP POLICY IF EXISTS "agents_all_admin" ON public.agents;
DROP POLICY IF EXISTS "agents_update_self" ON public.agents;
CREATE POLICY "agents_select" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents_all_admin" ON public.agents FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "agents_update_self" ON public.agents FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "smartphones_select" ON public.smartphones;
DROP POLICY IF EXISTS "smartphones_all_admin" ON public.smartphones;
CREATE POLICY "smartphones_select" ON public.smartphones FOR SELECT TO authenticated USING (true);
CREATE POLICY "smartphones_all_admin" ON public.smartphones FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_all" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_all" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
DROP POLICY IF EXISTS "contracts_all" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_all" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_all" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delay_records_select" ON public.delay_records;
DROP POLICY IF EXISTS "delay_records_all" ON public.delay_records;
CREATE POLICY "delay_records_select" ON public.delay_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "delay_records_all" ON public.delay_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.agents WHERE id = auth.uid() AND role IN ('admin', 'operator')));

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_agent()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agents (id, name, email, phone, code, role, city)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Agent'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'code', 'AG-NEW'),
    COALESCE(new.raw_user_meta_data->>'role', 'agent'),
    COALESCE(new.raw_user_meta_data->>'city', 'Bukavu')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agent();

CREATE OR REPLACE FUNCTION public.delete_agent_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete own account.'; END IF;
  DELETE FROM public.agents WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_agent_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')), updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_user_password_by_email(target_email TEXT, new_password TEXT)
RETURNS VOID AS $$
DECLARE matched_user_id UUID;
BEGIN
  target_email := lower(trim(target_email));
  IF length(new_password) < 6 THEN RAISE EXCEPTION 'Password too short.'; END IF;
  SELECT id INTO matched_user_id FROM auth.users WHERE lower(email) = target_email LIMIT 1;
  IF matched_user_id IS NULL THEN RAISE EXCEPTION 'User not found: %', target_email; END IF;
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = matched_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_agent_user(
  email TEXT, password TEXT, name TEXT, phone TEXT, code TEXT, role TEXT, city TEXT DEFAULT 'Bukavu'
) RETURNS UUID AS $$
DECLARE new_user_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    email, crypt(password, gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', name, 'role', role, 'code', code, 'phone', phone, 'city', city),
    now(), now(), '', '', '', ''
  ) RETURNING id INTO new_user_id;
  INSERT INTO public.agents (id, name, email, phone, code, role, city)
  VALUES (new_user_id, name, email, phone, code, role, city)
  ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone,
    code=EXCLUDED.code, role=EXCLUDED.role, city=EXCLUDED.city;
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_user_password_by_email(TEXT, TEXT) TO anon, authenticated, service_role;

-- ─── CREATE ADMIN USERS ───────────────────────────────────────────────────────
-- Creates all 5 staff accounts directly in auth.users + public.agents

DO $$
DECLARE
  uid1 UUID := gen_random_uuid();
  uid2 UUID := gen_random_uuid();
  uid3 UUID := gen_random_uuid();
  uid4 UUID := gen_random_uuid();
  uid5 UUID := gen_random_uuid();
BEGIN

  -- 1. Franck Alliance (Director / Admin)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'franck.alliance@alimobile.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', uid1, 'authenticated', 'authenticated',
      'franck.alliance@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"Franck Alliance","role":"admin","code":"DIR-243-01","phone":"+243824444298","city":"Bukavu"}',
      now(), now(), '', '', '', '');
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid1, 'Franck Alliance', 'franck.alliance@alimobile.com', '+243824444298', 'DIR-243-01', 'admin', 'Bukavu')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- 2. Joelle Mihigo (Admin)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joelle.mihigo@alimobile.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', uid2, 'authenticated', 'authenticated',
      'joelle.mihigo@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"JOELLE MIHIGO EMMANUELA","role":"admin","code":"AD-243-03","phone":"+243824444203","city":"Bukavu"}',
      now(), now(), '', '', '', '');
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid2, 'JOELLE MIHIGO EMMANUELA', 'joelle.mihigo@alimobile.com', '+243824444203', 'AD-243-03', 'admin', 'Bukavu')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- 3. John Nsaraza (Agent)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'john.nsaraza@alimobile.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', uid3, 'authenticated', 'authenticated',
      'john.nsaraza@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"JOHN NSARAZA","role":"agent","code":"AG-243-02","phone":"+243824444202","city":"Bukavu"}',
      now(), now(), '', '', '', '');
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid3, 'JOHN NSARAZA', 'john.nsaraza@alimobile.com', '+243824444202', 'AG-243-02', 'agent', 'Bukavu')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- 4. Mugisho Byamungu (Agent)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mugisho.byamungu@alimobile.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', uid4, 'authenticated', 'authenticated',
      'mugisho.byamungu@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"MUGISHO BYAMUNGU ROMUEL","role":"agent","code":"AG-243-04","phone":"+243824444204","city":"Bukavu"}',
      now(), now(), '', '', '', '');
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid4, 'MUGISHO BYAMUNGU ROMUEL', 'mugisho.byamungu@alimobile.com', '+243824444204', 'AG-243-04', 'agent', 'Bukavu')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- 5. Blesing Kadesi (Operator)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'blesing.kadesi@alimobile.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', uid5, 'authenticated', 'authenticated',
      'blesing.kadesi@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"BLESING KADESI","role":"operator","code":"OP-243-08","phone":"+243824444208","city":"Bukavu"}',
      now(), now(), '', '', '', '');
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid5, 'BLESING KADESI', 'blesing.kadesi@alimobile.com', '+243824444208', 'OP-243-08', 'operator', 'Bukavu')
    ON CONFLICT (email) DO NOTHING;
  END IF;

END $$;

-- Verify everything was created
SELECT name, email, code, role, city FROM public.agents ORDER BY created_at;
