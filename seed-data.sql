-- ============================================================================
-- ALI MOBILE — SEED DATA SCRIPT (users + sample data)
-- ============================================================================
-- Paste this entire script in the Supabase SQL Editor and click Run.
-- Dashboard → SQL Editor → New query → paste → Run
--
-- PREREQUISITE: Run setup-step1-schema-and-users.sql first (creates tables,
--               RLS policies, functions, triggers).
--
-- This script is IDEMPOTENT: safe to run multiple times.
-- It seeds: 5 staff users, 5 smartphones, 4 clients, 4 contracts,
--           22 payments, 1 delay record, 10 utility transactions.
-- ============================================================================

-- 0. Confirm all existing auth users' emails (fixes "Email not confirmed" error)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 1. Create / ensure all 5 real staff accounts
DO $$
DECLARE
  uid UUID;
BEGIN
  -- ─── 1. Franck Alliance (Director / Admin) ──────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'franck.alliance@alimobile.com') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'franck.alliance@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Franck Alliance","role":"admin","code":"DIR-243-01","phone":"+243824444298","city":"Bukavu"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid, 'Franck Alliance', 'franck.alliance@alimobile.com', '+243824444298', 'DIR-243-01', 'admin', 'Bukavu')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ─── 2. Joelle Mihigo (Admin) ────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joelle.mihigo@alimobile.com') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'joelle.mihigo@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"JOELLE MIHIGO EMMANUELA","role":"admin","code":"AD-243-03","phone":"+243824444203","city":"Bukavu"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid, 'JOELLE MIHIGO EMMANUELA', 'joelle.mihigo@alimobile.com', '+243824444203', 'AD-243-03', 'admin', 'Bukavu')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ─── 3. John Nsaraza (Agent) ─────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'john.nsaraza@alimobile.com') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'john.nsaraza@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"JOHN NSARAZA","role":"agent","code":"AG-243-02","phone":"+243824444202","city":"Bukavu"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid, 'JOHN NSARAZA', 'john.nsaraza@alimobile.com', '+243824444202', 'AG-243-02', 'agent', 'Bukavu')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ─── 4. Mugisho Byamungu (Agent) ─────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mugisho.byamungu@alimobile.com') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'mugisho.byamungu@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"MUGISHO BYAMUNGU ROMUEL","role":"agent","code":"AG-243-04","phone":"+243824444204","city":"Bukavu"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid, 'MUGISHO BYAMUNGU ROMUEL', 'mugisho.byamungu@alimobile.com', '+243824444204', 'AG-243-04', 'agent', 'Bukavu')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ─── 5. Blesing Kadesi (Operator) ────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'blesing.kadesi@alimobile.com') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'blesing.kadesi@alimobile.com', crypt('AliMobile2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"BLESING KADESI","role":"operator","code":"OP-243-08","phone":"+243824444208","city":"Bukavu"}',
      now(), now(), '', '', '', ''
    );
    INSERT INTO public.agents (id, name, email, phone, code, role, city)
    VALUES (uid, 'BLESING KADESI', 'blesing.kadesi@alimobile.com', '+243824444208', 'OP-243-08', 'operator', 'Bukavu')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Also confirm the new users' emails right away
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email_confirmed_at IS NULL;

-- Quick check: list all agents
SELECT '--- AGENTS ---' as info;
SELECT name, email, code, role, city FROM public.agents ORDER BY created_at;

-- 2. Seed Smartphones (5)
INSERT INTO public.smartphones (brand, model, value_usd, imei) VALUES
  ('Samsung', 'Galaxy A15',       180, '354892110298374'),
  ('Samsung', 'Galaxy A25 5G',    260, '356711220498321'),
  ('Samsung', 'Galaxy A35 5G',    340, '358901110587213'),
  ('Samsung', 'Galaxy A55 5G',    450, '359012340123456'),
  ('Samsung', 'Galaxy S24 FE',    680, '357123990887221')
ON CONFLICT (imei) DO NOTHING;

-- 3. Seed Clients, Contracts, Payments, Delays, Transactions
--    Grabs the real agent UUIDs by code for proper FK relationships
DO $$
DECLARE
  -- Agent UUIDs (looked up by code)
  a_franck  UUID;  -- DIR-243-01  (admin)
  a_joelle  UUID;  -- AD-243-03   (admin)
  a_john    UUID;  -- AG-243-02   (agent)
  a_mugisho UUID;  -- AG-243-04   (agent)
  a_blesing UUID;  -- OP-243-08   (operator)
  -- Smartphone UUIDs (by IMEI)
  p1 UUID; p2 UUID; p3 UUID;
  -- Client UUIDs (inserted)
  c1 UUID; c2 UUID; c3 UUID; c4 UUID;
  -- Helper
  existing_client UUID;
BEGIN
  -- ─── Grab agent UUIDs by code ───────────────────────────────────────
  SELECT id INTO a_franck  FROM public.agents WHERE code = 'DIR-243-01' LIMIT 1;
  SELECT id INTO a_joelle  FROM public.agents WHERE code = 'AD-243-03'  LIMIT 1;
  SELECT id INTO a_john    FROM public.agents WHERE code = 'AG-243-02'  LIMIT 1;
  SELECT id INTO a_mugisho FROM public.agents WHERE code = 'AG-243-04'  LIMIT 1;
  SELECT id INTO a_blesing FROM public.agents WHERE code = 'OP-243-08'  LIMIT 1;
  -- Fallbacks
  IF a_franck  IS NULL THEN SELECT id INTO a_franck  FROM public.agents ORDER BY created_at LIMIT 1; END IF;
  IF a_joelle  IS NULL THEN a_joelle  := a_franck;  END IF;
  IF a_john    IS NULL THEN a_john    := a_franck;  END IF;
  IF a_mugisho IS NULL THEN a_mugisho := a_franck;  END IF;
  IF a_blesing IS NULL THEN a_blesing := a_franck;  END IF;

  -- ─── Grab smartphone UUIDs by IMEI ──────────────────────────────────
  SELECT id INTO p1 FROM public.smartphones WHERE imei = '354892110298374';
  SELECT id INTO p2 FROM public.smartphones WHERE imei = '356711220498321';
  SELECT id INTO p3 FROM public.smartphones WHERE imei = '358901110587213';

  -- ─── Insert Client 1: Samuel Kakule (agent: Franck) ──────────────────
  SELECT id INTO existing_client FROM public.clients
    WHERE last_name = 'Kakule' AND first_name = 'Samuel' LIMIT 1;
  IF existing_client IS NULL THEN
    INSERT INTO public.clients (
      last_name, middle_name, first_name, phone_whatsapp, phone_urgency,
      address_num, address_avenue, neighborhood, city_commune,
      identity_doc_type, identity_doc_num, registered_at, agent_id
    ) VALUES (
      'Kakule', 'Kasaki', 'Samuel', '+243 997 123 456', '+243 812 345 678',
      '17', 'des Écoles', 'Bukavu', 'Bukavu',
      'Carte d''électeur', 'ELEC-243-98765-A', '2026-06-08', a_franck
    ) RETURNING id INTO c1;
  ELSE c1 := existing_client; END IF;

  -- ─── Insert Client 2: Archange Mwanza (agent: Franck) ────────────────
  SELECT id INTO existing_client FROM public.clients
    WHERE last_name = 'Mwanza' AND first_name = 'Archange' LIMIT 1;
  IF existing_client IS NULL THEN
    INSERT INTO public.clients (
      last_name, middle_name, first_name, phone_whatsapp, phone_urgency,
      address_num, address_avenue, neighborhood, city_commune,
      identity_doc_type, identity_doc_num, registered_at, agent_id
    ) VALUES (
      'Mwanza', 'Mulumba', 'Archange', '+243 971 888 222', '+243 854 333 111',
      '45', 'du Lac', 'Himbi', 'Bukavu',
      'Passeport', 'OP-0089122', '2026-05-02', a_franck
    ) RETURNING id INTO c2;
  ELSE c2 := existing_client; END IF;

  -- ─── Insert Client 3: Aline Kavuo (agent: John) ──────────────────────
  SELECT id INTO existing_client FROM public.clients
    WHERE last_name = 'Kavuo' AND first_name = 'Aline' LIMIT 1;
  IF existing_client IS NULL THEN
    INSERT INTO public.clients (
      last_name, middle_name, first_name, phone_whatsapp, phone_urgency,
      address_num, address_avenue, neighborhood, city_commune,
      identity_doc_type, identity_doc_num, registered_at, agent_id
    ) VALUES (
      'Kavuo', 'Meso', 'Aline', '+243 994 555 666', '+243 821 777 888',
      '102', 'de la Révolution', 'Katindo', 'Bukavu',
      'Carte d''électeur', 'ELEC-243-55122-C', '2026-07-10', a_john
    ) RETURNING id INTO c3;
  ELSE c3 := existing_client; END IF;

  -- ─── Insert Client 4: Trésor Amisi (agent: Mugisho) ──────────────────
  SELECT id INTO existing_client FROM public.clients
    WHERE last_name = 'Amisi' AND first_name = 'Trésor' LIMIT 1;
  IF existing_client IS NULL THEN
    INSERT INTO public.clients (
      last_name, middle_name, first_name, phone_whatsapp, phone_urgency,
      address_num, address_avenue, neighborhood, city_commune,
      identity_doc_type, identity_doc_num, registered_at, agent_id
    ) VALUES (
      'Amisi', 'Ramazani', 'Trésor', '+243 991 222 333', '+243 899 444 555',
      '8B', 'Kanyamuhanga', 'Les Volcans', 'Bukavu',
      'Permis de conduire', 'PERM-243-00912', '2026-05-15', a_mugisho
    ) RETURNING id INTO c4;
  ELSE c4 := existing_client; END IF;

  -- ─── Insert Contracts (4) ────────────────────────────────────────────
  -- C1, C2 → Franck (admin) | C3 → John (agent) | C4 → Mugisho (agent)
  INSERT INTO public.contracts (
    contract_number, client_id, smartphone_id, subscription_date,
    plan_type, initial_deposit_usd, installment_amount_usd,
    total_installments, payment_day, status, agent_id
  ) VALUES
    ('AM-2026-001', c1, p3, '2026-06-08', 'hebdo',   170, 21.25, 8, 'Samedi', 'en_cours', a_franck),
    ('AM-2026-002', c2, p2, '2026-05-02', 'mensuel', 130, 65,    2, '02',     'bloque',   a_franck),
    ('AM-2026-003', c3, p1, '2026-07-10', 'hebdo',    90, 11.25, 8, 'Samedi', 'en_cours', a_john),
    ('AM-2026-004', c4, p1, '2026-05-15', 'hebdo',    90, 11.25, 8, 'Samedi', 'termine',  a_mugisho)
  ON CONFLICT (contract_number) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    smartphone_id = EXCLUDED.smartphone_id,
    status = EXCLUDED.status,
    initial_deposit_usd = EXCLUDED.initial_deposit_usd,
    installment_amount_usd = EXCLUDED.installment_amount_usd;

  -- ─── Insert Payments (22) ────────────────────────────────────────────
  -- Contract 1: Samuel Kakule — deposit + 6 installments + 1 failed (agent: Franck)
  INSERT INTO public.payments (contract_number, client_id, amount_usd, amount_cdf, date, due_date, payment_method, status, transaction_ref, agent_id) VALUES
    ('AM-2026-001', c1, 170,   170   * 2800, '2026-06-08T10:30:00', '2026-06-08', 'Mobile Money (M-Pesa)',      'Terminé', 'MP-TRX-882910-A', a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-06-13T16:15:00', '2026-06-13', 'Mobile Money (M-Pesa)',      'Terminé', 'MP-TRX-893012-C', a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-06-20T11:00:00', '2026-06-20', 'Mobile Money (Airtel Money)', 'Terminé', 'AM-TRX-102931-F', a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-06-27T09:45:00', '2026-06-27', 'Mobile Money (M-Pesa)',      'Terminé', 'MP-TRX-912834-K', a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-07-04T18:30:00', '2026-07-04', 'Mobile Money (M-Pesa)',      'Terminé', 'MP-TRX-922904-L', a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-07-11T14:20:00', '2026-07-11', 'Espèces',                    'Terminé', 'CASH-2026-0129',  a_franck),
    ('AM-2026-001', c1, 21.25, 21.25 * 2800, '2026-07-17T08:12:00', '2026-07-18', 'Mobile Money (M-Pesa)',      'Échec',   'MP-TRX-955122-E', a_franck)
  ON CONFLICT (transaction_ref) DO NOTHING;

  -- Contract 2: Archange Mwanza — deposit + 1 installment + 1 failed (agent: Franck)
  INSERT INTO public.payments (contract_number, client_id, amount_usd, amount_cdf, date, due_date, payment_method, status, transaction_ref, agent_id) VALUES
    ('AM-2026-002', c2, 130, 130 * 2800, '2026-05-02T14:00:00', '2026-05-02', 'Mobile Money (Orange Money)', 'Terminé', 'OM-TRX-331209-X', a_franck),
    ('AM-2026-002', c2, 65,  65  * 2800, '2026-06-02T11:45:00', '2026-06-02', 'Mobile Money (Orange Money)', 'Terminé', 'OM-TRX-341901-Z', a_franck),
    ('AM-2026-002', c2, 65,  65  * 2800, '2026-07-03T09:00:00', '2026-07-02', 'Mobile Money (Orange Money)', 'Échec',   'OM-TRX-359902-W', a_franck)
  ON CONFLICT (transaction_ref) DO NOTHING;

  -- Contract 3: Aline Kavuo — deposit only (agent: John)
  INSERT INTO public.payments (contract_number, client_id, amount_usd, amount_cdf, date, due_date, payment_method, status, transaction_ref, agent_id) VALUES
    ('AM-2026-003', c3, 90, 90 * 2800, '2026-07-10T15:30:00', '2026-07-10', 'Mobile Money (M-Pesa)', 'Terminé', 'MP-TRX-948123-U', a_john)
  ON CONFLICT (transaction_ref) DO NOTHING;

  -- Contract 4: Trésor Amisi — fully paid: deposit + 8 installments (agent: Mugisho)
  INSERT INTO public.payments (contract_number, client_id, amount_usd, amount_cdf, date, due_date, payment_method, status, transaction_ref, agent_id) VALUES
    ('AM-2026-004', c4, 90,    90    * 2800, '2026-05-15T11:00:00', '2026-05-15', 'Espèces', 'Terminé', 'CASH-2026-0055', a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-05-22T14:30:00', '2026-05-22', 'Espèces', 'Terminé', 'CASH-402',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-05-29T10:15:00', '2026-05-29', 'Espèces', 'Terminé', 'CASH-403',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-06-05T16:00:00', '2026-06-05', 'Espèces', 'Terminé', 'CASH-404',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-06-12T12:00:00', '2026-06-12', 'Espèces', 'Terminé', 'CASH-405',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-06-19T09:30:00', '2026-06-19', 'Espèces', 'Terminé', 'CASH-406',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-06-26T15:10:00', '2026-06-26', 'Espèces', 'Terminé', 'CASH-407',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-07-03T11:00:00', '2026-07-03', 'Espèces', 'Terminé', 'CASH-408',      a_mugisho),
    ('AM-2026-004', c4, 11.25, 11.25 * 2800, '2026-07-10T10:00:00', '2026-07-10', 'Espèces', 'Terminé', 'CASH-409',      a_mugisho)
  ON CONFLICT (transaction_ref) DO NOTHING;

  -- ─── Insert Delay Records (1) ────────────────────────────────────────
  INSERT INTO public.delay_records (contract_number, client_id, due_date, amount_usd, days_overdue, status)
  SELECT 'AM-2026-002', c2, '2026-07-02', 65, 16, 'Actif'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.delay_records WHERE contract_number = 'AM-2026-002' AND status = 'Actif'
  );

  -- ─── Insert Utility Transactions (10) (operator: Blesing) ───────────
  -- No unique constraint on reference_number, so guard with NOT EXISTS
  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Samuel Kakule','dépôt','+243997123456',25,'USD','Airtel','AIR-2026-001','AM-TRX-001','Dépôt Mobile Money',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-001');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Aline Kavuo','retrait','+243994555666',15000,'CDF','Vodacom','VOD-2026-002','AM-TRX-002','Retrait M-Pesa',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-002');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Archange Mwanza','dépôt','+243971888222',50,'USD','Voda-e','VDE-2026-003','AM-TRX-003','Dépôt Voda-e',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-003');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Trésor Amisi','retrait','+243991222333',30,'USD','Airtel','AIR-2026-004','AM-TRX-004','Retrait Airtel Money',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-004');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Client Passant','dépôt','+243815000111',5000,'CDF','Vodacom','VOD-2026-005','AM-TRX-005','Dépôt M-Pesa',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-005');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Client Passant','retrait','+243815000222',10000,'CDF','Airtel','AIR-2026-006','AM-TRX-006','Retrait Airtel',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-006');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Samuel Kakule','dépôt','+243997123456',15,'USD','Voda-e','VDE-2026-007','AM-TRX-007','Dépôt Voda-e',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-007');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Aline Kavuo','dépôt','+243994555666',20000,'CDF','Vodacom','VOD-2026-008','AM-TRX-008','Dépôt M-Pesa',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-008');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Client Passant','retrait','+243820000333',45,'USD','Voda-e','VDE-2026-009','AM-TRX-009','Retrait Voda-e',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-009');

  INSERT INTO public.transactions (client_name, transaction_type, phone_number, amount, currency, operator, operator_transaction_number, reference_number, reason, operator_id)
  SELECT 'Archange Mwanza','dépôt','+243971888222',8000,'CDF','Airtel','AIR-2026-010','AM-TRX-010','Dépôt Airtel',a_blesing
  WHERE NOT EXISTS (SELECT 1 FROM public.transactions WHERE reference_number = 'AM-TRX-010');

END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 'smartphones' as table_name, count(*) as rows FROM public.smartphones
UNION ALL SELECT 'agents', count(*) FROM public.agents
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'contracts', count(*) FROM public.contracts
UNION ALL SELECT 'payments', count(*) FROM public.payments
UNION ALL SELECT 'delay_records', count(*) FROM public.delay_records
UNION ALL SELECT 'transactions', count(*) FROM public.transactions
ORDER BY table_name;
