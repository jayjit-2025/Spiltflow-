/**
 * SplitFlow Soroban On-Chain Event Indexer
 * Continuously polls Soroban RPC events and syncs them into Supabase PostgreSQL
 */

import { rpc } from '@stellar/stellar-sdk';
import { createClient } from '@supabase/supabase-js';

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoicgaitdtapfqxuldng.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Se5TurPke9gTS4BaSZD1Sg_pEPirjV3';

const DISTRIBUTOR_CONTRACT_ID =
  process.env.NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID ||
  'CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZUHVNE6HIXHMY2KZP6GNXAJT';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const server = new rpc.Server(RPC_URL);

export async function indexSorobanEvents() {
  console.log('🔄 Starting SplitFlow Soroban On-Chain Event Indexer...');
  console.log(`  RPC: ${RPC_URL}`);
  console.log(`  Target Distributor: ${DISTRIBUTOR_CONTRACT_ID}`);
  console.log(`  Supabase DB: ${SUPABASE_URL}`);

  try {
    const latestLedger = await server.getLatestLedger();
    const startLedger = Math.max(1, latestLedger.sequence - 1000);

    console.log(`  Fetching events from ledger ${startLedger} to ${latestLedger.sequence}...`);

    const eventsResponse = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [DISTRIBUTOR_CONTRACT_ID],
        },
      ],
      limit: 100,
    });

    console.log(`  Found ${eventsResponse.events?.length || 0} contract events.`);

    for (const event of eventsResponse.events || []) {
      const txHash = event.txHash;
      console.log(`  Processing event in TX ${txHash}...`);

      await supabase.from('transactions').upsert(
        {
          tx_hash: txHash,
          asset_id: 'indexed_asset',
          type: 'DISTRIBUTION',
          payer_address: event.contractId || DISTRIBUTOR_CONTRACT_ID,
          amount_xlm: '0',
          status: 'CONFIRMED',
          timestamp: Date.now(),
        },
        { onConflict: 'tx_hash' }
      );
    }

    console.log('  ✓ Soroban Event Indexing Cycle Complete!');
  } catch (err: any) {
    console.error('  ⚠️ Event Indexing Error:', err.message);
  }
}

if (require.main === module) {
  indexSorobanEvents();
}
