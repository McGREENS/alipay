#!/usr/bin/env node
/**
 * ALI MOBILE — DATABASE SEED SCRIPT
 * ==================================
 * Seeds sample data into your Supabase project for development.
 *
 * PREREQUISITES:
 *   1. Run setup-step1-schema-and-users.sql in the Supabase SQL Editor
 *      (Dashboard → SQL Editor → New query → paste → Run)
 *
 *   2. Get your service role key:
 *      Dashboard → Project Settings → API → "service_role" secret key
 *      (starts with sb_secret_...)
 *
 *   3. Run this script:
 *      $env:SUPABASE_SERVICE_KEY="sb_secret_your_key_here"
 *      node seed-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// ─── Read .env for project URL ──────────────────────────────────────────────
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not set.');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.error('   Then run:  $env:SUPABASE_SERVICE_KEY="sb_secret_..."  &&  node seed-data.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USD_TO_CDF = 2800;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ok(msg) { console.log(`  ✅  ${msg}`); }
function log(msg) { console.log(`  ${msg}`); }
function warn(msg) { console.log(`  ⚠️   ${msg}`); }
function err(msg) { console.log(`  ❌  ${msg}`); }

// ─── Seed Data (from db.ts, adapted for Supabase) ────────────────────────────

const SEED_SMARTPHONES = [
  { brand: 'Samsung', model: 'Galaxy A15', value_usd: 180, imei: '354892110298374' },
  { brand: 'Samsung', model: 'Galaxy A25 5G', value_usd: 260, imei: '356711220498321' },
  { brand: 'Samsung', model: 'Galaxy A35 5G', value_usd: 340, imei: '358901110587213' },
  { brand: 'Samsung', model: 'Galaxy A55 5G', value_usd: 450, imei: '359012340123456' },
  { brand: 'Samsung', model: 'Galaxy S24 FE', value_usd: 680, imei: '357123990887221' },
];

// Clients: agentId will be remapped to real agent UUIDs after fetching from DB
// agentIndex 0 = first agent, 1 = second, 2 = third
const SEED_CLIENTS = [
  {
    agentIndex: 0,
    last_name: 'Kakule', middle_name: 'Kasaki', first_name: 'Samuel',
    phone_whatsapp: '+243 997 123 456', phone_urgency: '+243 812 345 678',
    address_num: '17', address_avenue: 'des Écoles', neighborhood: 'Bukavu', city_commune: 'Bukavu',
    identity_doc_type: "Carte d'électeur", identity_doc_num: 'ELEC-243-98765-A',
    registered_at: '2026-06-08',
  },
  {
    agentIndex: 0,
    last_name: 'Mwanza', middle_name: 'Mulumba', first_name: 'Archange',
    phone_whatsapp: '+243 971 888 222', phone_urgency: '+243 854 333 111',
    address_num: '45', address_avenue: 'du Lac', neighborhood: 'Himbi', city_commune: 'Bukavu',
    identity_doc_type: 'Passeport', identity_doc_num: 'OP-0089122',
    registered_at: '2026-05-02',
  },
  {
    agentIndex: 1,
    last_name: 'Kavuo', middle_name: 'Meso', first_name: 'Aline',
    phone_whatsapp: '+243 994 555 666', phone_urgency: '+243 821 777 888',
    address_num: '102', address_avenue: 'de la Révolution', neighborhood: 'Katindo', city_commune: 'Bukavu',
    identity_doc_type: "Carte d'électeur", identity_doc_num: 'ELEC-243-55122-C',
    registered_at: '2026-07-10',
  },
  {
    agentIndex: 2,
    last_name: 'Amisi', middle_name: 'Ramazani', first_name: 'Trésor',
    phone_whatsapp: '+243 991 222 333', phone_urgency: '+243 899 444 555',
    address_num: '8B', address_avenue: 'Kanyamuhanga', neighborhood: 'Les Volcans', city_commune: 'Bukavu',
    identity_doc_type: 'Permis de conduire', identity_doc_num: 'PERM-243-00912',
    registered_at: '2026-05-15',
  },
];

// Contracts: clientIndex + phoneImei reference seeded clients/phones
const SEED_CONTRACTS = [
  {
    contract_number: 'AM-2026-001', clientIndex: 0, phoneImei: '358901110587213',
    subscription_date: '2026-06-08', plan_type: 'hebdo',
    initial_deposit_usd: 170, installment_amount_usd: 21.25, total_installments: 8,
    payment_day: 'Samedi', status: 'en_cours', agentIndex: 0,
  },
  {
    contract_number: 'AM-2026-002', clientIndex: 1, phoneImei: '356711220498321',
    subscription_date: '2026-05-02', plan_type: 'mensuel',
    initial_deposit_usd: 130, installment_amount_usd: 65, total_installments: 2,
    payment_day: '02', status: 'bloque', agentIndex: 0,
  },
  {
    contract_number: 'AM-2026-003', clientIndex: 2, phoneImei: '354892110298374',
    subscription_date: '2026-07-10', plan_type: 'hebdo',
    initial_deposit_usd: 90, installment_amount_usd: 11.25, total_installments: 8,
    payment_day: 'Samedi', status: 'en_cours', agentIndex: 1,
  },
  {
    contract_number: 'AM-2026-004', clientIndex: 3, phoneImei: '354892110298374',
    subscription_date: '2026-05-15', plan_type: 'hebdo',
    initial_deposit_usd: 90, installment_amount_usd: 11.25, total_installments: 8,
    payment_day: 'Samedi', status: 'termine', agentIndex: 2,
  },
];

// Payments: contractNumber + clientIndex
const SEED_PAYMENTS = [
  // Contract 1 — Samuel Kakule (Galaxy A35 $340, deposit $170 + 8 × $21.25)
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 170, date: '2026-06-08T10:30:00', due_date: '2026-06-08', payment_method: 'Mobile Money (M-Pesa)', status: 'Terminé', transaction_ref: 'MP-TRX-882910-A', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-06-13T16:15:00', due_date: '2026-06-13', payment_method: 'Mobile Money (M-Pesa)', status: 'Terminé', transaction_ref: 'MP-TRX-893012-C', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-06-20T11:00:00', due_date: '2026-06-20', payment_method: 'Mobile Money (Airtel Money)', status: 'Terminé', transaction_ref: 'AM-TRX-102931-F', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-06-27T09:45:00', due_date: '2026-06-27', payment_method: 'Mobile Money (M-Pesa)', status: 'Terminé', transaction_ref: 'MP-TRX-912834-K', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-07-04T18:30:00', due_date: '2026-07-04', payment_method: 'Mobile Money (M-Pesa)', status: 'Terminé', transaction_ref: 'MP-TRX-922904-L', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-07-11T14:20:00', due_date: '2026-07-11', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-2026-0129', agentIndex: 0 },
  { contract_number: 'AM-2026-001', clientIndex: 0, amount_usd: 21.25, date: '2026-07-17T08:12:00', due_date: '2026-07-18', payment_method: 'Mobile Money (M-Pesa)', status: 'Échec', transaction_ref: 'MP-TRX-955122-E', agentIndex: 0 },

  // Contract 2 — Archange Mwanza (Galaxy A25 $260, deposit $130 + 2 × $65)
  { contract_number: 'AM-2026-002', clientIndex: 1, amount_usd: 130, date: '2026-05-02T14:00:00', due_date: '2026-05-02', payment_method: 'Mobile Money (Orange Money)', status: 'Terminé', transaction_ref: 'OM-TRX-331209-X', agentIndex: 0 },
  { contract_number: 'AM-2026-002', clientIndex: 1, amount_usd: 65, date: '2026-06-02T11:45:00', due_date: '2026-06-02', payment_method: 'Mobile Money (Orange Money)', status: 'Terminé', transaction_ref: 'OM-TRX-341901-Z', agentIndex: 0 },
  { contract_number: 'AM-2026-002', clientIndex: 1, amount_usd: 65, date: '2026-07-03T09:00:00', due_date: '2026-07-02', payment_method: 'Mobile Money (Orange Money)', status: 'Échec', transaction_ref: 'OM-TRX-359902-W', agentIndex: 0 },

  // Contract 3 — Aline Kavuo (Galaxy A15 $180, deposit $90)
  { contract_number: 'AM-2026-003', clientIndex: 2, amount_usd: 90, date: '2026-07-10T15:30:00', due_date: '2026-07-10', payment_method: 'Mobile Money (M-Pesa)', status: 'Terminé', transaction_ref: 'MP-TRX-948123-U', agentIndex: 1 },

  // Contract 4 — Trésor Amisi (Galaxy A15 $180, fully paid: deposit $90 + 8 × $11.25)
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 90, date: '2026-05-15T11:00:00', due_date: '2026-05-15', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-2026-0055', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-05-22T14:30:00', due_date: '2026-05-22', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-402', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-05-29T10:15:00', due_date: '2026-05-29', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-403', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-06-05T16:00:00', due_date: '2026-06-05', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-404', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-06-12T12:00:00', due_date: '2026-06-12', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-405', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-06-19T09:30:00', due_date: '2026-06-19', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-406', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-06-26T15:10:00', due_date: '2026-06-26', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-407', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-07-03T11:00:00', due_date: '2026-07-03', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-408', agentIndex: 2 },
  { contract_number: 'AM-2026-004', clientIndex: 3, amount_usd: 11.25, date: '2026-07-10T10:00:00', due_date: '2026-07-10', payment_method: 'Espèces', status: 'Terminé', transaction_ref: 'CASH-409', agentIndex: 2 },
];

const SEED_DELAYS = [
  { contract_number: 'AM-2026-002', clientIndex: 1, due_date: '2026-07-02', amount_usd: 65, days_overdue: 16, status: 'Actif' },
];

const SEED_TRANSACTIONS = [
  { client_name: 'Samuel Kakule', transaction_type: 'dépôt', phone_number: '+243997123456', amount: 25, currency: 'USD', operator: 'Airtel', operator_transaction_number: 'AIR-2026-001', reference_number: 'AM-TRX-001', reason: 'Dépôt Mobile Money', operatorIndex: 0 },
  { client_name: 'Aline Kavuo', transaction_type: 'retrait', phone_number: '+243994555666', amount: 15000, currency: 'CDF', operator: 'Vodacom', operator_transaction_number: 'VOD-2026-002', reference_number: 'AM-TRX-002', reason: 'Retrait M-Pesa', operatorIndex: 0 },
  { client_name: 'Archange Mwanza', transaction_type: 'dépôt', phone_number: '+243971888222', amount: 50, currency: 'USD', operator: 'Voda-e', operator_transaction_number: 'VDE-2026-003', reference_number: 'AM-TRX-003', reason: 'Dépôt Voda-e', operatorIndex: 0 },
  { client_name: 'Trésor Amisi', transaction_type: 'retrait', phone_number: '+243991222333', amount: 30, currency: 'USD', operator: 'Airtel', operator_transaction_number: 'AIR-2026-004', reference_number: 'AM-TRX-004', reason: 'Retrait Airtel Money', operatorIndex: 0 },
  { client_name: 'Client Passant', transaction_type: 'dépôt', phone_number: '+243815000111', amount: 5000, currency: 'CDF', operator: 'Vodacom', operator_transaction_number: 'VOD-2026-005', reference_number: 'AM-TRX-005', reason: 'Dépôt M-Pesa', operatorIndex: 0 },
  { client_name: 'Client Passant', transaction_type: 'retrait', phone_number: '+243815000222', amount: 10000, currency: 'CDF', operator: 'Airtel', operator_transaction_number: 'AIR-2026-006', reference_number: 'AM-TRX-006', reason: 'Retrait Airtel', operatorIndex: 0 },
  { client_name: 'Samuel Kakule', transaction_type: 'dépôt', phone_number: '+243997123456', amount: 15, currency: 'USD', operator: 'Voda-e', operator_transaction_number: 'VDE-2026-007', reference_number: 'AM-TRX-007', reason: 'Dépôt Voda-e', operatorIndex: 0 },
  { client_name: 'Aline Kavuo', transaction_type: 'dépôt', phone_number: '+243994555666', amount: 20000, currency: 'CDF', operator: 'Vodacom', operator_transaction_number: 'VOD-2026-008', reference_number: 'AM-TRX-008', reason: 'Dépôt M-Pesa', operatorIndex: 0 },
  { client_name: 'Client Passant', transaction_type: 'retrait', phone_number: '+243820000333', amount: 45, currency: 'USD', operator: 'Voda-e', operator_transaction_number: 'VDE-2026-009', reference_number: 'AM-TRX-009', reason: 'Retrait Voda-e', operatorIndex: 0 },
  { client_name: 'Archange Mwanza', transaction_type: 'dépôt', phone_number: '+243971888222', amount: 8000, currency: 'CDF', operator: 'Airtel', operator_transaction_number: 'AIR-2026-010', reference_number: 'AM-TRX-010', reason: 'Dépôt Airtel', operatorIndex: 0 },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  ALI MOBILE — DATABASE SEED SCRIPT\n');

  // 1. Verify tables exist
  log('Checking database tables...');
  const { error: tblErr } = await supabase.from('smartphones').select('id').limit(1);
  if (tblErr && tblErr.code === '42P01') {
    err('Tables do not exist! Please run setup-step1-schema-and-users.sql');
    err('in the Supabase SQL Editor first, then re-run this script.');
    process.exit(1);
  }
  if (tblErr && tblErr.code === 'PGRST205') {
    err('Tables do not exist or RLS is blocking. Run setup-step1-schema-and-users.sql first.');
    process.exit(1);
  }
  ok('Tables are accessible');

  // 2. Ensure an admin agent exists (create or confirm the one we signed up earlier)
  log('\nFetching existing agents...');
  const { data: existingAgents, error: agentErr } = await supabase
    .from('agents')
    .select('id, code, name, role, email')
    .order('created_at');

  if (agentErr) {
    err('Could not fetch agents: ' + agentErr.message);
    process.exit(1);
  }

  let agents = existingAgents || [];

  // If no agents exist, create one from the auth user we already signed up
  if (agents.length === 0) {
    warn('No agents found. Looking for auth users to promote...');
    // Try to find the admin@alimobile.com user we created earlier
    const { data: adminUser } = await supabase.auth.admin.listUsers();
    const found = adminUser?.users?.find((u) => u.email === 'admin@alimobile.com');

    if (found) {
      // Confirm their email
      await supabase.auth.admin.updateUserById(found.id, { email_confirm: true });
      // Insert agent record (trigger may not have fired if schema was set up later)
      const { error: insErr } = await supabase.from('agents').upsert({
        id: found.id,
        name: 'Admin Ali Mobile',
        email: 'admin@alimobile.com',
        phone: '+243824444298',
        code: 'DIR-243-01',
        role: 'admin',
        city: 'Bukavu',
      }, { onConflict: 'id' });
      if (insErr) warn('Could not insert agent: ' + insErr.message);
      else ok('Created admin agent from existing auth user');

      // Re-fetch
      const { data: re } = await supabase.from('agents').select('id, code, name, role, email').order('created_at');
      agents = re || [];
    }
  }

  // If still no agents, create a fresh admin
  if (agents.length === 0) {
    warn('Creating a new admin user...');
    const { data: newAdmin, error: createErr } = await supabase.auth.admin.createUser({
      email: 'admin@alimobile.com',
      password: 'AliMobile2026!',
      email_confirm: true,
      user_metadata: { name: 'Admin Ali Mobile', role: 'admin', code: 'DIR-243-01', phone: '+243824444298', city: 'Bukavu' },
    });
    if (createErr) {
      err('Could not create admin user: ' + createErr.message);
      process.exit(1);
    }
    await supabase.from('agents').upsert({
      id: newAdmin.user.id,
      name: 'Admin Ali Mobile',
      email: 'admin@alimobile.com',
      phone: '+243824444298',
      code: 'DIR-243-01',
      role: 'admin',
      city: 'Bukavu',
    }, { onConflict: 'id' });
    ok('Created new admin user: admin@alimobile.com / AliMobile2026!');

    const { data: re } = await supabase.from('agents').select('id, code, name, role, email').order('created_at');
    agents = re || [];
  }

  console.log(`\n  Found ${agents.length} agent(s):`);
  agents.forEach((a) => console.log(`    - [${a.role}] ${a.name} (${a.code})`));

  // Ensure all auth users are email-confirmed
  log('\nConfirming all auth user emails...');
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  if (allUsers?.users) {
    for (const u of allUsers.users) {
      if (!u.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(u.id, { email_confirm: true });
        log(`  Confirmed email for ${u.email}`);
      }
    }
  }
  ok('All emails confirmed');

  // 3. Seed Smartphones
  console.log('\n📱  Seeding smartphones...');
  const phoneIdMap = {}; // imei → id
  for (const phone of SEED_SMARTPHONES) {
    const { data, error } = await supabase
      .from('smartphones')
      .upsert(phone, { onConflict: 'imei' })
      .select('id, imei')
      .single();
    if (error) { warn(`Smartphone ${phone.imei}: ${error.message}`); continue; }
    phoneIdMap[data.imei] = data.id;
  }
  ok(`${Object.keys(phoneIdMap).length} smartphones seeded`);

  // 4. Seed Clients
  console.log('\n👤  Seeding clients...');
  const clientIdMap = []; // index → id
  for (let i = 0; i < SEED_CLIENTS.length; i++) {
    const c = SEED_CLIENTS[i];
    const agent = agents[c.agentIndex] || agents[0];
    const insertData = {
      last_name: c.last_name,
      middle_name: c.middle_name || null,
      first_name: c.first_name,
      phone_whatsapp: c.phone_whatsapp,
      phone_urgency: c.phone_urgency,
      address_num: c.address_num,
      address_avenue: c.address_avenue,
      neighborhood: c.neighborhood,
      city_commune: c.city_commune,
      identity_doc_type: c.identity_doc_type,
      identity_doc_num: c.identity_doc_num,
      registered_at: c.registered_at,
      agent_id: agent.id,
    };
    const { data, error } = await supabase.from('clients').insert(insertData).select('id').single();
    if (error) {
      if (error.code === '23505') {
        // Already exists — find by name
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('last_name', c.last_name)
          .eq('first_name', c.first_name)
          .limit(1);
        if (existing && existing[0]) {
          clientIdMap[i] = existing[0].id;
          warn(`Client ${c.first_name} ${c.last_name} already exists — reusing`);
          continue;
        }
      }
      warn(`Client ${c.first_name} ${c.last_name}: ${error.message}`);
      continue;
    }
    clientIdMap[i] = data.id;
  }
  ok(`${clientIdMap.filter(Boolean).length} clients seeded`);

  // 5. Seed Contracts
  console.log('\n📄  Seeding contracts...');
  for (const contract of SEED_CONTRACTS) {
    const agent = agents[contract.agentIndex] || agents[0];
    const insertData = {
      contract_number: contract.contract_number,
      client_id: clientIdMap[contract.clientIndex],
      smartphone_id: phoneIdMap[contract.phoneImei],
      subscription_date: contract.subscription_date,
      plan_type: contract.plan_type,
      initial_deposit_usd: contract.initial_deposit_usd,
      installment_amount_usd: contract.installment_amount_usd,
      total_installments: contract.total_installments,
      payment_day: contract.payment_day,
      status: contract.status,
      agent_id: agent.id,
    };
    const { error } = await supabase.from('contracts').upsert(insertData, { onConflict: 'contract_number' });
    if (error) warn(`Contract ${contract.contract_number}: ${error.message}`);
  }
  ok(`${SEED_CONTRACTS.length} contracts seeded`);

  // 6. Seed Payments
  console.log('\n💰  Seeding payments...');
  let payCount = 0;
  for (const pay of SEED_PAYMENTS) {
    const agent = agents[pay.agentIndex] || agents[0];
    const insertData = {
      contract_number: pay.contract_number,
      client_id: clientIdMap[pay.clientIndex],
      amount_usd: pay.amount_usd,
      amount_cdf: pay.amount_usd * USD_TO_CDF,
      date: pay.date,
      due_date: pay.due_date,
      payment_method: pay.payment_method,
      status: pay.status,
      transaction_ref: pay.transaction_ref,
      agent_id: agent.id,
    };
    const { error } = await supabase.from('payments').upsert(insertData, { onConflict: 'transaction_ref' });
    if (error) { warn(`Payment ${pay.transaction_ref}: ${error.message}`); continue; }
    payCount++;
  }
  ok(`${payCount} payments seeded`);

  // 7. Seed Delay Records
  console.log('\n⏰  Seeding delay records...');
  for (const delay of SEED_DELAYS) {
    const insertData = {
      contract_number: delay.contract_number,
      client_id: clientIdMap[delay.clientIndex],
      due_date: delay.due_date,
      amount_usd: delay.amount_usd,
      days_overdue: delay.days_overdue,
      status: delay.status,
    };
    const { error } = await supabase.from('delay_records').upsert(insertData, { onConflict: 'contract_number' });
    if (error) warn(`Delay ${delay.contract_number}: ${error.message}`);
  }
  ok(`${SEED_DELAYS.length} delay record(s) seeded`);

  // 8. Seed Utility Transactions
  console.log('\n🔄  Seeding utility transactions...');
  let txCount = 0;
  for (const tx of SEED_TRANSACTIONS) {
    const agent = agents[tx.operatorIndex] || agents[0];
    const insertData = {
      client_name: tx.client_name,
      transaction_type: tx.transaction_type,
      phone_number: tx.phone_number,
      amount: tx.amount,
      currency: tx.currency,
      operator: tx.operator,
      operator_transaction_number: tx.operator_transaction_number,
      reference_number: tx.reference_number,
      reason: tx.reason,
      operator_id: agent.id,
    };
    const { error } = await supabase.from('transactions').upsert(insertData, { onConflict: 'reference_number' });
    if (error) { warn(`Transaction ${tx.reference_number}: ${error.message}`); continue; }
    txCount++;
  }
  ok(`${txCount} utility transactions seeded`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('  ✅  SEED COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Smartphones:  ${Object.keys(phoneIdMap).length}`);
  console.log(`  Clients:      ${clientIdMap.filter(Boolean).length}`);
  console.log(`  Contracts:    ${SEED_CONTRACTS.length}`);
  console.log(`  Payments:     ${payCount}`);
  console.log(`  Delays:       ${SEED_DELAYS.length}`);
  console.log(`  Transactions:  ${txCount}`);
  console.log('');
  console.log('  Admin login:  admin@alimobile.com / AliMobile2026!');
  console.log('══════════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});
