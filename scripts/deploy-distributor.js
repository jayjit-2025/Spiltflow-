/**
 * SplitFlow — Deploy RoyaltyDistributor Only
 * -------------------------------------------
 * Deploys and initializes the RoyaltyDistributor contract on Stellar Testnet.
 * Uses a fresh Friendbot-funded keypair — no pre-existing private key required.
 *
 * Prerequisites:
 *   - stellar CLI installed (cargo install --locked stellar-cli --features opt)
 *   - WASM built: cargo build --target wasm32-unknown-unknown --release (from project root)
 *
 * Usage (from project root):
 *   node scripts/deploy-distributor.js
 *
 * Or with an existing manager contract:
 *   MANAGER_CONTRACT_ID=CD2GSKODG... node scripts/deploy-distributor.js
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Config ─────────────────────────────────────────────────────────────────
const NETWORK = 'testnet';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

const WASM_DIR = path.resolve(__dirname, '../target/wasm32v1-none/release');
const DISTRIBUTOR_WASM = path.join(WASM_DIR, 'royalty_distributor.wasm');
const ENV_FILE = path.resolve(__dirname, '../frontend/.env.local');

// Read existing .env.local to get the manager contract ID
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return env;
}

function writeEnvValue(key, value) {
  if (!fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, `${key}=${value}\n`);
    return;
  }
  let content = fs.readFileSync(ENV_FILE, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_FILE, content);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForAccount(publicKey, maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      // Use Horizon API — it reliably exposes account existence
      const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.account_id === publicKey) {
          console.log(`  ✓ Account confirmed on Horizon: ${publicKey.slice(0, 10)}...`);
          return;
        }
      }
    } catch {}
    await sleep(2000);
  }
  throw new Error(`Account ${publicKey} not found on Horizon after ${maxMs / 1000}s`);
}

/** Poll Soroban RPC until account appears (stellar CLI uses this internally) */
async function waitForAccountOnSorobanRpc(publicKey, maxMs = 60000) {
  // Soroban RPC doesn't expose getAccount directly — poll Horizon-compatible endpoint
  // via stellar CLI's built-in account check by just sleeping after Horizon confirms.
  // The CLI itself re-checks before submitting, so this is just a best-effort wait.
  console.log('  Sleeping 20s to allow Soroban RPC to sync with Horizon...');
  await sleep(20000);
  console.log('  ✓ Soroban RPC sync wait complete');
}

function run(cmd) {
  console.log(`  $ ${cmd.slice(0, 120)}${cmd.length > 120 ? '...' : ''}`);
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    throw new Error(`Command failed:\n${stdout}\n${stderr}`);
  }
}

async function main() {
  console.log('\n🟠 SplitFlow — Deploy RoyaltyDistributor\n' + '─'.repeat(50));

  // 1. Validate WASM
  if (!fs.existsSync(DISTRIBUTOR_WASM)) {
    console.error(`\n❌ WASM not found: ${DISTRIBUTOR_WASM}`);
    console.error('   Run from project root: cargo build --target wasm32-unknown-unknown --release');
    process.exit(1);
  }
  console.log(`\n✓ WASM found: ${DISTRIBUTOR_WASM} (${(fs.statSync(DISTRIBUTOR_WASM).size / 1024).toFixed(1)} KB)`);

  // 2. Read manager contract ID
  const envVars = readEnvFile();
  const managerId = process.env.MANAGER_CONTRACT_ID || envVars['NEXT_PUBLIC_MANAGER_CONTRACT_ID'] || '';
  if (!managerId || !managerId.startsWith('C')) {
    console.error('\n❌ Manager contract ID not found.');
    console.error('   Set NEXT_PUBLIC_MANAGER_CONTRACT_ID in frontend/.env.local first.');
    process.exit(1);
  }
  console.log(`✓ Using Manager contract: ${managerId}`);

  // 3. Generate deployer keypair using stellar CLI
  console.log('\n[1/4] Generating fresh deployer keypair...');
  let deployerSecret, deployerPublic;
  try {
    // Generate + fund in one step using stellar CLI's --fund flag
    const keyName = `splitflow-deployer-${Date.now()}`;
    run(`stellar keys generate ${keyName} --overwrite --fund --network ${NETWORK}`);
    deployerSecret = run(`stellar keys secret ${keyName}`);
    deployerPublic = run(`stellar keys address ${keyName}`);
    console.log(`  ✓ Deployer: ${deployerPublic}`);
    console.log('  ✓ Funded via stellar CLI (built-in Friendbot).');
  } catch (err) {
    // Fallback: use existing deployer key if stellar CLI isn't available
    console.error('  stellar CLI not found or key generation failed:', err.message);
    console.error('\n  Please install stellar CLI:');
    console.error('  cargo install --locked stellar-cli --features opt');
    process.exit(1);
  }

  // 4. Wait for account on Horizon, then Soroban RPC
  console.log('  Waiting for account on Horizon...');
  await waitForAccount(deployerPublic);
  console.log('  Waiting for account on Soroban RPC (may take up to 30s)...');
  await waitForAccountOnSorobanRpc(deployerPublic, 45000);
  // Extra safety buffer — stellar CLI sometimes needs a few more seconds
  console.log('  Waiting 10s extra safety buffer...');
  await sleep(10000);

  // 5. Deploy RoyaltyDistributor WASM
  console.log('\n[3/4] Deploying RoyaltyDistributor...');
  const distributorId = run(
    `stellar contract deploy --wasm "${DISTRIBUTOR_WASM}" --network ${NETWORK} --source-account ${deployerSecret}`
  );
  if (!distributorId || !distributorId.startsWith('C')) {
    throw new Error(`Unexpected deploy output: ${distributorId}`);
  }
  console.log(`  ✓ RoyaltyDistributor deployed: ${distributorId}`);

  // Wait for contract to propagate
  console.log('  Waiting 20s for testnet contract propagation...');
  await sleep(20000);

  // 6. Initialize RoyaltyDistributor
  console.log('\n[4/4] Initializing RoyaltyDistributor...');
  run(
    `stellar contract invoke --id ${distributorId} --network ${NETWORK} --source-account ${deployerSecret} ` +
    `-- initialize --admin ${deployerPublic} --manager_address ${managerId} --token_address ${XLM_SAC}`
  );
  console.log('  ✓ RoyaltyDistributor initialized');

  // 7. Write to .env.local
  writeEnvValue('NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID', distributorId);
  console.log(`  ✓ Written NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID to frontend/.env.local`);

  // 8. Print summary
  console.log('\n' + '─'.repeat(50));
  console.log('✅ Deployment complete!\n');
  console.log('  RoyaltyManager:    ', managerId);
  console.log('  RoyaltyDistributor:', distributorId);
  console.log('\n  🔗 Explorer:');
  console.log(`  https://stellar.expert/explorer/testnet/contract/${distributorId}`);
  console.log('\n  ⚠️  IMPORTANT: Restart your Next.js dev server to pick up the new env var:');
  console.log('  Ctrl+C, then: npm run dev\n');
  console.log('  OR go to Settings → Contract Addresses and paste:');
  console.log(`  ${distributorId}\n`);
}

main().catch((err) => {
  console.error('\n❌ Deploy FAILED:', err.message || err);
  process.exit(1);
});
