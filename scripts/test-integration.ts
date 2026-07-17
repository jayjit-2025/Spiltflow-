/**
 * SplitFlow Integration Test Script
 * ------------------------------------
 * Verifies the full on-chain flow on Stellar Testnet:
 *   1. Fund fresh keypairs via Friendbot
 *   2. Deploy the RoyaltyManager contract (or use env vars)
 *   3. Deploy the RoyaltyDistributor contract (or use env vars)
 *   4. Register an asset with three contributors
 *   5. Distribute 100 XLM worth of token to that asset
 *   6. Verify each contributor received the correct amount
 *
 * Run: npx ts-node -O '{"target":"es2022","module":"commonjs"}' scripts/test-integration.ts
 *      (from the repo root, with NODE_PATH=frontend/node_modules)
 *
 * Or set MANAGER_CONTRACT_ID and DISTRIBUTOR_CONTRACT_ID to skip deployment.
 */

import {
  Keypair,
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Operation,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
} from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration ─────────────────────────────────────────────
const RPC_URL = process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = 'https://friendbot.stellar.org/?addr=';

// Contract WASM paths — cargo workspace builds to the root target/ dir
const WASM_DIR = fs.existsSync(path.resolve(__dirname, '../target/wasm32v1-none/release/royalty_manager.wasm'))
  ? path.resolve(__dirname, '../target/wasm32v1-none/release')
  : path.resolve(__dirname, '../target/wasm32-unknown-unknown/release');
const MANAGER_WASM = path.join(WASM_DIR, 'royalty_manager.wasm');
const DISTRIBUTOR_WASM = path.join(WASM_DIR, 'royalty_distributor.wasm');

// ── Helpers ───────────────────────────────────────────────────
const server = new rpc.Server(RPC_URL, { allowHttp: false });

async function fundAccount(keypair: Keypair): Promise<void> {
  // Node 18+ global fetch; no external dep needed
  const res = await fetch(`${FRIENDBOT_URL}${keypair.publicKey()}`);
  if (!res.ok) {
    throw new Error(`Friendbot failed for ${keypair.publicKey()}: ${res.statusText}`);
  }
  console.log(`  ✓ Funded ${keypair.publicKey().slice(0, 10)}... (waiting for ledger)`);
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Poll RPC until account is confirmed on-ledger (max 30s) */
async function waitForAccount(keypair: Keypair): Promise<void> {
  const maxWait = 30_000;
  const interval = 2000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      await server.getAccount(keypair.publicKey());
      console.log(`  ✓ Account confirmed on-ledger: ${keypair.publicKey().slice(0, 10)}...`);
      return;
    } catch {
      await sleep(interval);
    }
  }
  throw new Error(`Account ${keypair.publicKey()} not found on ledger after ${maxWait / 1000}s`);
}

async function submitTx(tx: any): Promise<string> {
  const response = await server.sendTransaction(tx);
  if (response.status === 'ERROR') {
    throw new Error(`Submit failed: ${JSON.stringify(response.errorResult)}`);
  }
  const hash = response.hash;
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const status = await server.getTransaction(hash);
    if (status.status === 'SUCCESS') {
      return hash;
    }
    if (status.status === 'FAILED') {
      throw new Error(`Transaction FAILED: ${JSON.stringify(status)}`);
    }
  }
  throw new Error(`Transaction timed out: ${hash}`);
}

async function buildAndSign(source: Keypair, operations: xdr.Operation[]): Promise<any> {
  const account = await server.getAccount(source.publicKey());
  let builder = new TransactionBuilder(account, {
    fee: String(10 * parseInt(BASE_FEE)),
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  for (const op of operations) {
    builder = builder.addOperation(op);
  }
  const tx = builder.setTimeout(30).build();

  // Simulate
  const simResult = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation error: ${JSON.stringify((simResult as any).error)}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(source);
  return preparedTx;
}

async function invokeContract(
  caller: Keypair,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal | null> {
  const contract = new Contract(contractId);
  const op = contract.call(method, ...args);
  const tx = await buildAndSign(caller, [op]);
  const hash = await submitTx(tx);

  const result = await server.getTransaction(hash);
  if (result.status !== 'SUCCESS') throw new Error(`Invoke ${method} failed`);
  const returnValue = (result as any).returnValue;
  return returnValue ?? null;
}

// ── Main Integration Test ─────────────────────────────────────
async function main() {
  console.log('\n🟠 SplitFlow Integration Test Suite\n' + '─'.repeat(50));

  // 1. Generate test accounts
  const admin = Keypair.random();
  const contributor1 = Keypair.random();
  const contributor2 = Keypair.random();
  const contributor3 = Keypair.random();
  const payer = Keypair.random();

  console.log('\n[1/6] Funding accounts via Friendbot...');
  await Promise.all([
    fundAccount(admin),
    fundAccount(contributor1),
    fundAccount(contributor2),
    fundAccount(contributor3),
    fundAccount(payer),
  ]);
  // Wait until admin account is confirmed on-ledger before trying CLI deployment
  await waitForAccount(admin);

  // 2. Deploy / use existing contracts
  let managerId = process.env.MANAGER_CONTRACT_ID;
  let distributorId = process.env.DISTRIBUTOR_CONTRACT_ID;

  if (!managerId || !distributorId) {
    console.log('\n[2-3/6] Deploying and initializing contracts via Stellar CLI...');
    const { execSync } = require('child_process');
    const adminSecret = admin.secret();

    // Derive public key from secret
    const adminPublicKey = admin.publicKey();

    if (!fs.existsSync(MANAGER_WASM)) {
      throw new Error(
        `WASM not found at ${MANAGER_WASM}.\nBuild contracts first: cargo build --target wasm32-unknown-unknown --release`
      );
    }

    try {
      // Deploy manager
      console.log('  Deploying RoyaltyManager...');
      managerId = execSync(
        `stellar contract deploy --wasm "${MANAGER_WASM}" --network testnet --source-account ${adminSecret} --fee 1000000`,
        { encoding: 'utf8' }
      ).trim();
      console.log(`  ✓ RoyaltyManager: ${managerId}`);

      // Deploy distributor
      console.log('  Deploying RoyaltyDistributor...');
      distributorId = execSync(
        `stellar contract deploy --wasm "${DISTRIBUTOR_WASM}" --network testnet --source-account ${adminSecret} --fee 1000000`,
        { encoding: 'utf8' }
      ).trim();
      console.log(`  ✓ RoyaltyDistributor: ${distributorId}`);

      // Initialize manager
      console.log('  Initializing RoyaltyManager...');
      execSync(
        `stellar contract invoke --id ${managerId} --network testnet --source-account ${adminSecret} -- initialize --admin ${adminPublicKey}`,
        { encoding: 'utf8' }
      );
      console.log('  ✓ RoyaltyManager initialized');

      // Initialize distributor
      console.log('  Initializing RoyaltyDistributor...');
      execSync(
        `stellar contract invoke --id ${distributorId} --network testnet --source-account ${adminSecret} -- initialize --admin ${adminPublicKey} --manager_address ${managerId} --token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`,
        { encoding: 'utf8' }
      );
      console.log('  ✓ RoyaltyDistributor initialized');
    } catch (deployError: any) {
      console.error('❌ Deployment failed:', deployError.stdout || deployError.message);
      process.exit(1);
    }
  } else {
    console.log(`\n[2-3/6] Using pre-deployed contracts:`);
    console.log(`  Manager:     ${managerId}`);
    console.log(`  Distributor: ${distributorId}`);
  }

  // 4. Register an asset
  console.log('\n[4/6] Registering asset "test_track_001"...');

  const scContributors = [
    { address: contributor1.publicKey(), share: 5000 },
    { address: contributor2.publicKey(), share: 3000 },
    { address: contributor3.publicKey(), share: 2000 },
  ].map((c) =>
    nativeToScVal(
      { address: c.address, share: c.share },
      {
        type: {
          address: ['symbol', 'address'],
          share: ['symbol', 'u32'],
        },
      }
    )
  );

  await invokeContract(admin, managerId!, 'register_asset', [
    nativeToScVal('test_track_001', { type: 'symbol' }),
    nativeToScVal(admin.publicKey(), { type: 'address' }),
    nativeToScVal(scContributors),
  ]);
  console.log('  ✓ Asset registered on-chain with 3 contributors');

  // 4b. Verify get_asset() can retrieve it
  console.log('\n[4b] Verifying get_asset() retrieves the asset...');
  const getAssetResult = await invokeContract(admin, managerId!, 'get_asset', [
    nativeToScVal('test_track_001', { type: 'symbol' }),
  ]);
  if (!getAssetResult) throw new Error('get_asset() returned null — asset not persisted!');
  const parsedAsset = scValToNative(getAssetResult);
  console.log('  ✓ get_asset() returned:', JSON.stringify(parsedAsset, null, 2));

  if (!parsedAsset.contributors || parsedAsset.contributors.length !== 3) {
    throw new Error(`Expected 3 contributors, got ${parsedAsset.contributors?.length}`);
  }
  console.log('  ✓ All 3 contributors confirmed in on-chain storage');

  const XLM_SAC =
    process.env.XLM_SAC_ID ?? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

  async function getBalance(addr: string): Promise<bigint> {
    const result = await invokeContract(admin, XLM_SAC, 'balance', [
      nativeToScVal(addr, { type: 'address' }),
    ]);
    return result ? BigInt(scValToNative(result)) : BigInt(0);
  }

  // 5. Record initial balances before distribution
  const initialBal1 = await getBalance(contributor1.publicKey());
  const initialBal2 = await getBalance(contributor2.publicKey());
  const initialBal3 = await getBalance(contributor3.publicKey());

  console.log('\n[5/6] Distributing 100 XLM to "test_track_001"...');
  const AMOUNT_STROOPS = BigInt(100_000_000); // 100 XLM

  await invokeContract(payer, distributorId!, 'distribute_royalty', [
    nativeToScVal(payer.publicKey(), { type: 'address' }),
    nativeToScVal('test_track_001', { type: 'symbol' }),
    nativeToScVal(AMOUNT_STROOPS, { type: 'i128' }),
  ]);
  console.log('  ✓ Distribution transaction submitted');

  // 6. Verify balances
  console.log('\n[6/6] Verifying contributor balances...');
  const bal1 = await getBalance(contributor1.publicKey());
  const bal2 = await getBalance(contributor2.publicKey());
  const bal3 = await getBalance(contributor3.publicKey());

  console.log(`  Contributor 1 (50%): ${bal1} stroops (+${bal1 - initialBal1})`);
  console.log(`  Contributor 2 (30%): ${bal2} stroops (+${bal2 - initialBal2})`);
  console.log(`  Contributor 3 (20%): ${bal3} stroops (+${bal3 - initialBal3})`);

  const tolerance = BigInt(1);
  const expected1 = initialBal1 + (AMOUNT_STROOPS * BigInt(50)) / BigInt(100);
  const expected2 = initialBal2 + (AMOUNT_STROOPS * BigInt(30)) / BigInt(100);
  const expected3 = initialBal3 + (AMOUNT_STROOPS * BigInt(20)) / BigInt(100);

  if (bal1 < expected1 - tolerance || bal1 > expected1 + tolerance) {
    throw new Error(`Contributor 1 balance mismatch: expected ~${expected1}, got ${bal1}`);
  }
  if (bal2 < expected2 - tolerance || bal2 > expected2 + tolerance) {
    throw new Error(`Contributor 2 balance mismatch: expected ~${expected2}, got ${bal2}`);
  }
  if (bal3 < expected3 - tolerance || bal3 > expected3 + tolerance) {
    throw new Error(`Contributor 3 balance mismatch: expected ~${expected3}, got ${bal3}`);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ All integration tests PASSED!\n');
  console.log('Summary:');
  console.log(`  RoyaltyManager:    ${managerId}`);
  console.log(`  RoyaltyDistributor: ${distributorId}`);
  console.log('\nUpdate frontend/.env.local with these contract IDs to use the live contracts.');
}

main().catch((err) => {
  console.error('\n❌ Integration test FAILED:', err.message ?? err);
  process.exit(1);
});
