/**
 * ALI MOBILE - AUTOMATED DATABASE SETUP & DATA IMPORT SCRIPT
 * ============================================================
 * This script:
 *   1. Creates all Supabase tables (schema + migrations)
 *   2. Creates all agent/user accounts from real data
 *   3. Imports all smartphones from real contracts
 *   4. Imports all 68 real contracts + clients
 *   5. Imports all 1000 real utility transactions
 *
 * Run: node setup-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://gnkiredcmyajjgivsvkg.supabase.co';

// We need the SERVICE ROLE key (secret) to bypass RLS and run admin operations.
// Get it from: Supabase Dashboard → Project Settings → API Keys → "default" secret key
// It starts with: sb_secret_...
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY || !SUPABASE_SERVICE_KEY.startsWith('sb_secret_')) {
  console.error('\n❌  ERROR: Missing or invalid SUPABASE_SERVICE_KEY');
  console.error('   Set it as an environment variable before running:');
  console.error('   $env:SUPABASE_SERVICE_KEY="sb_secret_xxxxx..."\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function log(msg) { console.log(`  ${msg}`); }
function ok(msg)  { console.log(`  ✅  ${msg}`); }
function warn(msg){ console.log(`  ⚠️   ${msg}`); }
function err(msg) { console.log(`  ❌  ${msg}`); }

async function runSQL(sql, label) {
  // Supabase JS client doesn't expose raw SQL — we use the REST API directly
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Try alternative: use pg endpoint
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res2.ok) {
      warn(`${label} — SQL execution via REST not available. Will use JS client methods instead.`);
      return false;
    }
  }
  ok(label);
  return true;
}

async function upsertRow(table, data, conflictKey) {
  const { error } = await supabase
    .from(table)
    .upsert(data, { onConflict: conflictKey, ignoreDuplicates: true });
  if (error) throw error;
}

// ─── STEP 1: SCHEMA via SQL files ────────────────────────────────────────────
async function runSchemaFiles() {
  console.log('\n📋  STEP 1: Running schema SQL files...');

  const files = [
    'supabase_schema.sql',
    'migration_v2_enhancements.sql',
    'migration_v3_transactions_currency_and_password_fix.sql',
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      warn(`File not found: ${file} — skipping`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    log(`Running ${file}...`);

    // Split on semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    let successCount = 0;
    for (const stmt of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (!error) successCount++;
      } catch (e) {
        // exec_sql RPC may not exist — that's OK, we'll create tables via JS client
      }
    }

    ok(`${file} processed (${successCount}/${statements.length} statements via RPC)`);
  }
}

// ─── STEP 2: Create tables directly if they don't exist ─────────────────────
async function ensureTablesExist() {
  console.log('\n🏗️   STEP 2: Ensuring all tables exist...');

  // Test by trying to query agents table
  const { error: agentsErr } = await supabase.from('agents').select('id').limit(1);
  if (agentsErr && agentsErr.code === '42P01') {
    err('Tables do not exist. You need to run the SQL schema manually first.');
    err('Go to: https://supabase.com/dashboard → SQL Editor → paste supabase_schema.sql → Run');
    err('Then run: node setup-database.mjs again');
    process.exit(1);
  }

  const tables = ['agents', 'smartphones', 'clients', 'contracts', 'payments', 'delay_records', 'transactions'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      err(`Table "${table}" missing. Please run supabase_schema.sql first in Supabase SQL Editor.`);
      process.exit(1);
    } else {
      ok(`Table "${table}" exists`);
    }
  }
}

// ─── STEP 3: Create agent accounts ──────────────────────────────────────────
async function createAgents() {
  console.log('\n👤  STEP 3: Creating agent accounts...');

  const agents = [
    {
      email: 'franck.alliance@alimobile.com',
      password: 'AliMobile2026!',
      name: 'Franck Alliance',
      phone: '+243824444298',
      code: 'DIR-243-01',
      role: 'admin',
      city: 'Bukavu',
    },
    {
      email: 'joelle.mihigo@alimobile.com',
      password: 'AliMobile2026!',
      name: 'JOELLE MIHIGO EMMANUELA',
      phone: '+243824444203',
      code: 'AD-243-03',
      role: 'admin',
      city: 'Bukavu',
    },
    {
      email: 'john.nsaraza@alimobile.com',
      password: 'AliMobile2026!',
      name: 'JOHN NSARAZA',
      phone: '+243824444202',
      code: 'AG-243-02',
      role: 'agent',
      city: 'Bukavu',
    },
    {
      email: 'mugisho.byamungu@alimobile.com',
      password: 'AliMobile2026!',
      name: 'MUGISHO BYAMUNGU ROMUEL',
      phone: '+243824444204',
      code: 'AG-243-04',
      role: 'agent',
      city: 'Bukavu',
    },
    {
      email: 'blesing.kadesi@alimobile.com',
      password: 'AliMobile2026!',
      name: 'BLESING KADESI',
      phone: '+243824444208',
      code: 'OP-243-08',
      role: 'operator',
      city: 'Bukavu',
    },
  ];

  const agentIdMap = {}; // code -> UUID

  for (const agent of agents) {
    log(`Creating account: ${agent.name} (${agent.code})...`);

    // Check if auth user already exists by trying to sign in
    const { data: existingUsers } = await supabase
      .from('agents')
      .select('id, code')
      .eq('code', agent.code)
      .single();

    if (existingUsers) {
      agentIdMap[agent.code] = existingUsers.id;
      warn(`Agent ${agent.code} already exists — skipping`);
      continue;
    }

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: agent.email,
      password: agent.password,
      email_confirm: true,
      user_metadata: {
        name: agent.name,
        phone: agent.phone,
        code: agent.code,
        role: agent.role,
        city: agent.city,
      },
    });

    if (authErr) {
      if (authErr.message?.includes('already registered')) {
        // Get existing ID
        const { data: existing } = await supabase
          .from('agents')
          .select('id')
          .eq('email', agent.email)
          .single();
        if (existing) {
          agentIdMap[agent.code] = existing.id;
          warn(`${agent.name} already exists`);
          continue;
        }
      }
      err(`Failed to create ${agent.name}: ${authErr.message}`);
      continue;
    }

    const userId = authData.user.id;
    agentIdMap[agent.code] = userId;

    // Upsert into public.agents
    const { error: agentErr } = await supabase.from('agents').upsert({
      id: userId,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      code: agent.code,
      role: agent.role,
      city: agent.city,
    }, { onConflict: 'id', ignoreDuplicates: false });

    if (agentErr) {
      err(`Failed to insert agent record for ${agent.name}: ${agentErr.message}`);
    } else {
      ok(`Created: ${agent.name} — ${agent.email} / Password: ${agent.password}`);
    }
  }

  // Final sync: fetch all agent IDs from DB for contracts/transactions
  const { data: allAgents } = await supabase.from('agents').select('id, code');
  if (allAgents) {
    for (const a of allAgents) {
      agentIdMap[a.code] = a.id;
    }
  }

  return agentIdMap;
}

// ─── STEP 4: Import smartphones ──────────────────────────────────────────────
async function importSmartphones() {
  console.log('\n📱  STEP 4: Importing smartphones from real contracts...');

  const phones = [
    // From real contract data
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326784002705' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730176067' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354720737090493' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 220, imei: '350213456227078' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326783959673' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456228829' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326783957289' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326784199519' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 190, imei: '351326784012316' },
    { brand: 'Samsung', model: 'GALAXI A17 128 4G', value_usd: 210, imei: '350213456227391' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456227037' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456228803' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326784106696' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456228621' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456234504' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326783937851' },
    { brand: 'Samsung', model: 'Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326784022877' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '355726316811018' },
    { brand: 'Samsung', model: 'Galaxy A06 64GB 4G', value_usd: 145, imei: '354720735274578' },
    { brand: 'Samsung', model: 'Galaxy A17 (4/128GB)', value_usd: 220, imei: '350213456228670' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 195, imei: '351326784094272' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 195, imei: '351326783972353' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730169435' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730169799' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347403121' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 250, imei: '354112426915935' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '353150401047325' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '355726316813881' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347617712' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730176067' }, // duplicate — skip
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 165, imei: '354720730170060' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354720737090741' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347427070' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354720735273778' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730169807' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730170136' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730169534' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '355726316811869' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '353150401047721' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 200, imei: '354112427426767' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '351262070630851' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347620187' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 250, imei: '354112427533562' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '353150401047721' }, // dup
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347626226' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '351262070477980' },
    { brand: 'Samsung', model: 'GALAXY A06', value_usd: 165, imei: '354720737090360' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354720737090428' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347617969' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 4G', value_usd: 250, imei: '351262070459517' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '355726316810648' },
    { brand: 'Samsung', model: 'GALAXY A06 64GB 4G', value_usd: 145, imei: '354720730170094' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 4G', value_usd: 250, imei: '351262070458774' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '351262070632147' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347427021' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347621045' },
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '351262070481693' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354880841279935' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 180, imei: '351468680996216' },
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '353995374822371' },
    { brand: 'Samsung', model: 'GALAXY A07 64GB 4G', value_usd: 180, imei: '351929937766884' },
    { brand: 'Samsung', model: 'GALAXY A17 128GB 4G', value_usd: 250, imei: '351468680844259' },
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354880841280313' },
    { brand: 'Samsung', model: 'GALAXI A17 256GB 8G', value_usd: 250, imei: '353013593032630' },
    { brand: 'Samsung', model: 'GALAXI A06 128GB 4G', value_usd: 165, imei: '354880841278697' },
    { brand: 'Samsung', model: 'GALAXY A16 (4/128GB)', value_usd: 195, imei: '351326783959673' }, // dup
    { brand: 'Samsung', model: 'GALAXY A16 (4/128GB)', value_usd: 195, imei: '351326784199519' }, // dup
    { brand: 'Samsung', model: 'GALAXY A16 (4/128GB)', value_usd: 195, imei: '351326784012316' }, // dup
    { brand: 'Samsung', model: 'Samsung Galaxy A16 (4/128GB)', value_usd: 195, imei: '351326783937851' }, // dup
    { brand: 'Samsung', model: 'GALAXY A17 256GB 8G', value_usd: 250, imei: '351262070632147' }, // dup
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '355726316811018' }, // dup
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '350213456228803' }, // dup for AM-2026-019
    { brand: 'Samsung', model: 'GALAXY A06 128GB 4G', value_usd: 165, imei: '354720737090360' }, // dup
    { brand: 'Samsung', model: 'GALAXY A16 128GB 4G', value_usd: 180, imei: '356510347617969' }, // dup
  ];

  // Deduplicate by IMEI
  const seen = new Set();
  const unique = phones.filter(p => {
    if (seen.has(p.imei)) return false;
    seen.add(p.imei);
    return true;
  });

  let imported = 0;
  for (const phone of unique) {
    const { error } = await supabase
      .from('smartphones')
      .upsert({ ...phone }, { onConflict: 'imei', ignoreDuplicates: true });
    if (!error) imported++;
  }

  ok(`Imported ${imported} smartphones`);

  // Return imei -> id map
  const { data } = await supabase.from('smartphones').select('id, imei');
  const map = {};
  if (data) data.forEach(p => { map[p.imei] = p.id; });
  return map;
}

// ─── STEP 5: Import contracts + clients ──────────────────────────────────────
async function importContracts(agentIdMap, smartphoneIdMap) {
  console.log('\n📄  STEP 5: Importing 68 real contracts + clients...');

  // Agent code → ID helper with fallback
  const getAgent = (code) => {
    const id = agentIdMap[code];
    if (!id) {
      warn(`Agent code "${code}" not found — using DIR-243-01 as fallback`);
      return agentIdMap['DIR-243-01'];
    }
    return id;
  };

  const getPhone = (imei) => {
    const id = smartphoneIdMap[imei];
    if (!id) {
      warn(`IMEI "${imei}" not found in smartphones table`);
    }
    return id;
  };

  // Raw contracts from the Excel export
  const contracts = [
    { num: 'AM-2026-068', date: '2026-10-07', clientName: 'KOMPANY TSHIMANGA PIERROT', wa: '243814444683', urg: '0814444683', docType: "Passeport", docNum: 'PO3369313', addr: '00 Av. LEMBA, Q. LEMBA, KINSHASA', imei: '351326784002705', deposit: 120, install: 37.5, total: 2, day: '30', paid: 120, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-067', date: '2026-10-02', clientName: 'BAWILI ISSA JUNIOR', wa: '+243821850777', urg: '++243815007842', docType: "Carte d'électeur", docNum: '33457300074', addr: '00 Av. centre comercial kilundu, Q. uvira, uvira', imei: '354720730176067', deposit: 50, install: 47.5, total: 2, day: '02', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-066', date: '2026-09-10', clientName: 'KITWANDA ZIMA JOSEPH', wa: '+243815346400', urg: '+243815346400', docType: "Carte d'électeur", docNum: '1000000', addr: '00 Av. SAIO, Q. NDENDERE, BUKAVU', imei: '354720737090493', deposit: 90, install: 37.5, total: 2, day: '11', paid: 140, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-065', date: '2026-09-07', clientName: 'BURHABALE KALHEHEZO OLIVIER', wa: '+243987186670', urg: '+243987186670', docType: "Carte d'électeur", docNum: '01170', addr: '000 Av. HYPODROME, Q. NDENDERE, BUKAVU', imei: '350213456227078', deposit: 90, install: 65, total: 2, day: '08', paid: 140, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-064', date: '2026-09-07', clientName: 'NSIMIRE BASHIMBE NOELLA', wa: '+243811999974', urg: '+243811999974', docType: "Carte d'électeur", docNum: '33648743428', addr: '00 Av. BAKOKO, Q. MOSALA, BUKAVU', imei: '351326783959673', deposit: 80, install: 57.5, total: 2, day: '8', paid: 195, status: 'termine', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-063', date: '2026-09-05', clientName: 'MUSIWA KABAMBA STYVE', wa: '+243816812540', urg: '+243816812540', docType: "Carte d'électeur", docNum: '33641909556', addr: '00 Av. KINDU, Q. NDENDERE, BUKAVU', imei: '350213456228829', deposit: 50, install: 85, total: 2, day: '05', paid: 100, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-062', date: '2026-09-03', clientName: 'LOUANGE NZIGIRE BARHEMULA', wa: '+243993420902', urg: '+243993420902', docType: "Carte d'électeur", docNum: '33409901078', addr: '00 Av. CHIJOCO, Q. LUGIGA, BUKAVU', imei: '351326783957289', deposit: 50, install: 48.33, total: 3, day: '03', paid: 150, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-061', date: '2026-09-02', clientName: 'VALEUR CHIFUNGO TUMAINI', wa: '+243824915067', urg: '+243824915067', docType: "Carte d'électeur", docNum: '33577702649', addr: '00 Av. RUMONDO, Q. MUBAKU, BUKAVU', imei: '351326784199519', deposit: 50, install: 48.33, total: 3, day: '05', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-060', date: '2026-09-01', clientName: 'OMBAMBO SOMBO JOSEPH', wa: '+243976096991', urg: '+243976096991', docType: "Carte d'électeur", docNum: '32239232804', addr: '00 Av. BUKAVU, Q. BUKAVU, BUKAVU', imei: '351326784012316', deposit: 60, install: 43.33, total: 3, day: '31', paid: 60, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-059', date: '2026-09-01', clientName: 'OMAMBO SOMBO JOSEPH', wa: '+243976096991', urg: '+243976096991', docType: "Carte d'électeur", docNum: '32239232804', addr: '00 Av. BUKAVU, Q. BUKAVU, BUKAVU', imei: '350213456227391', deposit: 60, install: 50, total: 3, day: '31', paid: 60, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-058', date: '2026-09-01', clientName: 'OMAMBO SOMBO JOSEPH', wa: '+243976096991', urg: '+243976096991', docType: "Carte d'électeur", docNum: '32239232804', addr: '00 Av. BUKAVU, Q. BUKAVU, BUKAVU', imei: '350213456227037', deposit: 60, install: 53.33, total: 3, day: '31', paid: 60, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-057', date: '2026-09-01', clientName: 'LARHA SHAMALIRWA CHRISTIAN', wa: '+243833435737', urg: '+243833435737', docType: 'Passeport', docNum: 'OP1245964', addr: '082 Av. KAJANGU, Q. NYALUKEMBA, BUKAVU', imei: '350213456228803', deposit: 50, install: 56.67, total: 3, day: '27', paid: 98, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-056', date: '2026-08-31', clientName: 'KILANGA AMISI JANVIER', wa: '+243817484626', urg: '+243817484626', docType: "Carte d'électeur", docNum: '33655116857', addr: '0675 Av. NKAFU, Q. KADUTU, BUKAVU', imei: '351326784106696', deposit: 50, install: 48.33, total: 3, day: '05', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-055', date: '2026-08-31', clientName: 'MUSIWA KABAMBA STYVE', wa: '+243816812540', urg: '+243816812540', docType: "Carte d'électeur", docNum: '33641909556', addr: '00 Av. KINDU, Q. NDENDERE, BUKAVU', imei: '350213456228621', deposit: 50, install: 85, total: 2, day: '31', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-054', date: '2026-08-30', clientName: 'OKOSA LONDE JEAN PAUL', wa: '+243814443799', urg: '+243814443799', docType: 'Passeport', docNum: 'P00193283', addr: '00 Av. GOMA, Q. GOMA, Goma', imei: '350213456234504', deposit: 80, install: 70, total: 2, day: '30', paid: 220, status: 'termine', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-053', date: '2026-08-28', clientName: 'MUSHAGALUSA CISHAMARHA OLIVIER', wa: '+243998419698', urg: '+243998419698', docType: "Carte d'électeur", docNum: '33641910241', addr: '00 Av. PAYSAGE, Q. NYALUKEMBA, BUKAVU', imei: '351326783937851', deposit: 50, install: 48.33, total: 3, day: '27', paid: 150, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-052', date: '2026-08-28', clientName: 'MUSHAGALUSA CISHAMARHA OLIVIER', wa: '+243998419698', urg: '+243998419698', docType: "Carte d'électeur", docNum: '33641910241', addr: '00 Av. PAYSAGE, Q. NYALUKEMBA, BUKAVU', imei: '351326784022877', deposit: 50, install: 72.5, total: 2, day: '05', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-051', date: '2026-08-28', clientName: 'RASHIDI MUKATA HUBERT', wa: '+243991964502', urg: '+243833453147', docType: "Carte d'électeur", docNum: '3345320355', addr: '01 Av. DELA MISSION, Q. SONGO, KALUNDU', imei: '355726316811018', deposit: 83, install: 41, total: 2, day: '05', paid: 83, status: 'en_cours', agentCode: 'AG-243-04' },
    { num: 'AM-2026-050', date: '2026-08-28', clientName: 'CIKWANINE MIRINDI ODETTE', wa: '+243997722084', urg: '+243997722084', docType: "Carte d'électeur", docNum: '33640931473', addr: '00 Av. CORNICHE, Q. NYALUKEMBA, BUKAVU', imei: '350213456228803', deposit: 50, install: 85, total: 2, day: '27', paid: 100, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-049', date: '2026-08-26', clientName: 'NTAGULWANGUMA KABUNGA IRENE', wa: '+243970636265', urg: '+243970636265', docType: "Carte d'électeur", docNum: '33642125417', addr: '00 Av. SAIO, Q. NDENDERE, BUKAVU', imei: '354720735274578', deposit: 50, install: 47.5, total: 2, day: '26', paid: 97.5, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-048', date: '2026-08-25', clientName: 'MUHINDO KABEGO PATRICK', wa: '+243998752597', urg: '+243998752597', docType: "Carte d'électeur", docNum: '33647118353', addr: '00 Av. PATRICE, Q. NYALUKEMBA, BUKAVU', imei: '350213456228670', deposit: 100, install: 60, total: 2, day: '25', paid: 130, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-047', date: '2026-08-25', clientName: 'MUTANDA KAKESHI ARLAIN', wa: '+243835034961', urg: '+243835034961', docType: "Carte d'électeur", docNum: '33429102411', addr: '00 Av. MUTERMUKO, Q. KABINULA, UVIRA', imei: '351326784094272', deposit: 70, install: 62.5, total: 2, day: '25', paid: 70, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-046', date: '2026-08-25', clientName: 'LEMBA MUKUBA SIMON', wa: '+243821024410', urg: '+243821024410', docType: "Carte d'électeur", docNum: '33614902093', addr: '00 Av. IRAMBO, Q. LUGENDO, BUKAVU', imei: '351326783972353', deposit: 60, install: 67.5, total: 2, day: '25', paid: 60, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-045', date: '2026-08-24', clientName: 'BUSIME MATONGO LUC', wa: '+243993263870', urg: '+243993263870', docType: "Carte d'électeur", docNum: '33452306568', addr: '21 Av. KAYAJA, Q. KABINDULA, UVIRA', imei: '354720730169435', deposit: 40, install: 52.5, total: 2, day: '24', paid: 40, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-044', date: '2026-08-21', clientName: 'MWANAUME SHAMAVU JOHN', wa: '+243819499809', urg: '243819499809', docType: "Carte d'électeur", docNum: '33526498952', addr: '00 Av. MAKUTA, Q. MUBUKU, BUNYAKIRI', imei: '354720730169799', deposit: 130, install: 15, total: 1, day: '21', paid: 130, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-043', date: '2026-08-21', clientName: 'BARUTI NDWARE GLOIRE', wa: '+243828471006', urg: '+243828471006', docType: "Carte d'électeur", docNum: '33457502076', addr: '34 Av. SOLANGE, Q. KALUNDU, UVIRA', imei: '356510347403121', deposit: 50, install: 65, total: 2, day: '05', paid: 120, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-042', date: '2026-08-19', clientName: 'BUNANI MUDUMBI SIMON', wa: '+243821101510', urg: '+243821101510', docType: "Carte d'électeur", docNum: '33454504177', addr: '02 Av. FEZA, Q. ROMBE 1, UVIRA', imei: '354112426915935', deposit: 50, install: 100, total: 2, day: '19', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-041', date: '2026-08-19', clientName: 'NYANDU MUHINDO ESTHER', wa: '+243827250503', urg: '+243827250503', docType: "Carte d'électeur", docNum: '33353740342', addr: '00 Av. KIMANGA, Q. KALUNDU, UVIRA', imei: '353150401047325', deposit: 50, install: 100, total: 2, day: '19', paid: 70, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-040', date: '2026-08-19', clientName: 'MUGISHO CIZUNGU JEAN BOSCO GLOIRE', wa: '+243838268331', urg: '+243978056077', docType: "Carte d'électeur", docNum: '33641108646', addr: '000 Av. EVARISTE BAGANDA, Q. NDENDERE, BUKAVU', imei: '355726316813881', deposit: 120, install: 22.5, total: 2, day: '05', paid: 140, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-039', date: '2026-08-17', clientName: 'JEANVIER ZABULONI UMAR', wa: '+243828348742', urg: 'N/A', docType: "Carte d'électeur", docNum: '33428897795', addr: '00 Av. MUNANIRA, Q. KABINDULA, BUKAVU', imei: '356510347617712', deposit: 50, install: 65, total: 2, day: '17', paid: 115, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-038', date: '2026-08-16', clientName: 'SHUKURU MIHIGO BERNADETTE', wa: '+243810380555', urg: '+243810380555', docType: "Carte d'électeur", docNum: '33452901479', addr: '00 Av. DU CONGO, Q. KIMANGA, UVIRA', imei: '354720730176067', deposit: 50, install: 47.5, total: 2, day: '16', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-037', date: '2026-08-10', clientName: 'ANTOINETTE NTASHINGA MIRIAM', wa: '+243833922490', urg: '+243988373322', docType: "Carte d'électeur", docNum: '33654933161', addr: 'Av. NDENDERE, Q. ROUTE D UVIRA, BUKAVU', imei: '354720730170060', deposit: 50, install: 57.5, total: 2, day: '11', paid: 50, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-036', date: '2026-08-10', clientName: 'MUGISHO RWANANZA JUNIOR', wa: '+243827992967', urg: '+243827992967', docType: "Carte d'électeur", docNum: '3364713501', addr: '000 Av. ISECOF, Q. NDENDERE, BUKAVU', imei: '354720737090741', deposit: 50, install: 57.5, total: 2, day: '10', paid: 50, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-035', date: '2026-08-10', clientName: 'MWENYEMALI LONDO BABY', wa: '+243826165695', urg: '+243826165695', docType: "Carte d'électeur", docNum: '33641313735', addr: '000 Av. MUHUNGU, Q. NDENDERE, BUKAVU', imei: '356510347427070', deposit: 50, install: 65, total: 2, day: '10', paid: 180, status: 'termine', agentCode: 'AD-243-03' },
    { num: 'AM-2026-034', date: '2026-08-10', clientName: 'MUNGUAKONKWA MIRINDI ROSETTE', wa: '+243912338218', urg: '+243835700246', docType: "Carte d'électeur", docNum: '33640541405', addr: '000 Av. MBANQUE, Q. NDENDERE, BUKAVU', imei: '354720735273778', deposit: 50, install: 57.5, total: 2, day: '10', paid: 150, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-033', date: '2026-08-09', clientName: 'AGANZE BAHIZIRE ALAIN', wa: '+243979562694', urg: '+243979562694', docType: "Carte d'électeur", docNum: '33644902999', addr: '00 Av. EDAP, Q. NDENDERE, IBANDA/BUKAVU', imei: '354720730169807', deposit: 50, install: 31.67, total: 3, day: '08', paid: 75, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-032', date: '2026-08-08', clientName: 'AKILAS HAMISI HAMISI', wa: '+243997529382', urg: '+243863447253', docType: "Carte d'électeur", docNum: '3341143391', addr: '000 Av. NDENDERE, Q. GOUVERNEUR, BUKAVU', imei: '354720730170136', deposit: 50, install: 31.67, total: 3, day: '09', paid: 100, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-031', date: '2026-08-08', clientName: 'AKILAS HAMISI HAMISI', wa: '+243997529382', urg: '+243986266237', docType: "Carte d'électeur", docNum: '33641143391', addr: '000 Av. NDENDERE, Q. GOUVERNEUR, BUKWVU', imei: '354720730169534', deposit: 50, install: 31.67, total: 3, day: '09', paid: 100, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-030', date: '2026-08-08', clientName: 'AKILAS HAMISI HAMISI', wa: '+243997529382', urg: '+243986266237', docType: "Carte d'électeur", docNum: '33641143391', addr: '000 Av. NDENDERE, Q. GOUVERNEUR, BUKWVU', imei: '354720730169534', deposit: 50, install: 31.67, total: 3, day: '09', paid: 50, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-029', date: '2026-08-08', clientName: 'BISIMWA BALANGANE FRANCOIS', wa: '+243822369464', urg: '+243822369464', docType: "Carte d'électeur", docNum: '336443114052', addr: '000 Av. ISGA, Q. NDENDERE, BUKAVU', imei: '355726316811869', deposit: 50, install: 57.5, total: 2, day: '09', paid: 90, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-028', date: '2026-08-08', clientName: 'HESHIMA MULUMEODERWA ESTHER', wa: '+243972928669', urg: '+243972928669', docType: "Carte d'électeur", docNum: '33648333477', addr: '000 Av. ISGA, Q. NDENDERE, BUKAVU', imei: '353150401047721', deposit: 50, install: 66.67, total: 3, day: '08', paid: 50, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-027', date: '2026-08-07', clientName: 'KAMBALE MASHOZI ROGER', wa: '+243818834644', urg: '+243818834644', docType: "Carte d'électeur", docNum: '330778797722', addr: '000 Av. SAIO, Q. NDENDERE, BUKAVU', imei: '354112427426767', deposit: 50, install: 50, total: 3, day: '08', paid: 100, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-026', date: '2026-08-06', clientName: 'IKEMO NYAMATOMA BENJAMIN', wa: '+243971395887', urg: '243862024164', docType: "Carte d'électeur", docNum: '3364193939959', addr: '007 Av. PATRICE EMERY LUMUMBA, Q. NGUMBA, BUKAVU', imei: '351262070630851', deposit: 50, install: 66.67, total: 3, day: '07', paid: 160, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-025', date: '2026-08-06', clientName: 'NTAKALALWA MUNEGA VAINQUEUR', wa: '243991949295', urg: '243830239597', docType: "Carte d'électeur", docNum: '33640527989', addr: '000 Av. KIBOMBO, Q. NDENDERE, BUKAVU', imei: '356510347620187', deposit: 50, install: 65, total: 2, day: '08', paid: 160, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-024', date: '2026-08-06', clientName: 'CIKWANINE MIRINDI ODETTE', wa: '+24398006161', urg: '+24398006161', docType: "Carte d'électeur", docNum: '33940931473', addr: '000 Av. NYALUKEMBA, Q. CORNICHE, BUKAVU', imei: '354112427533562', deposit: 50, install: 66.67, total: 3, day: '07', paid: 250, status: 'termine', agentCode: 'AD-243-03' },
    { num: 'AM-2026-023', date: '2026-08-05', clientName: 'IKEMO NYAMATOMWA BENJAMAIN', wa: '+243972798328', urg: '+243834027336', docType: "Carte d'électeur", docNum: '33640708589', addr: '51s Av. Evariste Baganyi, Q. Nalukemba, BUKAVU', imei: '353150401047721', deposit: 50, install: 66.67, total: 3, day: '06', paid: 50, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-022', date: '2026-08-05', clientName: 'IMANI BALUNGWE CHRISTIAN', wa: '+243812533337', urg: '+243815533335', docType: "Carte d'électeur", docNum: '33646132814', addr: '000 Av. MBAQUE, Q. NDENDERE, BUKAVU', imei: '356510347626226', deposit: 80, install: 50, total: 2, day: '06', paid: 155, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-021', date: '2026-08-05', clientName: 'KAMUNTU MUTUMUAMIRHI JUSTIN', wa: '+243829736750', urg: '+243829736750', docType: "Carte d'électeur", docNum: '3339609327', addr: '000 Av. GOUVERNUEUR, Q. NDENDERE, BUKAVU', imei: '351262070477980', deposit: 80, install: 85, total: 2, day: '06', paid: 165, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-020', date: '2026-08-05', clientName: 'MURHULA MUSHENGE GERARD', wa: '840183084', urg: '840183084', docType: "Carte d'électeur", docNum: '33638312064', addr: '000 Av. MONTAGNE, Q. KASHA, GOMA', imei: '354720737090360', deposit: 50, install: 57.5, total: 2, day: '05', paid: 110, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-019', date: '2026-08-05', clientName: 'UKUMBUSHO MUKONDE OZILE', wa: '+243824003426', urg: '+243824003426', docType: "Carte d'électeur", docNum: '33583700395', addr: '00 Av. BULAMBIKA, Q. BUNYAKIRI, KALEHE', imei: '354720737090428', deposit: 78, install: 43.5, total: 2, day: '05', paid: 78, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-018', date: '2026-08-05', clientName: 'NSHOKANO NTOLE EMERY', wa: '243824690277', urg: '243826355555', docType: "Carte d'électeur", docNum: '33652515951', addr: '000 Av. NYAWERA, Q. NDENDERE, BUKAVU', imei: '356510347617969', deposit: 50, install: 65, total: 2, day: '05', paid: 150, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-017', date: '2026-08-05', clientName: 'BULANGALIRE MUNGUANKONKWA DIDIER', wa: '+243811357941', urg: '+243811357941', docType: "Carte d'électeur", docNum: '33674990480', addr: '000 Av. HYPODRROME, Q. NYALUKEMBA, BUKAVU', imei: '351262070459517', deposit: 50, install: 66.67, total: 3, day: '05', paid: 270, status: 'termine', agentCode: 'AD-243-03' },
    { num: 'AM-2026-016', date: '2026-08-05', clientName: 'DEMU MUSAGI ARNOLD', wa: '+243973470370', urg: '+243828153058', docType: "Carte d'électeur", docNum: '33449696466', addr: '078 Av. BIZIMANA, Q. PANZI, BUKAVU', imei: '355726316810648', deposit: 50, install: 57.5, total: 2, day: '05', paid: 157.5, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-015', date: '2026-08-05', clientName: 'BORQUZIMA NSINA NYOFI FLORENCE', wa: '+243974152306', urg: '+243835642977', docType: "Carte d'électeur", docNum: '33548324325', addr: '000 Av. PAGECO, Q. NDENDERE, BUKAVU', imei: '354720730170094', deposit: 30, install: 38.33, total: 3, day: '05', paid: 125, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-014', date: '2026-08-04', clientName: 'FARAJA MBALE LA ROUSSE', wa: '+243814002540', urg: '+243814002540', docType: "Carte d'électeur", docNum: '33454315909', addr: '00 Av. BURHIBA, Q. BRASSERIE, BUKAVU', imei: '351262070458774', deposit: 50, install: 100, total: 2, day: '05', paid: 50, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-013', date: '2026-08-04', clientName: 'MUHIGIRI FRIMENCI ALAIN', wa: '+243972798328', urg: '+243834027336', docType: "Carte d'électeur", docNum: '33640708589', addr: '51s Av. Evariste Baganyi, Q. Nalukemba, bukqvu', imei: '351262070632147', deposit: 50, install: 66.67, total: 3, day: '05', paid: 150, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-012', date: '2026-08-04', clientName: 'SHUKURU SERGE HERI SERGE', wa: '+243819431636', urg: '+243839925998', docType: "Carte d'électeur", docNum: '33652918929', addr: '00 Av. CHAI, Q. CHAI, BUKAVU', imei: '356510347427021', deposit: 50, install: 65, total: 2, day: '05', paid: 115, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-011', date: '2026-08-04', clientName: 'YOSAFATI NYANGO SIMPLICE', wa: '+243830729900', urg: '+243830729900', docType: "Carte d'électeur", docNum: '33636719132', addr: '00 Av. PHARMAKINA, Q. MULAMBULA, BUKAVU', imei: '356510347621045', deposit: 50, install: 65, total: 2, day: '05', paid: 115, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-010', date: '2026-08-04', clientName: 'ADULUMBA BUGIBABO GERMAIN', wa: '+243999913264', urg: '+243836715912', docType: "Carte d'électeur", docNum: '33650517343', addr: '005 Av. MOSALA, Q. KADUTU, BUKAVU', imei: '351262070481693', deposit: 50, install: 100, total: 2, day: '05', paid: 200, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-009', date: '2026-07-25', clientName: 'MUSHI MWENDANGA BERTIN', wa: '+243971806969', urg: '+243971806969', docType: "Carte d'électeur", docNum: '33648707399', addr: '01 Av. LOWA, Q. KASALI, BUKAVU', imei: '354880841279935', deposit: 40, install: 62.5, total: 2, day: '05', paid: 40, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-008', date: '2026-07-25', clientName: 'KAJURU MALEKERA LEA', wa: '+243999574226', urg: '+243999574226', docType: "Carte d'électeur", docNum: '33644912854', addr: '00 Av. AV DU LAC, Q. NYALUKEMBA, BUKAVU', imei: '351468680996216', deposit: 50, install: 65, total: 2, day: '05', paid: 125, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-007', date: '2026-07-23', clientName: 'BATUDU MASUMBUKO EMMANUEL', wa: '+243820058300', urg: '243820058300', docType: "Carte d'électeur", docNum: '33604912634', addr: '00 Av. IRAMBO, Q. NDENDERE, Goma', imei: '353995374822371', deposit: 50, install: 43.33, total: 3, day: '23', paid: 143, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-006', date: '2026-07-22', clientName: 'INNONCENT MANASSE VINCENT', wa: '+243835324152', urg: '+243835324152', docType: "Carte d'électeur", docNum: '33655936301', addr: '00 Av. DE LA PSETE, Q. PAGECO, Goma', imei: '351929937766884', deposit: 20, install: 53.33, total: 3, day: '23', paid: 20, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-005', date: '2026-07-22', clientName: 'BAGUMA RUTEGA ALAIN', wa: '+243816570464', urg: '+243836359706', docType: "Carte d'électeur", docNum: '33610105017', addr: '41 Av. SNELL, Q. CAMPS SNELL, BUKAVU', imei: '351468680844259', deposit: 70, install: 22.5, total: 8, day: '22', paid: 195, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-004', date: '2026-07-22', clientName: 'LWABOSHI NDABUKO CHRISTOPHE', wa: '+243977364803', urg: '+243824444298', docType: "Carte d'électeur", docNum: '33644911152', addr: '00 Av. KIBONGE, Q. KADUTU, BUKAVU', imei: '354880841280313', deposit: 113, install: 6.5, total: 8, day: 'Samedi', paid: 113, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-003', date: '2026-07-21', clientName: 'FURAHA ZIHALIRWA DEODATE', wa: '0998135626', urg: '0844360780', docType: "Carte d'électeur", docNum: '33640940189', addr: '00 Av. MUHUMBQ, Q. CORNISH, BUKAVU', imei: '353013593032630', deposit: 40, install: 70, total: 3, day: '21', paid: 40, status: 'en_cours', agentCode: 'AD-243-03' },
    { num: 'AM-2026-002', date: '2026-07-20', clientName: 'NABITARO MWABULUNGU NOELLA', wa: '+243808373539', urg: '+243811813514', docType: "Carte d'électeur", docNum: '33531103238', addr: '41 Av. SAIO, Q. NDENDERE, BUKAVU', imei: '354880841278697', deposit: 50, install: 38.33, total: 3, day: '25', paid: 100, status: 'en_cours', agentCode: 'DIR-243-01' },
    { num: 'AM-2026-001', date: '2026-07-20', clientName: 'GEORGES MUSHAGALUSA JEAN', wa: '+243811514758', urg: '+243811514758', docType: "Carte d'électeur", docNum: '33563423321', addr: '00 Av. NGUBA, Q. NDENDERE, BUKAVU', imei: '353013593032630', deposit: 1, install: 83, total: 3, day: '30', paid: 1, status: 'en_cours', agentCode: 'AG-243-02' },
  ];

  let imported = 0;
  let skipped = 0;

  for (const c of contracts) {
    try {
      const agentId = getAgent(c.agentCode);
      if (!agentId) { skipped++; continue; }

      const smartphoneId = getPhone(c.imei);
      if (!smartphoneId) { skipped++; continue; }

      // Parse client name
      const nameParts = c.clientName.trim().split(' ');
      const lastName = nameParts[0] || c.clientName;
      const firstName = nameParts.slice(1).join(' ') || '-';

      // Parse address
      const addrMatch = c.addr.match(/^(\S+)\s+Av\.\s+(.+),\s+Q\.\s+(.+),\s+(.+)$/i);
      const addressNum = addrMatch ? addrMatch[1] : '00';
      const addressAvenue = addrMatch ? addrMatch[2] : c.addr;
      const neighborhood = addrMatch ? addrMatch[3] : 'BUKAVU';
      const cityCommune = addrMatch ? addrMatch[4] : 'BUKAVU';

      // Upsert client
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .upsert({
          last_name: lastName,
          first_name: firstName,
          phone_whatsapp: c.wa.trim(),
          phone_urgency: c.urg.trim(),
          address_num: addressNum,
          address_avenue: addressAvenue,
          neighborhood: neighborhood,
          city_commune: cityCommune,
          identity_doc_type: c.docType,
          identity_doc_num: c.docNum,
          registered_at: c.date,
          agent_id: agentId,
        }, { onConflict: 'id' })
        .select('id')
        .single();

      if (clientErr) { err(`Client error for ${c.num}: ${clientErr.message}`); skipped++; continue; }

      const contractStatus = c.status === 'Acquitté' ? 'termine' : c.status === 'En cours' ? 'en_cours' : c.status;

      // Upsert contract
      const { error: contractErr } = await supabase
        .from('contracts')
        .upsert({
          contract_number: c.num,
          client_id: clientData.id,
          smartphone_id: smartphoneId,
          subscription_date: c.date,
          plan_type: c.total === 8 ? 'hebdo' : 'mensuel',
          initial_deposit_usd: c.deposit,
          installment_amount_usd: c.install,
          total_installments: c.total,
          payment_day: c.day,
          status: contractStatus,
          agent_id: agentId,
        }, { onConflict: 'contract_number', ignoreDuplicates: true });

      if (contractErr) { err(`Contract error for ${c.num}: ${contractErr.message}`); skipped++; continue; }

      // Insert initial deposit payment
      const { error: payErr } = await supabase
        .from('payments')
        .upsert({
          contract_number: c.num,
          client_id: clientData.id,
          amount_usd: c.deposit,
          amount_cdf: c.deposit * 2800,
          date: c.date + 'T08:00:00.000Z',
          due_date: c.date,
          payment_method: 'Espèces',
          status: 'Terminé',
          transaction_ref: `IMPORT-${c.num}-DEPOSIT`,
          agent_id: agentId,
        }, { onConflict: 'transaction_ref', ignoreDuplicates: true });

      if (payErr && !payErr.message?.includes('duplicate')) {
        warn(`Payment import warning for ${c.num}: ${payErr.message}`);
      }

      imported++;
    } catch (e) {
      err(`Exception for ${c.num}: ${e.message}`);
      skipped++;
    }
  }

  ok(`Imported ${imported} contracts (${skipped} skipped)`);
}

// ─── STEP 6: Import transactions ─────────────────────────────────────────────
async function importTransactions(agentIdMap) {
  console.log('\n💸  STEP 6: Importing 1000 real utility transactions...');

  // Agent name pattern → code map
  const agentNameToCode = {
    'BLESING KADESI': 'OP-243-08',
    'BLESSING KADESI': 'OP-243-08',
    'JOELLE MIHIGO EMMANUELA': 'AD-243-03',
    'Franck Alliance': 'DIR-243-01',
    'JOHN NSARAZA': 'AG-243-02',
  };

  const getAgentIdByName = (nameStr) => {
    for (const [name, code] of Object.entries(agentNameToCode)) {
      if (nameStr.includes(name)) {
        return agentIdMap[code];
      }
    }
    return agentIdMap['DIR-243-01']; // fallback
  };

  // All 1000 transactions from the Excel export
  // Format: [date, clientName, phone, type, currency, amount, operator, opTxNum, refNum, reason, agentNameStr]
  const rawTx = [
    ['2026-11-07T17:40:52', 'ELIEZER BASHENGEZI', '+243831696447', 'retrait', 'USD', 200, 'Voda-e', '998453849', 'UTX-018227-3138', 'VODAE 261107.1444.C91827', 'BLESING KADESI'],
    ['2026-11-07T17:39:49', 'DANIEL CHRISTIAN', '+243837473427', 'retrait', 'USD', 50, 'Voda-e', '5213038', 'UTX-953049-6544', 'VODAE DK746OAZ58G', 'BLESING KADESI'],
    ['2026-11-07T17:34:42', 'DANIEL CONGOLAIS CHRISTIAN', '+243978815996', 'retrait', 'CDF', 196500, 'Vodacom', '5213038', 'UTX-601301-4636', 'ALLER RETOUR AU 51220164 DK756OAXSUT', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T17:17:56', 'RAPHAEL SABITI', '+243817978812', 'retrait', 'CDF', 23000, 'Voda-e', '80000', 'UTX-645233-8461', 'VODAE', 'BLESING KADESI'],
    ['2026-11-07T17:02:19', 'ESPOIR JEAN', '+243815112852', 'retrait', 'CDF', 235000, 'Voda-e', '2533178', 'UTX-653550-9858', 'VODAE DK766OAQCE4', 'BLESING KADESI'],
    ['2026-11-07T16:47:59', 'IRENE LWANGO ERIC', '+243822949158', 'retrait', 'CDF', 300000, 'Vodacom', '35802278', 'UTX-749361-9743', 'ALLER RETOUR AU 5213805 DK786OALGHE', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T16:35:27', 'JACQUES FIKIRI', '+243838344544', 'retrait', 'CDF', 117500, 'Voda-e', '970169548', 'UTX-089899-9656', 'VODAE 261107.1526.F94988', 'BLESING KADESI'],
    ['2026-11-07T16:33:24', 'CIRIMWAMI BANYWESIZE', '+243981340217', 'dépôt', 'USD', 120, 'Vodacom', '2426118', 'UTX-947903-6213', 'CHANGE +243991443586', 'BLESING KADESI'],
    ['2026-11-07T16:32:03', 'ALLIANCE CHIFUNGO FRANCK', '+243816285336', 'dépôt', 'CDF', 117500, 'Vodacom', '5213551', 'UTX-861129-5580', 'CHANGE +243988006219', 'BLESING KADESI'],
    ['2026-11-07T16:24:53', 'MUSAFIRI KANGENGA NICAISSE', '+243999090592', 'retrait', 'USD', 500, 'Vodacom', '5213973', 'UTX-351292-8635', 'ALLER RETOUR AU 5213569 DK736OAJCM5', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T16:15:52', 'MUISHA KINYABUUMA JOACHIM', '0812542279', 'retrait', 'CDF', 1222000, 'Vodacom', '3259032', 'UTX-579904-4774', 'ALLER RETOUR AU 5213639 DK666O4HYCY', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T16:09:29', 'INNOCENT HERI KALIMIRA', '0977384132', 'dépôt', 'CDF', 1222000, 'Vodacom', '5213639', 'UTX-272272-9070', 'RETRAIT CASH 5213639 DK666O4HYCY', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T16:04:51', 'MUNGU OGISHE AKSANTI', '+243828075985', 'retrait', 'USD', 100, 'Voda-e', '987860978', 'UTX-240809-7285', 'VODAE 261107.1324.E85543', 'BLESING KADESI'],
    ['2026-11-07T16:00:58', 'ETS BENEDICT BUSINESS', '+243820662114', 'retrait', 'USD', 50, 'Voda-e', '5398108', 'UTX-015767-5054', 'VODAE DK756OA8DZJ', 'BLESING KADESI'],
    ['2026-11-07T15:56:23', 'ALLIANCE CHIFUNGO FRANCK', '+243816285336', 'retrait', 'CDF', 180000, 'Vodacom', '5213551', 'UTX-699886-4218', 'ALLER RETOUR AU 35808196 DK726O7EOEI', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T15:46:35', 'ETS BENJAMIN VODA BUSINESS', '+243837089467', 'retrait', 'CDF', 150000, 'Voda-e', '5213072', 'UTX-053372-5256', 'VODAE', 'BLESING KADESI'],
    ['2026-11-07T15:39:31', 'NDIBU TSHIOSHA Anaclet Equity', '+243997003077', 'retrait', 'USD', 308, 'Vodacom', '5213545', 'UTX-702131-5732', 'ALLER RETOUR AU 2197092 DK736OA9C6B', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T15:32:33', 'MWISHAKA KINYABUUMA JOACHIM', '0812442279', 'retrait', 'CDF', 164500, 'Vodacom', '3259032', 'UTX-233522-9720', 'ALLER RETOUR AU 52130245 DK646O2RUNC', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T15:24:06', 'ALI MOBILE MOISE', '+243827656965', 'retrait', 'USD', 300, 'Voda-e', '5213761', 'UTX-774700-6662', 'VODAE DK766OA6LO0', 'BLESING KADESI'],
    ['2026-11-07T15:23:30', 'VALEUR CHIFUNGO TUMAINI', '52130245', 'dépôt', 'CDF', 164500, 'Vodacom', '52130245', 'UTX-439133-6103', 'RETRAIT CASH 52130245 DK646O2RUNC', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T15:19:24', 'FRANCINE NAMBURHO', '+243826971914', 'retrait', 'USD', 200, 'Voda-e', '975506900', 'UTX-509882-5532', 'VODAE 261107.1242.A82440', 'BLESING KADESI'],
    ['2026-11-07T15:18:00', 'DAMIEN SPECIAL BARAKA', '+243829799044', 'retrait', 'USD', 100, 'Voda-e', '984769008', 'UTX-437915-1285', 'VODAE 261107.1410.E88820', 'BLESING KADESI'],
    ['2026-11-07T15:15:41', 'ETS ALI MOBILE', '+243970677150', 'dépôt', 'USD', 450, 'Vodacom', '5213904', 'UTX-309032-8173', 'CHANGE +243970677150', 'BLESING KADESI'],
    ['2026-11-07T15:09:25', 'BORA BAHATI FRANCINE', '+243822949158', 'retrait', 'CDF', 500000, 'Airtel', '35800799', 'UTX-741146-6704', 'ALLER RETOUR AU 5213805 DK776O9XJSN', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T15:06:26', 'MUSAADA VITAL MOISE', '+243817402991', 'retrait', 'USD', 100, 'Voda-e', '976492215', 'UTX-753305-7771', 'VODAE 261107.0850.E66009', 'BLESING KADESI'],
    ['2026-11-07T15:05:23', 'ETS LA VALEUR', '+243862369197', 'retrait', 'USD', 100, 'Voda-e', '983795080', 'UTX-689260-6975', 'VODAE 261107.0928.E68466', 'BLESING KADESI'],
    ['2026-11-07T15:04:34', 'VICTOR PANU', '+243833630882', 'retrait', 'USD', 50, 'Voda-e', '80000', 'UTX-648755-4356', 'VODAE', 'BLESING KADESI'],
    ['2026-11-07T15:04:03', 'BARAKA BIHINGA', '+243835276050', 'retrait', 'USD', 300, 'Voda-e', '992972270', 'UTX-610082-5052', 'VODAE 261107.1113.D75366', 'BLESING KADESI'],
    ['2026-11-07T15:03:22', 'JAMES HAMULI LUKOGO', '+243862869991', 'retrait', 'USD', 48, 'Voda-e', '978532047', 'UTX-568837-3022', 'VODAE 261107.1132.G76499', 'BLESING KADESI'],
    ['2026-11-07T15:02:13', 'MINANI CIRHAGARHULA EULALIE', '+243820919508', 'retrait', 'CDF', 117500, 'Voda-e', '52130359', 'UTX-489392-1218', 'VODAE DK736O9BO27', 'BLESING KADESI'],
    ['2026-11-07T15:01:22', 'GILBERT OMBENI ETS VAINQUEUR', '+243818098974', 'retrait', 'CDF', 70500, 'Voda-e', '35803271', 'UTX-429088-7619', 'VODAE DK736O9CLAL', 'BLESING KADESI'],
    ['2026-11-07T14:58:58', 'ZIRHU GILBERT BAGALWA', '+243810873879', 'retrait', 'CDF', 117500, 'Voda-e', '5213775', 'UTX-299642-1838', 'VODAE DK756O95ZF1', 'BLESING KADESI'],
    ['2026-11-07T14:58:04', 'USHINDI NAMEGABE', '+243838500432', 'retrait', 'USD', 47.75, 'Voda-e', '979645333', 'UTX-245559-1946', 'VODAE 261107.1227.C81671', 'BLESING KADESI'],
    ['2026-11-07T14:57:14', 'KAHUKULU MUGISHO', '+243835181968', 'retrait', 'CDF', 23500, 'Voda-e', '983868099', 'UTX-170931-2652', 'VODAE 261107.1336.A86498', 'BLESING KADESI'],
    ['2026-11-07T14:56:41', 'NDIBU TSHIOSHA Anaclet Equity', '+243997003077', 'retrait', 'USD', 132, 'Vodacom', '5213545', 'UTX-080167-4772', 'ALLER RETOUR AU 2197626 DK776O9355Z', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T14:55:49', 'GASPARD AKSANTI', '+243813352000', 'retrait', 'USD', 20, 'Voda-e', '35803819', 'UTX-069405-4654', 'VODAE DK746OA01W6', 'BLESING KADESI'],
    ['2026-11-07T14:49:31', 'DANIEL CONGOLAIS CHRISTIAN', '+243978815996', 'retrait', 'CDF', 90000, 'Vodacom', '5213038', 'UTX-689696-4083', 'ALLER RETOUR AU 5213187 DK786O9PA7C', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T14:46:18', 'MASUMBUKO CLEMENT LUCIEN', '+243999694334', 'retrait', 'CDF', 300000, 'Vodacom', '52130495', 'UTX-433696-6806', 'ALLER RETOUR AU 3343650 DK736O98AH9', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T14:38:44', 'CIRIMWAMI BANYWESIZE FRANCOIS', '+243981340217', 'retrait', 'CDF', 500000, 'Vodacom', '5213285', 'UTX-018249-8430', 'ALLER RETOUR AU 2426118 DK706O9EM28', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T14:31:27', 'CIRIMWAMI BANYWESIZE FRANCOIS', '+243981340217', 'retrait', 'CDF', 70500, 'Vodacom', '2426118', 'UTX-589013-8968', 'ALLER RETOUR AU 5093123 DK786O9TFGY', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T14:28:13', 'MAZANBI BAHATI AIMABLE', '+243976864985', 'retrait', 'CDF', 555000, 'Vodacom', '5213984', 'UTX-373746-5259', 'ALLER RETOUR AU 2845190 DK776O9CKK1', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T12:32:26', 'CUBAKA KULIMUSHI JEANPIERRE', '5213913', 'retrait', 'CDF', 100000, 'Vodacom', '5213913', 'UTX-480375-5588', 'PREMIER DEPOT DK726O8ZD5G', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-07T12:07:15', 'DANIEL CONGOLAIS CHRISTIAN', '+243978815996', 'retrait', 'CDF', 220000, 'Vodacom', '5213038', 'UTX-687856-2550', 'ALLER RETOUR AU 3431142 DK676O66K7N', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:49:36', 'NELLY NEEMA MUKENGERER', '0999694334', 'retrait', 'USD', 50, 'Voda-e', '0838755451', 'UTX-610178-7783', 'ACHAT VODAE 3343650 DK656O5GLOJ', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:46:21', 'BLESSING KADESI', '5213152', 'retrait', 'USD', 297, 'Vodacom', '5213152', 'UTX-519654-4466', 'ALLER RETOUR AU 5213761 DK656O3MEUL', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:43:24', 'MUISHA KINYABUUMA JOACHIM', '812542279', 'retrait', 'CDF', 120000, 'Vodacom', '3259032', 'UTX-311793-2421', 'ALLER RETOUR AU 52130347 DK686O5HT66', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:38:51', 'MOISE KULONDWA MAHESHE', '0970677150', 'dépôt', 'USD', 120000, 'Vodacom', '52130347', 'UTX-916879-2356', 'ECHANGE AIRTEL CONTRE M-PESA DK686O5HT66', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:30:39', 'PROSPERE CIRAZA CIRABAGULE', '243831638647', 'dépôt', 'CDF', 18000, 'Vodacom', '243831638647', 'UTX-843216-7121', 'RETRAIT CASH', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T18:14:41', 'NTAMAKO BENOIT', '0974889855', 'dépôt', 'CDF', 120000, 'Vodacom', '0974889855', 'UTX-592178-3812', 'RETRAIT CASH AU 0999518383 PP261106.1712.B455', 'JOELLE MIHIGO EMMANUELA'],
    ['2026-11-06T17:56:49', 'JOSUE BISIMWA JOMSY', '+243828344193', 'retrait', 'CDF', 117500, 'Voda-e', '35806005', 'UTX-571819-9123', 'VODAE DK676O44J5Z', 'BLESING KADESI'],
    ['2026-11-06T17:54:55', 'PRINCE OBEDI BAHATI', '+243835478690', 'retrait', 'CDF', 235000, 'Voda-e', '5213275', 'UTX-451118-6077', 'VODAE DK696O5445L', 'BLESING KADESI'],
  ];

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rawTx.length; i += BATCH_SIZE) {
    const batch = rawTx.slice(i, i + BATCH_SIZE);
    const rows = batch.map(([createdAt, clientName, phoneNumber, transactionType, currency, amount, operator, opTxNum, refNum, reason, agentNameStr]) => {
      const agentId = getAgentIdByName(agentNameStr);
      return {
        client_name: clientName.trim(),
        transaction_type: transactionType,
        phone_number: phoneNumber.trim(),
        amount: amount,
        currency: currency,
        operator: operator,
        operator_transaction_number: opTxNum,
        reference_number: refNum,
        reason: reason.trim(),
        operator_id: agentId,
        created_at: createdAt,
      };
    }).filter(r => r.operator_id);

    const { error } = await supabase
      .from('transactions')
      .upsert(rows, { onConflict: 'reference_number', ignoreDuplicates: true });

    if (error) {
      warn(`Batch ${Math.floor(i/BATCH_SIZE)+1} error: ${error.message}`);
      skipped += batch.length;
    } else {
      imported += rows.length;
    }
  }

  ok(`Imported ${imported} transactions (${skipped} skipped)`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  ALI MOBILE — AUTOMATED DATABASE SETUP');
  console.log('  Target: ' + SUPABASE_URL);
  console.log('='.repeat(60));

  try {
    await ensureTablesExist();
    const agentIdMap = await createAgents();
    const smartphoneIdMap = await importSmartphones();
    await importContracts(agentIdMap, smartphoneIdMap);
    await importTransactions(agentIdMap);

    console.log('\n' + '='.repeat(60));
    console.log('  ✅  SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n  LOGIN CREDENTIALS:');
    console.log('  ┌─────────────────────────────────────────────────────┐');
    console.log('  │  Admin:    franck.alliance@alimobile.com            │');
    console.log('  │  Password: AliMobile2026!                           │');
    console.log('  │                                                     │');
    console.log('  │  Admin:    joelle.mihigo@alimobile.com              │');
    console.log('  │  Password: AliMobile2026!                           │');
    console.log('  │                                                     │');
    console.log('  │  Operator: blesing.kadesi@alimobile.com             │');
    console.log('  │  Password: AliMobile2026!                           │');
    console.log('  └─────────────────────────────────────────────────────┘');
    console.log('\n  ⚠️   Ask the client to change passwords after first login.\n');

  } catch (e) {
    console.error('\n❌  Fatal error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
