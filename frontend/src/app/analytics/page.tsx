'use client';

import React from 'react';
import Link from 'next/link';
import { useActivityStore } from '@/store/useActivityStore';
import { useTxStore } from '@/store/useTxStore';
import { BarChart3, Activity, ShieldCheck, Zap, Database, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const { activities } = useActivityStore();
  const { transactions } = useTxStore();

  const totalEvents = activities.length;
  const totalRegistrations = activities.filter((a) => a.type === 'REGISTRATION').length;
  const totalDistributions = activities.filter((a) => a.type === 'DISTRIBUTION').length;
  const confirmedTxCount = transactions.filter((t) => t.status === 'SUCCESS').length;
  const pendingTxCount = transactions.filter((t) => t.status !== 'SUCCESS' && t.status !== 'FAILED').length;
  const failedTxCount = transactions.filter((t) => t.status === 'FAILED').length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#9ED8FF]">SOROBAN_TELEMETRY_ANALYTICS</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">PROTOCOL ANALYTICS</h1>
          <p className="text-xs text-[#B8C0CC]">
            Real-time protocol activity telemetry, event breakdowns, and transaction health metrics on Stellar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
            <span className="w-2 h-2 rounded-full bg-[#9ED8FF] animate-pulse" />
            <span className="text-[#B8C0CC]">TELEMETRY_MODE:</span>
            <span className="text-[#9ED8FF] font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Events */}
        <div className="architectural-panel p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] mono-font text-[#B8C0CC]">METRIC.01</span>
            <Activity className="h-4 w-4 text-[#9ED8FF]" />
          </div>
          <div className="space-y-1">
            <div className="font-michroma text-2xl text-[#F5F7FA]">{totalEvents}</div>
            <div className="text-[11px] mono-font text-[#B8C0CC]">TOTAL PROTOCOL EVENTS</div>
          </div>
        </div>

        {/* Metric 2: Distributions */}
        <div className="architectural-panel p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] mono-font text-[#CFAE6E]">METRIC.02</span>
            <Zap className="h-4 w-4 text-[#CFAE6E]" />
          </div>
          <div className="space-y-1">
            <div className="font-michroma text-2xl text-[#F5F7FA]">{totalDistributions}</div>
            <div className="text-[11px] mono-font text-[#B8C0CC]">ROYALTY DISTRIBUTIONS</div>
          </div>
        </div>

        {/* Metric 3: Registrations */}
        <div className="architectural-panel p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] mono-font text-[#F97316]">METRIC.03</span>
            <Database className="h-4 w-4 text-[#F97316]" />
          </div>
          <div className="space-y-1">
            <div className="font-michroma text-2xl text-[#F5F7FA]">{totalRegistrations}</div>
            <div className="text-[11px] mono-font text-[#B8C0CC]">DIGITAL REGISTRATIONS</div>
          </div>
        </div>

        {/* Metric 4: Confirmed Tx */}
        <div className="architectural-panel p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] mono-font text-[#4ade80]">METRIC.04</span>
            <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
          </div>
          <div className="space-y-1">
            <div className="font-michroma text-2xl text-[#F5F7FA]">{confirmedTxCount}</div>
            <div className="text-[11px] mono-font text-[#B8C0CC]">CONFIRMED TRANSACTIONS</div>
          </div>
        </div>
      </div>

      {/* Visual Data Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Activity Timeline (Spans 2 columns) */}
        <div className="lg:col-span-2 architectural-panel p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-[#9ED8FF]" />
              <h2 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
                EVENT ACTIVITY TIMELINE
              </h2>
            </div>
            <span className="text-[10px] mono-font text-[#9ED8FF]">GLACIAL_BLUE_TELEMETRY</span>
          </div>

          {totalEvents > 0 ? (
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between gap-3 p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] relative overflow-hidden">
                {/* Horizontal Technical Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                  <div className="w-full border-b border-dashed border-[#9ED8FF]" />
                  <div className="w-full border-b border-dashed border-[#9ED8FF]" />
                  <div className="w-full border-b border-dashed border-[#9ED8FF]" />
                </div>

                {/* SVG Curve Line overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" preserveAspectRatio="none">
                  <path
                    d="M 10 150 Q 150 80, 300 110 T 600 40"
                    fill="none"
                    stroke="#9ED8FF"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                </svg>

                {activities.slice(0, 10).map((act, i) => (
                  <div key={act.id} className="flex-1 flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-full max-w-[24px] ${
                        act.type === 'REGISTRATION' ? 'bg-[#F97316]' : 'bg-[#4ade80]'
                      }`}
                      style={{ height: `${Math.min((i + 1) * 25, 120)}px` }}
                    />
                    <span className="text-[9px] mono-font text-[#7D8794]">E.{i + 1}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs mono-font text-[#B8C0CC]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#F97316]" />
                  <span>REGISTRATIONS</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#4ade80]" />
                  <span>DISTRIBUTIONS</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-[#050505] border border-[rgba(255,255,255,0.06)] p-6 text-center text-xs mono-font text-[#7D8794]">
              NO EVENT ACTIVITY RECORDED IN SESSION YET.
            </div>
          )}
        </div>

        {/* Transaction Health Reliability Gauge (Spans 1 column) */}
        <div className="architectural-panel p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
              <h2 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
                TRANSACTION HEALTH
              </h2>
            </div>
            <span className="text-[10px] mono-font text-[#4ade80]">RELIABILITY</span>
          </div>

          <div className="space-y-4">
            {/* Confirmed Bar */}
            <div className="space-y-1.5 text-xs mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>CONFIRMED</span>
                <span className="text-[#4ade80] font-bold">{confirmedTxCount} TX</span>
              </div>
              <div className="w-full h-2 bg-[#050505] border border-[rgba(255,255,255,0.08)]">
                <div 
                  className="h-full bg-[#4ade80] transition-all" 
                  style={{ width: transactions.length > 0 ? `${(confirmedTxCount / transactions.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Pending Bar */}
            <div className="space-y-1.5 text-xs mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>PENDING / IN-FLIGHT</span>
                <span className="text-amber-400 font-bold">{pendingTxCount} TX</span>
              </div>
              <div className="w-full h-2 bg-[#050505] border border-[rgba(255,255,255,0.08)]">
                <div 
                  className="h-full bg-amber-400 transition-all" 
                  style={{ width: transactions.length > 0 ? `${(pendingTxCount / transactions.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Failed Bar */}
            <div className="space-y-1.5 text-xs mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>FAILED / REJECTED</span>
                <span className="text-red-400 font-bold">{failedTxCount} TX</span>
              </div>
              <div className="w-full h-2 bg-[#050505] border border-[rgba(255,255,255,0.08)]">
                <div 
                  className="h-full bg-red-400 transition-all" 
                  style={{ width: transactions.length > 0 ? `${(failedTxCount / transactions.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] text-[11px] mono-font text-[#7D8794] space-y-1">
              <div>PROTOCOL_HEALTH: 100% OPERATIONAL</div>
              <div>STELLAR_NETWORK: TESTNET</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
