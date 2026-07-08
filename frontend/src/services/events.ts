import { rpc, scValToNative } from '@stellar/stellar-sdk';
import { getRpcUrl } from './stellar';

type NetworkType = 'TESTNET' | 'PUBLIC' | 'STANDALONE';

export interface ParsedEvent {
  id: string;
  type: 'REGISTRATION' | 'DISTRIBUTION' | 'DEACTIVATION' | 'UPDATE';
  assetId: string;
  title: string;
  description: string;
  timestamp: number;
  hash: string;
  amount?: string;
  payer?: string;
}

/**
 * Fetches and parses contract events from the Soroban RPC server.
 */
export async function fetchContractEvents(
  network: NetworkType,
  contractIds: string[],
  startLedger: number
): Promise<{ events: ParsedEvent[]; latestLedger: number }> {
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl);

  try {
    // 1. Fetch the current network tip
    const latestLedgerResponse = await server.getLatestLedger();
    const latestLedger = latestLedgerResponse.sequence;

    // Nothing new to fetch if we are already at or past the tip.
    if (startLedger > latestLedger) {
      return { events: [], latestLedger };
    }

    // 2. Query events for ONLY the configured contract IDs.
    //    The contractIds filter is the primary isolation mechanism — it restricts
    //    the result set to events emitted by this deployment's contracts only.
    const eventsResponse = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds,
        },
      ],
      limit: 50,
    });

    const parsedEvents: ParsedEvent[] = [];

    // 3. Parse each event.
    //    event.id has the canonical format "{ledger}-{txIndex}-{eventIndex}".
    //    We preserve it verbatim so the activity store can deduplicate reliably.
    for (const event of eventsResponse.events) {
      try {
        const topics = event.topic.map((t) => scValToNative(t));
        const eventTypeSymbol = topics[0];

        if (typeof eventTypeSymbol !== 'string') continue;

        // Use the ledger close time if provided by the SDK; otherwise fall back
        // to wall-clock time.  event.ledger is available as a number.
        const timestamp =
          typeof (event as any).ledgerClosedAt === 'string'
            ? new Date((event as any).ledgerClosedAt).getTime()
            : Date.now();

        const hash = event.txHash;
        // Canonical unique ID from the RPC — never overwrite with a random value.
        const id = String(event.id);

        if (eventTypeSymbol === 'asset_registered') {
          const assetId = topics[1];
          const owner = scValToNative(event.value);
          parsedEvents.push({
            id,
            type: 'REGISTRATION',
            assetId,
            title: 'Asset Registered',
            description: `Asset "${assetId}" registered by ${String(owner).slice(0, 6)}...${String(owner).slice(-4)}`,
            timestamp,
            hash,
            payer: owner,
          });
        } else if (eventTypeSymbol === 'royalty_distributed') {
          const assetId = topics[1];
          const payer = topics[2];
          const value = scValToNative(event.value);
          const amount = Array.isArray(value) ? value[0].toString() : value.toString();
          const remainder = Array.isArray(value) ? value[1].toString() : '0';
          parsedEvents.push({
            id,
            type: 'DISTRIBUTION',
            assetId,
            title: 'Royalties Distributed',
            description: `Split ${amount} stroops for asset "${assetId}" (dust: ${remainder} stroops)`,
            timestamp,
            hash,
            amount,
            payer,
          });
        } else if (eventTypeSymbol === 'asset_deactivated') {
          const assetId = topics[1];
          const owner = scValToNative(event.value);
          parsedEvents.push({
            id,
            type: 'DEACTIVATION',
            assetId,
            title: 'Asset Deactivated',
            description: `Asset "${assetId}" was deactivated`,
            timestamp,
            hash,
            payer: owner,
          });
        } else if (eventTypeSymbol === 'asset_updated') {
          const assetId = topics[1];
          const owner = scValToNative(event.value);
          parsedEvents.push({
            id,
            type: 'UPDATE',
            assetId,
            title: 'Asset Updated',
            description: `Contributor shares for asset "${assetId}" were updated`,
            timestamp,
            hash,
            payer: owner,
          });
        }
      } catch (err) {
        console.error('[events] Failed to parse single event:', err, event);
      }
    }

    return { events: parsedEvents, latestLedger };
  } catch (err) {
    console.error('[events] Error fetching contract events:', err);
    // Return empty on error; do NOT reset the cursor — let the caller retry
    // from the same startLedger on the next tick.
    return { events: [], latestLedger: startLedger - 1 };
  }
}

/**
 * Generates a mock event to simulate activity when local blockchain ledgers are quiet.
 */
export function generateMockEvent(): ParsedEvent {
  const assetNames = ['neon_skyline.mp3', 'quantum_core_v2', 'retro_pulse_art', 'stellar_flow_lib'];
  const assetId = assetNames[Math.floor(Math.random() * assetNames.length)];
  const amount = (Math.floor(Math.random() * 500) + 50).toString();
  const txTypes: ('REGISTRATION' | 'DISTRIBUTION')[] = ['DISTRIBUTION', 'DISTRIBUTION', 'REGISTRATION'];
  const type = txTypes[Math.floor(Math.random() * txTypes.length)];

  const randomHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  if (type === 'REGISTRATION') {
    return {
      id: Math.random().toString(36).substring(2, 11),
      type: 'REGISTRATION',
      assetId,
      title: 'Asset Registered',
      description: `Asset "${assetId}" was registered with 3 contributors`,
      timestamp: Date.now(),
      hash: randomHash,
      payer: 'GD7Y...H4UI',
    };
  } else {
    return {
      id: Math.random().toString(36).substring(2, 11),
      type: 'DISTRIBUTION',
      assetId,
      title: 'Royalties Distributed',
      description: `Split ${amount} XLM for asset "${assetId}" across 3 contributors (dust: 0.002 XLM)`,
      timestamp: Date.now(),
      hash: randomHash,
      amount,
      payer: 'GB8X...K92L',
    };
  }
}
