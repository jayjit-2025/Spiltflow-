'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Database, Users, Percent, Zap, FileText, Cpu, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#9ED8FF]">PROTOCOL_DOCUMENTATION</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">DOCUMENTATION & HELP</h1>
          <p className="text-xs text-[#B8C0CC]">
            Clear, concise guide to asset registration, basis points splits, and atomic royalty distributions on Soroban.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
          <BookOpen className="h-3.5 w-3.5 text-[#9ED8FF]" />
          <span className="text-[#B8C0CC]">VERSION:</span>
          <span className="text-[#F5F7FA] font-bold">2.1.0_SOROBAN</span>
        </div>
      </div>

      {/* Protocol Core Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Assets */}
        <div className="architectural-panel p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <Database className="h-5 w-5 text-[#F97316]" />
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
              1. DIGITAL ASSETS
            </h2>
          </div>
          <p className="text-xs text-[#B8C0CC] leading-relaxed">
            A registered digital asset represents an immutable intellectual property record (e.g. music tracks, royalty agreements, digital creations) anchored directly on the Soroban <code className="text-[#F97316] font-mono">RoyaltyManager</code> smart contract.
          </p>
        </div>

        {/* Section 2: Contributors */}
        <div className="architectural-panel p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <Users className="h-5 w-5 text-[#9ED8FF]" />
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
              2. CONTRIBUTORS & PAYEES
            </h2>
          </div>
          <p className="text-xs text-[#B8C0CC] leading-relaxed">
            Contributors are Stellar wallet addresses assigned to an asset. Each contributor receives an exact proportional allocation of all incoming royalty deposits.
          </p>
        </div>

        {/* Section 3: Basis Points (BPS) */}
        <div className="architectural-panel p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <Percent className="h-5 w-5 text-[#CFAE6E]" />
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
              3. BASIS POINTS (BPS) SPLITS
            </h2>
          </div>
          <div className="space-y-3 text-xs text-[#B8C0CC] leading-relaxed">
            <p>
              SplitFlow calculates shares using basis points to guarantee zero mathematical dust leakage:
            </p>
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] font-mono text-[11px] space-y-1 text-[#F5F7FA]">
              <div>10,000 BPS = 100.00% (TOTAL ALLOCATION)</div>
              <div>5,000 BPS  = 50.00% SHARE</div>
              <div>2,500 BPS  = 25.00% SHARE</div>
            </div>
          </div>
        </div>

        {/* Section 4: Royalty Distribution */}
        <div className="architectural-panel p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <Zap className="h-5 w-5 text-[#4ade80]" />
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
              4. ATOMIC DISTRIBUTION
            </h2>
          </div>
          <p className="text-xs text-[#B8C0CC] leading-relaxed">
            When funds are sent to the <code className="text-[#4ade80] font-mono">RoyaltyDistributor</code> contract, payouts execute atomically in a single ledger transaction block to all payee wallets simultaneously.
          </p>
        </div>

        {/* Section 5: Transaction Lifecycle */}
        <div className="architectural-panel p-6 md:p-8 space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <FileText className="h-5 w-5 text-[#9ED8FF]" />
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
              5. TRANSACTION LIFECYCLE STAGES
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="text-amber-400 font-bold">1. BUILDING</div>
              <div className="text-[10px] text-[#7D8794]">Constructing XDR</div>
            </div>
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="text-amber-400 font-bold">2. SIMULATING</div>
              <div className="text-[10px] text-[#7D8794]">RPC Simulation</div>
            </div>
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="text-amber-400 font-bold">3. SIGNING</div>
              <div className="text-[10px] text-[#7D8794]">Wallet Signature</div>
            </div>
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="text-amber-400 font-bold">4. SUBMITTED</div>
              <div className="text-[10px] text-[#7D8794]">Sent to RPC</div>
            </div>
            <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1">
              <div className="text-[#4ade80] font-bold">5. CONFIRMED</div>
              <div className="text-[10px] text-[#7D8794]">Ledger Settled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch CTA */}
      <div className="architectural-panel p-6 text-center space-y-3">
        <h3 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
          READY TO REGISTER AN ASSET OR EXECUTE A SPLIT?
        </h3>
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#050505] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs uppercase transition-all"
          >
            <span>■ OPEN CONSOLE DASHBOARD</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
