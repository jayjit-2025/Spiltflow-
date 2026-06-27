'use client';

import React, { useEffect, useState } from 'react';
import { useActivityStore, ActivityItem } from '@/store/useActivityStore';
import { useWalletStore } from '@/store/useWalletStore';
import { fetchContractEvents, generateMockEvent } from '@/services/events';
import { getContractSettings } from '@/services/stellar';
import {
  Activity,
  Compass,
  Coins,
  CheckCircle,
  HelpCircle,
  Clock,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function ActivityFeedPage() {
  const { activities, addActivity, clearActivities } = useActivityStore();
  const { network } = useWalletStore();
  
  // Polling state
  const [isLive, setIsLive] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [latestLedger, setLatestLedger] = useState(0);

  // Poll for events on the active ledger
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      if (simulationMode) {
        // Simulation mode: randomly generate a mock event
        if (Math.random() > 0.4) {
          const mockEvent = generateMockEvent();
          addActivity(mockEvent);
        }
      } else {
        // Real mode: query actual contract events from Stellar ledger
        try {
          const settings = getContractSettings();
          const contractIds = [settings.managerId, settings.distributorId].filter(Boolean);
          const startLedgerVal = latestLedger === 0 ? 0 : latestLedger;
          const result = await fetchContractEvents(network, contractIds, startLedgerVal);
          
          if (result.events.length > 0) {
            result.events.forEach((ev) => addActivity(ev));
          }
          setLatestLedger(result.latestLedger);
        } catch (err) {
          console.error('Error fetching ledger events:', err);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, simulationMode, latestLedger, network, addActivity]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
            Real-time ledger monitor for asset registries and royalty distribution events.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Simulation */}
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
              simulationMode
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
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

      {/* Activities Stream */}
      <div className="max-w-4xl w-full mx-auto p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isLive ? 'Live Ledger Stream' : 'Stream Paused'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {activities.length} Events Logged
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Clock className="h-10 w-10 text-muted-foreground animate-spin" style={{ animationDuration: '4s' }} />
            <h4 className="font-bold text-foreground text-sm">Listening for Ledger Events</h4>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              No events detected in this session yet. Try registering an asset or enabling Simulation Mode above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-accent/40 border border-border hover:border-primary/25 transition-colors animate-in slide-in-from-bottom-2 duration-300"
              >
                {/* Event Type Icon */}
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                  {getEventIcon(activity.type)}
                </div>

                {/* Event Details */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-sm text-foreground">{activity.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono font-medium">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activity.description}
                  </p>
                  {activity.hash && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">Hash: {activity.hash.slice(0, 16)}...</span>
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
