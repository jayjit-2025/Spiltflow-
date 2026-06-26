import { rpc, scValToNative, WalletNetwork } from '@stellar/stellar-sdk';
import { getRpcUrl } from './stellar';

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
  network: WalletNetwork,
  contractIds: string[],
  startLedger: number
): Promise<{ events: ParsedEvent[]; latestLedger: number }> {
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl);

  try {
    // 1. Fetch current latest ledger to know where we are
    const latestLedgerResponse = await server.getLatestLedger();
    const latestLedger = latestLedgerResponse.sequence;

    if (startLedger >= latestLedger) {
      return { events: [], latestLedger };
    }

    // 2. Query events from startLedger to latestLedger
    const eventsResponse = await server.getEvents({
      startLedger: startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: contractIds,
        },
      ],
      limit: 50,
    });

    const parsedEvents: ParsedEvent[] = [];

    // 3. Parse each event based on its contract topics and data schema
    for (const event of eventsResponse.events) {
      try {
        const topics = event.topic.map((t) => scValToNative(t));
        const eventTypeSymbol = topics[0];

        if (typeof eventTypeSymbol !== 'string') continue;

        const timestamp = Date.now(); // RPC events don't always have a JS timestamp, fallback to current time
        const hash = event.txHash;

        if (eventTypeSymbol === 'asset_registered') {
          const assetId = topics[1];
          const owner = scValToNative(event.value);
          parsedEvents.push({
            id: `${event.id}`,
            type: 'REGISTRATION',
            assetId,
            title: 'Asset Registered',
            description: `Asset "${assetId}" was registered by owner ${owner.slice(0, 6)}...${owner.slice(-4)}`,
            timestamp,
            hash,
            payer: owner,
          });
        } else if (eventTypeSymbol === 'royalty_distributed') {
          const assetId = topics[1];
          const payer = topics[2];
          // Value contains (amount, remainder)
          const value = scValToNative(event.value);
          const amount = value[0].toString();
          const remainder = value[1].toString();

          parsedEvents.push({
            id: `${event.id}`,
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
            id: `${event.id}`,
            type: 'DEACTIVATION',
            assetId,
            title: 'Asset Deactivated',
            description: `Asset "${assetId}" was deactivated by owner`,
            timestamp,
            hash,
            payer: owner,
          });
        } else if (eventTypeSymbol === 'asset_updated') {
          const assetId = topics[1];
          const owner = scValToNative(event.value);
          parsedEvents.push({
            id: `${event.id}`,
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
        console.error('Failed to parse single event:', err, event);
      }
    }

    return { events: parsedEvents, latestLedger };
  } catch (err) {
    console.error('Error fetching contract events:', err);
    // In case of error, return empty but keep the same startLedger
    return { events: [], latestLedger: startLedger };
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
