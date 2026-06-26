/**
 * SplitFlow Contract Initialization Script
 * ------------------------------------------
 * Calls initialize() on RoyaltyManager after first deployment.
 * Safe to run once — subsequent calls are rejected by the contract.
 *
 * Usage:
 *   DEPLOYER_SECRET_KEY=S... MANAGER_CONTRACT_ID=C... npx ts-node scripts/initialize.ts
 */

import { execSync } from 'child_process';
import * as path from 'path';

const DEPLOYER_SECRET = process.env.DEPLOYER_SECRET_KEY;
const MANAGER_ID = process.env.MANAGER_CONTRACT_ID;
const network = process.env.NETWORK ?? 'testnet';

if (!DEPLOYER_SECRET || !MANAGER_ID) {
  console.error('❌ Required: DEPLOYER_SECRET_KEY and MANAGER_CONTRACT_ID env vars.');
  process.exit(1);
}

function run(cmd: string): string {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

async function main() {
  console.log('\n🟠 SplitFlow Initialize Script\n' + '─'.repeat(50));

  // Derive public key from secret
  let adminPubKey: string;
  try {
    adminPubKey = run(`stellar keys address ${DEPLOYER_SECRET}`);
  } catch {
    // Fallback: decode manually
    const { Keypair } = await import('@stellar/stellar-sdk');
    adminPubKey = Keypair.fromSecret(DEPLOYER_SECRET).publicKey();
  }
  console.log(`  Admin: ${adminPubKey}`);

  console.log('\n[1/1] Calling initialize() on RoyaltyManager...');
  run(
    `stellar contract invoke \
      --id ${MANAGER_ID} \
      --network ${network} \
      --source-account ${DEPLOYER_SECRET} \
      -- initialize \
      --admin ${adminPubKey}`
  );

  console.log('\n✅ RoyaltyManager initialized. Admin set to:', adminPubKey, '\n');
}

main().catch((err) => {
  console.error('\n❌ Initialization FAILED:', err.message ?? err);
  process.exit(1);
});
