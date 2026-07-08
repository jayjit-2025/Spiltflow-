'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useActivityStore, ActivityItem } from '@/store/useActivityStore';
import { useWalletStore } from '@/store/useWalletStore';
import { fetchContractEvents, generateMockEvent } from '@/services/events';
import {
  Activity,
  Compass,
  Coins,
  HelpCircle,
  Clock,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

// ─── Canonical contract IDs from environment variables ──────────────────────
// IMPORTANT: We always read from env vars for event filtering, never from
// localStorage. This ensures we only receive events from *this* deployment's
// contracts, not from any other user's deployment that may share the same
// contract code on testnet.
const MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_MANAGER_CONTRACT_ID ||
  'CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4';
const DISTRIBUTOR_CONTRACT_ID =
  process.env.NEXT_PUBLIC_DISTRIBUTOR_CONTRACT_ID ||
  'CAGLWDRQ2IIRGIFGJJZTUA4LM3KLEOCFZUHVNE6HIXHMY2KZP6GNXAJT';

/**
 * Returns the set of contract IDs to subscribe to.
 * Only non-empty, valid Stellar contract IDs (starting with 'C') are included.
 */
function getContractIdFilter(): string[] {
  return [MANAGER_CONTRACT_ID, DISTRIBUTOR_CONTRACT_ID].filter(
    (id) => typeof id === 'string' && id.startsWith('C') && id.length === 56
  );
}

export default function ActivityFeedPage() {
  const { activities, addActivity, clearActivities } = useActivityStore();
  const { network } = useWalletStore();

  // Polling live/paused toggle
  const [isLive, setIsLive] = useState(true);
  // Simulation mode: generate local mock events instead of querying RPC
  const [simulationMode, setSimulationMode] = useState(false);

  // ── Cursor: the ledger sequence number we last successfully processed. ─────
  // We store this in a ref (not state) so the polling interval closure always
  // sees the latest value without needing to be re-created on every update.
  // Initial value of -1 signals "not yet initialised".
  const cursorRef = useRef<number>(-1);

  // Track whether we have completed the first-ledger initialisation.
  const initialisedRef = useRef(false);

  // ── Simulation event counter for unique IDs ────────────────────────────────
  const simCounterRef = useRef(0);

  // ── Effect: initialise the cursor to the current latest ledger on mount ───
  // This is the fix for Bug 1 (startLedger=0).
  // We fetch the latest ledger ONCE and set the cursor to that value.
  // The polling loop then starts from latestLedger+1, so only new events
  // emitted after this page was opened are shown.
  useEffect(() => {
    let cancelled = false;

    async function initCursor() {
      try {
        const { getRpcUrl } = await import('@/services/stellar');
        const { rpc } = await import('@stellar/stellar-sdk');
        const server = new rpc.Server(getRpcUrl(network));
        const latestLedgerResponse = await server.getLatestLedger();
        if (!cancelled) {
          // Start polling from the NEXT ledger after the current tip.
          // This means we will only surface events that occur from this moment
          // onwards, ignoring all historical testnet events.
          cursorRef.current = latestLedgerResponse.sequence;
          initialisedRef.current = true;
          console.log(
            '[ActivityFeed] Cursor initialised at ledger',
            latestLedgerResponse.sequence,
            '— polling will surface events from ledger',
            latestLedgerResponse.sequence + 1,
            'onwards'
          );
        }
      } catch (err) {
        console.error('[ActivityFeed] Failed to initialise ledger cursor:', err);
        // Fallback: if we cannot reach the RPC, use a sentinel that forces
        // the interval to wait until the cursor is set before fetching.
        if (!cancelled) {
          // Leave initialisedRef.current = false so the interval skips.
        }
      }
    }

    initCursor();
    return () => {
      cancelled = true;
    };
  }, [network]);

  // ── Effect: polling interval ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;

    const contractIds = getContractIdFilter();

    const interval = setInterval(async () => {
      if (simulationMode) {
        // ── Simulation branch ──────────────────────────────────────────────
        // Generate a random mock event. These are clearly labelled as
        // SIMULATED so they are never confused with real on-chain data.
        if (Math.random() > 0.4) {
          const mockEvent = generateMockEvent();
          simCounterRef.current += 1;
          addActivity({
            ...mockEvent,
            // Prefix with 'sim-' to guarantee these IDs never collide with
            // real RPC event IDs (format: "{ledger}-{contractIndex}-{eventIndex}")
            id: `sim-${Date.now()}-${simCounterRef.current}`,
            source: 'SIMULATED',
          });
        }
        return;
      }

      // ── Real mode branch ───────────────────────────────────────────────────
      // Wait until the cursor has been initialised by the mount effect above.
      if (!initialisedRef.current || cursorRef.current < 0) {
        console.debug('[ActivityFeed] Cursor not yet initialised, skipping poll tick');
        return;
      }

      if (contractIds.length === 0) {
        console.warn('[ActivityFeed] No valid contract IDs configured. Check env vars.');
        return;
      }

      // The next ledger to fetch starts at cursor + 1.
      // This is the fix for Bug 2 (inclusive startLedger causing duplicates).
      const startLedger = cursorRef.current + 1;

      try {
        const result = await fetchContractEvents(network, contractIds, startLedger);

        if (result.events.length > 0) {
          console.log(
            `[ActivityFeed] Found ${result.events.length} new event(s) from ledger ${startLedger} → ${result.latestLedger}`
          );
          result.events.forEach((ev) =>
            addActivity({
              ...ev,
              source: 'REAL',
            })
          );
        }

        // Advance cursor to the latest ledger returned by the RPC.
        // Next poll will start from result.latestLedger + 1.
        // This is the fix for Bug 2.
        if (result.latestLedger > cursorRef.current) {
          cursorRef.current = result.latestLedger;
        }
      } catch (err) {
        console.error('[ActivityFeed] Error fetching ledger events:', err);
        // Do NOT reset the cursor on error — keep it where it was so the
        // next tick will retry from the same safe position.
      }
    }, 5000);

    return () => clearInterval(interval);
    // Note: we intentionally do NOT include cursorRef in the dependency array.
    // It is a ref and its mutation does not require the interval to be recreated.
  }, [isLive, simulationMode, network, addActivity]);

  // ── When simulation mode is turned off, clear any simulated events ─────────
  useEffect(() => {
    if (!simulationMode) {
      // Remove only the simulated entries — leave real and local events in place
      // by using the store's filtered mutation.
      useActivityStore.setState((state) => ({
        activities: state.activities.filter((a) => a.source !== 'SIMULATED'),
      }));
    }
  }, [simulationMode]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const getEventIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'REGISTRATION':
        return <Compass className="h-4 w-4 text-primary" />;
      case 'DISTRIBUTION':
        return <Coins className="h-4 w-4 text-green-400" />;
      case 'DEACTIVATION':
        return <Pause className="h-4 w-4 text-destructive" />;
      case 'UPDATE':
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const realCount = activities.filter((a) => a.source === 'REAL' || a.source === 'LOCAL').length;
  const simCount = activities.filter((a) => a.source === 'SIMULATED').length;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary animate-pulse" />
            <span>Activity Feed</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time ledger monitor — only events from this deployment&apos;s contracts are shown.
          </p>
          {/* Show the contract IDs being monitored so the user can verify */}
          <div className="mt-2 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-muted-foreground">
              📋 Manager: {MANAGER_CONTRACT_ID.slice(0, 12)}…{MANAGER_CONTRACT_ID.slice(-6)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              📋 Distributor:{' '}
              {DISTRIBUTOR_CONTRACT_ID
                ? `${DISTRIBUTOR_CONTRACT_ID.slice(0, 12)}…${DISTRIBUTOR_CONTRACT_ID.slice(-6)}`
                : 'not configured'}
            </span>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Simulation */}
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
              simulationMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>{simulationMode ? 'Simulation Mode: On' : 'Enable Simulation'}</span>
          </button>

          {/* Toggle Live Polling */}
          <button
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary border border-border text-foreground font-bold text-xs rounded-xl hover:bg-secondary/80 cursor-pointer"
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-500" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-green-500" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          {/* Clear Button */}
          <button
            onClick={clearActivities}
            className="px-4 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive-foreground hover:bg-destructive/20 font-bold text-xs rounded-xl cursor-pointer"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Simulation warning banner */}
      {simulationMode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span>
            Simulation Mode active — events below marked{' '}
            <span className="font-mono bg-amber-500/20 px-1 rounded">SIM</span> are locally
            generated and do not reflect real on-chain activity.
          </span>
        </div>
      )}

      {/* Activities Stream */}
      <div className="max-w-4xl w-full mx-auto p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isLive ? 'Live Ledger Stream' : 'Stream Paused'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-green-400 uppercase">
              {realCount} On-chain
            </span>
            {simCount > 0 && (
              <span className="text-[10px] font-bold text-amber-400 uppercase">
                {simCount} Simulated
              </span>
            )}
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Clock
              className="h-10 w-10 text-muted-foreground animate-spin"
              style={{ animationDuration: '4s' }}
            />
            <h4 className="font-bold text-foreground text-sm">Listening for Ledger Events</h4>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              No events from this deployment detected yet. Register an asset or distribute
              royalties from the Dashboard to see events appear here immediately.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors animate-in slide-in-from-bottom-2 duration-300 ${
                  activity.source === 'SIMULATED'
                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                    : 'bg-accent/40 border-border hover:border-primary/25'
                }`}
              >
                {/* Event Type Icon */}
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                  {getEventIcon(activity.type)}
                </div>

                {/* Event Details */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{activity.title}</h4>
                      {activity.source === 'SIMULATED' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          SIM
                        </span>
                      )}
                      {activity.source === 'LOCAL' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          LOCAL
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono font-medium shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activity.description}
                  </p>
                  {activity.hash && activity.source !== 'SIMULATED' && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">
                        Hash: {activity.hash.slice(0, 16)}...
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${activity.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
