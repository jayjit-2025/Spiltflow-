'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useActivityStore } from '@/store/useActivityStore';
import { Activity, Database, Zap, CheckCircle2, AlertTriangle, ArrowUpRight, Filter, Search } from 'lucide-react';

export default function ActivityPage() {
  const { activities } = useActivityStore();
  const [filterType, setFilterType] = useState<'ALL' | 'REGISTRATION' | 'DISTRIBUTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === 'ALL' || act.type === filterType;
    const matchesSearch =
      !searchQuery ||
      act.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.txHash && act.txHash.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#F97316]">LEDGER_EVENT_TELEMETRY</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">PROTOCOL ACTIVITY FEED</h1>
          <p className="text-xs text-[#B8C0CC]">
            Chronological stream of on-chain asset registrations and royalty distributions on Soroban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#B8C0CC]">LIVE_FEED:</span>
            <span className="text-[#F5F7FA] font-bold">{activities.length} EVENTS</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Filter Buttons */}
        <div className="flex items-center bg-[#0C0D10] border border-[rgba(255,255,255,0.08)] p-1">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-1.5 text-xs mono-font cursor-pointer transition-colors ${
              filterType === 'ALL'
                ? 'bg-[#171A1F] text-[#F97316] font-bold border border-[rgba(255,255,255,0.12)]'
                : 'text-[#B8C0CC] hover:text-[#F5F7FA]'
            }`}
          >
            ALL EVENTS ({activities.length})
          </button>
          <button
            onClick={() => setFilterType('REGISTRATION')}
            className={`px-4 py-1.5 text-xs mono-font cursor-pointer transition-colors ${
              filterType === 'REGISTRATION'
                ? 'bg-[#171A1F] text-[#F97316] font-bold border border-[rgba(255,255,255,0.12)]'
                : 'text-[#B8C0CC] hover:text-[#F5F7FA]'
            }`}
          >
            REGISTRATIONS ({activities.filter((a) => a.type === 'REGISTRATION').length})
          </button>
          <button
            onClick={() => setFilterType('DISTRIBUTION')}
            className={`px-4 py-1.5 text-xs mono-font cursor-pointer transition-colors ${
              filterType === 'DISTRIBUTION'
                ? 'bg-[#171A1F] text-[#4ade80] font-bold border border-[rgba(255,255,255,0.12)]'
                : 'text-[#B8C0CC] hover:text-[#F5F7FA]'
            }`}
          >
            DISTRIBUTIONS ({activities.filter((a) => a.type === 'DISTRIBUTION').length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7D8794]" />
          <input
            type="text"
            placeholder="Search Asset ID or Tx Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0C0D10] border border-[rgba(255,255,255,0.08)] pl-9 pr-3 py-2 text-xs font-mono text-[#F5F7FA] focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      {/* Activity Event Stream */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="architectural-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Event Metadata Left */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.08)] text-[#F97316]">
                  {act.type === 'REGISTRATION' ? (
                    <Database className="h-5 w-5 text-[#F97316]" />
                  ) : (
                    <Zap className="h-5 w-5 text-[#4ade80]" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-michroma text-xs text-[#F5F7FA]">
                      {act.type === 'REGISTRATION' ? 'DIGITAL ASSET REGISTERED' : 'ROYALTY DISTRIBUTED'}
                    </span>
                    <span
                      className={`text-[10px] mono-font font-bold px-2 py-0.5 border ${
                        act.status === 'SUCCESS'
                          ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30'
                          : 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <div className="text-xs mono-font text-[#B8C0CC] flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>ASSET: <strong className="text-[#F5F7FA]">{act.assetId}</strong></span>
                    {act.amount !== 'N/A' && <span>AMOUNT: <strong className="text-[#4ade80]">{act.amount}</strong></span>}
                    <span>TIMESTAMP: {new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Explorer / Tx Link Right */}
              {act.txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${act.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#050505] border border-[rgba(255,255,255,0.1)] hover:border-[#F97316] text-[#B8C0CC] hover:text-[#F97316] text-xs mono-font transition-colors shrink-0"
                >
                  <span>[{act.txHash.slice(0, 8)}...]</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Intentional Telemetry Empty State */
        <div className="architectural-panel p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#171A1F] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mx-auto text-[#7D8794]">
            <Activity className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-michroma text-xs text-[#F5F7FA] tracking-wider uppercase">
              NO EVENTS FROM THIS DEPLOYMENT DETECTED YET
            </h3>
            <p className="text-xs text-[#B8C0CC]">
              Execute asset registrations or royalty distributions in the Console Dashboard to generate real ledger telemetry.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#050505] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs uppercase transition-all"
            >
              <span>■ GO TO CONSOLE DASHBOARD →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
