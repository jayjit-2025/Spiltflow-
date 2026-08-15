'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWalletStore } from '@/store/useWalletStore';
import { ArrowRight, Database, Zap, Cpu, Layers, ShieldCheck, Activity, LineChart, Disc, Check } from 'lucide-react';
import HeroTokenMesh from '@/components/HeroTokenMesh';
import RoyaltySimulator from '@/components/RoyaltySimulator';

export default function LandingPage() {
  const { isConnected } = useWalletStore();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-24 md:gap-36 py-6 md:py-12">
      {/* ─── 1. Hero Section (Clean Architectural Layout & Interactive Token Mesh) ─── */}
      <section className="relative w-full max-w-6xl mx-auto flex flex-col items-start text-left gap-8 pt-4 md:pt-12">
        {/* Eyebrow Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.12)] text-[11px] mono-font animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-[#F97316]">SOROBAN PROTOCOL V2.0</span>
          <span className="text-[#7D8794]">|</span>
          <span className="text-[#B8C0CC]">AUTOMATED ROYALTY SPLITS</span>
        </div>

        {/* Enormous Full-Width Display Headline (Spans across top with zero text collision) */}
        <h1 className="text-hero-giant font-michroma text-[#F5F7FA] w-full animate-fade-in-up animate-delay-1 leading-[1.02] tracking-tight">
          DECENTRALIZED <br />
          ROYALTIES, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-[#CFAE6E] to-[#9ED8FF]">
            DISTRIBUTED
          </span> <br />
          INSTANTLY.
        </h1>

        {/* Bottom Hero Split Row: Description + CTAs (Left) and Interactive 3D Token Mesh (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full pt-4">
          
          {/* Left Column: Subtitle Paragraph & Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 animate-fade-in-up animate-delay-2">
            <p className="text-sm md:text-base text-[#B8C0CC] max-w-xl leading-relaxed font-sans font-light">
              Register digital assets, define contributor shares in basis points, and distribute royalties atomically directly through Stellar Soroban smart contracts — without intermediaries or opaque payout delays.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-4 px-8 py-4 bg-[#0C0D10] hover:bg-[#171A1F] border border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)] group"
              >
                <span>■ LAUNCH APP</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2 text-[#F97316]" />
              </Link>

              <Link
                href="/transactions"
                className="inline-flex items-center gap-2 px-6 py-4 bg-transparent hover:bg-[#0C0D10] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)] text-[#B8C0CC] hover:text-[#F5F7FA] font-mono text-xs tracking-widest uppercase transition-all"
              >
                <Activity className="h-3.5 w-3.5 text-[#9ED8FF]" />
                <span>LEDGER TELEMETRY</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive 3D/SVG Token Orbit Mesh Component */}
          <div className="lg:col-span-5 w-full flex items-center justify-center animate-fade-in-up animate-delay-3">
            <HeroTokenMesh />
          </div>

        </div>

        {/* Live Protocol Telemetry & Performance Stats Ribbon */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] p-4 md:p-6 mt-4">
          <div className="space-y-1">
            <div className="text-[10px] mono-font text-[#7D8794]">AVG SETTLEMENT TIME</div>
            <div className="font-michroma text-lg text-[#4ade80]">&lt; 3.8s ATOMIC</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] mono-font text-[#7D8794]">MATH PRECISION</div>
            <div className="font-michroma text-lg text-[#F97316]">10,000 BPS</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] mono-font text-[#7D8794]">RUNTIME ENVIRONMENT</div>
            <div className="font-michroma text-lg text-[#9ED8FF]">SOROBAN WASM</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] mono-font text-[#7D8794]">STELLAR NETWORK</div>
            <div className="font-michroma text-lg text-[#CFAE6E]">TESTNET V21</div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE ROYALTY SPLIT SIMULATOR ──────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-3">
          <h2 className="text-section-title font-michroma text-[#F5F7FA]">
            INTERACTIVE ROYALTY PLAYGROUND
          </h2>
          <p className="text-xs text-[#B8C0CC] max-w-xl mx-auto leading-relaxed">
            Test and simulate atomic royalty splitting in real time. Adjust contributor basis points and deposit amounts to preview instantaneous on-chain payouts.
          </p>
        </div>

        <RoyaltySimulator />
      </section>

      {/* ─── FEATURED REGISTERED ASSET SHOWCASE ────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div>
            <span className="text-[10px] mono-font text-[#F97316] uppercase tracking-widest">ON-CHAIN REGISTRY PREVIEW</span>
            <h2 className="text-xl font-michroma text-[#F5F7FA]">FEATURED DIGITAL ASSETS</h2>
          </div>
          <Link href="/dashboard" className="text-xs mono-font text-[#9ED8FF] hover:underline flex items-center gap-1">
            EXPLORE CONSOLE DASHBOARD →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Asset Card 1 */}
          <div className="architectural-panel p-5 space-y-4 hover:border-[#F97316]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#F97316] group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-michroma text-xs text-[#F5F7FA]">album_split_001</span>
              </div>
              <span className="text-[9px] mono-font text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-1.5 py-0.5">ACTIVE</span>
            </div>
            <p className="text-xs text-[#B8C0CC]">Synthwave Cyberpunk OST (10 Track Bundle)</p>
            <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Producer (GDFL...)</span>
                <span className="text-[#F97316]">5,000 BPS (50%)</span>
              </div>
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Vocalist (GBPE...)</span>
                <span className="text-[#9ED8FF]">3,000 BPS (30%)</span>
              </div>
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Label (GDFSD...)</span>
                <span className="text-[#CFAE6E]">2,000 BPS (20%)</span>
              </div>
            </div>
          </div>

          {/* Asset Card 2 */}
          <div className="architectural-panel p-5 space-y-4 hover:border-[#9ED8FF]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#9ED8FF] group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-michroma text-xs text-[#F5F7FA]">retro_beats_2026</span>
              </div>
              <span className="text-[9px] mono-font text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-1.5 py-0.5">ACTIVE</span>
            </div>
            <p className="text-xs text-[#B8C0CC]">Lo-Fi Chill Hop Royalty Rights Agreement</p>
            <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Beatmaker (GAKR...)</span>
                <span className="text-[#F97316]">6,000 BPS (60%)</span>
              </div>
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Audio Eng (GC4E...)</span>
                <span className="text-[#9ED8FF]">4,000 BPS (40%)</span>
              </div>
            </div>
          </div>

          {/* Asset Card 3 */}
          <div className="architectural-panel p-5 space-y-4 hover:border-[#CFAE6E]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#CFAE6E] group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-michroma text-xs text-[#F5F7FA]">ai_model_lic_402</span>
              </div>
              <span className="text-[9px] mono-font text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-1.5 py-0.5">ACTIVE</span>
            </div>
            <p className="text-xs text-[#B8C0CC]">Autonomous AI Agent License Revenue Split</p>
            <div className="space-y-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] mono-font">
              <div className="flex justify-between text-[#B8C0CC]">
                <span>AI Developer (GAVN...)</span>
                <span className="text-[#F97316]">7,500 BPS (75%)</span>
              </div>
              <div className="flex justify-between text-[#B8C0CC]">
                <span>Dataset Owner (GDS3...)</span>
                <span className="text-[#CFAE6E]">2,500 BPS (25%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. HOW IT WORKS — Animated SVG Central Rail & Asymmetric Workflow ──── */}
      <section className="relative max-w-5xl mx-auto w-full space-y-20 pt-8">
        <div className="text-center space-y-4 animate-fade-in-up">
          <h2 className="text-section-title font-michroma text-[#F5F7FA]">
            HOW IT WORKS
          </h2>
          <p className="font-michroma text-xs text-[#9ED8FF] tracking-widest uppercase">
            A SELF-SUSTAINING VALUE DISTRIBUTION SYSTEM
          </p>
          <p className="text-xs text-[#B8C0CC] max-w-md mx-auto leading-relaxed">
            Four steps forming an automated, on-chain value loop — settled natively on Stellar Soroban ledger.
          </p>
        </div>

        {/* Central Rail Container */}
        <div className="relative flex flex-col gap-24 md:gap-32">
          {/* SVG Animated Data Flow Line Running Continuously Down the Rail */}
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="100%"
                stroke="#9ED8FF"
                strokeWidth="1.5"
                className="svg-flow-path"
              />
            </svg>
          </div>

          {/* STEP 01: Left Text, Right Visual */}
          <div 
            className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in-up"
            onMouseEnter={() => setActiveStep(1)}
            onMouseLeave={() => setActiveStep(null)}
          >
            {/* Central Node Dot */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
              <div className={activeStep === 1 ? "glowing-node-amber" : "w-3 h-3 rounded-full bg-[#171A1F] border border-[#7D8794] transition-all"} />
            </div>

            {/* Left Content */}
            <div className="space-y-3 text-left md:pr-12">
              <span className="inline-block px-2.5 py-0.5 border border-[rgba(255,255,255,0.12)] text-[10px] mono-font text-[#F97316]">
                STEP 01
              </span>
              <h3 className="font-michroma text-lg text-[#F5F7FA]">
                REAL ASSETS REGISTERED
              </h3>
              <p className="text-xs text-[#B8C0CC] leading-relaxed">
                Creators and IP owners submit asset allocations directly to the Soroban RoyaltyManager contract, anchoring permanent ownership on Stellar.
              </p>
            </div>

            {/* Right Diagram Module Box */}
            <div className="architectural-panel p-6 md:ml-6 space-y-3">
              <div className="flex items-center justify-between text-[10px] mono-font text-[#7D8794] border-b border-[rgba(255,255,255,0.06)] pb-2">
                <span>[ REGISTRY_MODULE ]</span>
                <span className="text-[#F97316]">ON-CHAIN</span>
              </div>
              <div className="h-32 flex items-center justify-center bg-[#050505] border border-[rgba(255,255,255,0.04)] relative overflow-hidden">
                <div className="flex items-center gap-3 text-xs mono-font visual-module-img">
                  <Database className="h-5 w-5 text-[#F97316]" />
                  <span className="text-[#F5F7FA]">ASSET_ID // album_split_001</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 02: Left Visual, Right Text */}
          <div 
            className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in-up"
            onMouseEnter={() => setActiveStep(2)}
            onMouseLeave={() => setActiveStep(null)}
          >
            {/* Central Node Dot */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
              <div className={activeStep === 2 ? "glowing-node-amber" : "w-3 h-3 rounded-full bg-[#171A1F] border border-[#7D8794] transition-all"} />
            </div>

            {/* Left Diagram Module Box */}
            <div className="architectural-panel p-6 md:mr-6 space-y-3 md:order-1 order-2">
              <div className="flex items-center justify-between text-[10px] mono-font text-[#7D8794] border-b border-[rgba(255,255,255,0.06)] pb-2">
                <span>[ BPS_ALLOCATION ]</span>
                <span className="text-[#9ED8FF]">10,000 BPS</span>
              </div>
              <div className="h-32 flex items-center justify-center bg-[#050505] border border-[rgba(255,255,255,0.04)] p-4">
                <div className="w-full space-y-2 text-[10px] mono-font visual-module-img">
                  <div className="flex justify-between text-[#B8C0CC]">
                    <span>PRODUCER</span>
                    <span className="text-[#F5F7FA]">4,500 BPS (45%)</span>
                  </div>
                  <div className="w-full h-1 bg-[#171A1F]"><div className="h-full bg-[#F97316] w-[45%]" /></div>
                  <div className="flex justify-between text-[#B8C0CC]">
                    <span>VOCALIST</span>
                    <span className="text-[#F5F7FA]">3,500 BPS (35%)</span>
                  </div>
                  <div className="w-full h-1 bg-[#171A1F]"><div className="h-full bg-[#9ED8FF] w-[35%]" /></div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-3 text-left md:pl-12 md:order-2 order-1">
              <span className="inline-block px-2.5 py-0.5 border border-[rgba(255,255,255,0.12)] text-[10px] mono-font text-[#9ED8FF]">
                STEP 02
              </span>
              <h3 className="font-michroma text-lg text-[#F5F7FA]">
                CONTRIBUTORS CONNECTED
              </h3>
              <p className="text-xs text-[#B8C0CC] leading-relaxed">
                Define exact basis-point splits (10,000 bps = 100.00%) across producers, artists, and rights holders with zero mathematical dust leakage.
              </p>
            </div>
          </div>

          {/* STEP 03: Left Text, Right Visual */}
          <div 
            className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in-up"
            onMouseEnter={() => setActiveStep(3)}
            onMouseLeave={() => setActiveStep(null)}
          >
            {/* Central Node Dot */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
              <div className={activeStep === 3 ? "glowing-node-blue" : "w-3 h-3 rounded-full bg-[#171A1F] border border-[#7D8794] transition-all"} />
            </div>

            {/* Left Content */}
            <div className="space-y-3 text-left md:pr-12">
              <span className="inline-block px-2.5 py-0.5 border border-[rgba(255,255,255,0.12)] text-[10px] mono-font text-[#9ED8FF]">
                STEP 03
              </span>
              <h3 className="font-michroma text-lg text-[#F5F7FA]">
                ROYALTY POOL EXPANDS
              </h3>
              <p className="text-xs text-[#B8C0CC] leading-relaxed">
                Streaming platforms, buyers, and consumers initiate payment deposits in XLM directly to the RoyaltyDistributor smart contract pipeline.
              </p>
            </div>

            {/* Right Diagram Module Box */}
            <div className="architectural-panel p-6 md:ml-6 space-y-3">
              <div className="flex items-center justify-between text-[10px] mono-font text-[#7D8794] border-b border-[rgba(255,255,255,0.06)] pb-2">
                <span>[ INFLOW_TELEMETRY ]</span>
                <span className="text-[#9ED8FF]">XLM_SETTLEMENT</span>
              </div>
              <div className="h-32 flex items-center justify-center bg-[#050505] border border-[rgba(255,255,255,0.04)] relative">
                <div className="flex items-center gap-2 text-xs mono-font text-[#4ade80] visual-module-img">
                  <Zap className="h-4 w-4" />
                  <span>PAYMENT_INFLOW: 100.00 XLM</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 04: Left Visual, Right Text */}
          <div 
            className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in-up"
            onMouseEnter={() => setActiveStep(4)}
            onMouseLeave={() => setActiveStep(null)}
          >
            {/* Central Node Dot */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
              <div className={activeStep === 4 ? "glowing-node-green" : "w-3 h-3 rounded-full bg-[#171A1F] border border-[#7D8794] transition-all"} />
            </div>

            {/* Left Diagram Module Box */}
            <div className="architectural-panel p-6 md:mr-6 space-y-3 md:order-1 order-2">
              <div className="flex items-center justify-between text-[10px] mono-font text-[#7D8794] border-b border-[rgba(255,255,255,0.06)] pb-2">
                <span>[ ATOMIC_DISPATCH ]</span>
                <span className="text-[#4ade80]">SETTLED</span>
              </div>
              <div className="h-32 flex items-center justify-center bg-[#050505] border border-[rgba(255,255,255,0.04)] p-4 text-[10px] mono-font text-[#B8C0CC] space-y-1 visual-module-img">
                <div>PAYEE 1: 45.00 XLM ✓</div>
                <div>PAYEE 2: 35.00 XLM ✓</div>
                <div>PAYEE 3: 20.00 XLM ✓</div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-3 text-left md:pl-12 md:order-2 order-1">
              <span className="inline-block px-2.5 py-0.5 border border-[rgba(255,255,255,0.12)] text-[10px] mono-font text-[#4ade80]">
                STEP 04
              </span>
              <h3 className="font-michroma text-lg text-[#F5F7FA]">
                AUTOMATED ATOMIC DISTRIBUTION
              </h3>
              <p className="text-xs text-[#B8C0CC] leading-relaxed">
                Funds are routed atomically to all payee wallets in a single transaction invocation, eliminating manual payouts and escrow risk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. CONSTRUCTED ENVIRONMENTS — Protocol Architecture Bento Grid ─────── */}
      <section className="max-w-5xl mx-auto w-full space-y-10 pt-8 animate-fade-in-up">
        <div className="text-left space-y-3 border-b border-[rgba(255,255,255,0.08)] pb-6">
          <h2 className="text-section-title font-michroma text-[#F5F7FA]">
            CONSTRUCTED ENVIRONMENTS
          </h2>
          <p className="text-xs text-[#B8C0CC] max-w-xl">
            A premium digital protocol architecture that translates across formats, contracts, and ledger contexts without losing coherence.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Feature Module */}
          <div className="md:col-span-2 architectural-panel p-8 flex flex-col justify-between space-y-6 min-h-[340px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] mono-font text-[#F97316] border border-[rgba(255,255,255,0.12)] px-2.5 py-0.5">
                ENV.01
              </span>
              <span className="text-xs mono-font text-[#7D8794]">SOROBAN_REGISTRY</span>
            </div>

            <div className="space-y-3 visual-module-img">
              <h3 className="font-michroma text-xl text-[#F5F7FA]">
                GOLD-ANCHORED REGISTRY FOUNDATION
              </h3>
              <p className="text-xs text-[#B8C0CC] leading-relaxed max-w-lg">
                High-throughput persistent data storage on Stellar Soroban. Immutable ownership records, dynamic share adjustments, and role-based permissions directly on ledger.
              </p>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] text-[10px] mono-font text-[#CFAE6E]">
              QUOTE: REAL ASSETS. REAL BACKING. NOT A PROMISE.
            </div>
          </div>

          {/* Stacked Right Modules */}
          <div className="flex flex-col gap-6">
            {/* Module 2 */}
            <div className="architectural-panel p-6 space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-michroma text-xs text-[#F5F7FA]">ATOMIC SPLITS</h4>
                <span className="text-[10px] mono-font text-[#7D8794]">ENV.02</span>
              </div>
              <p className="text-[11px] text-[#B8C0CC] leading-relaxed visual-module-img">
                Instant multi-payee transfers executing in a single atomic transaction block.
              </p>
            </div>

            {/* Module 3 */}
            <div className="architectural-panel p-6 space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-michroma text-xs text-[#F5F7FA]">ON-CHAIN PROOF</h4>
                <span className="text-[10px] mono-font text-[#7D8794]">ENV.03</span>
              </div>
              <p className="text-[11px] text-[#B8C0CC] leading-relaxed visual-module-img">
                Cryptographic transaction signatures and ledger event telemetry stream verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Ecosystem Integrations Marquee Ticker ───────────────────────── */}
      <section className="max-w-5xl mx-auto w-full text-center space-y-6 border-t border-[rgba(255,255,255,0.08)] pt-12 animate-fade-in-up">
        <div className="font-michroma text-xs text-[#7D8794] tracking-widest">
          ECOSYSTEM INTEGRATIONS
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-xs mono-font text-[#B8C0CC] opacity-70">
          <span>STELLAR_NETWORK</span>
          <span>SOROBAN_WASM</span>
          <span>FREIGHTER</span>
          <span>ALBEDO</span>
          <span>XBULL</span>
        </div>
      </section>

      {/* ─── 5. Footer CTA Banner ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full py-12 border-t border-[rgba(255,255,255,0.08)] text-left space-y-6 animate-fade-in-up">
        <div className="text-[10px] mono-font text-[#7D8794]">Let's create together</div>
        <h2 className="text-section-title font-michroma text-[#F5F7FA]">
          READY TO START YOUR PROJECT?
        </h2>
        <p className="text-xs text-[#B8C0CC]">
          Automate royalties and revenue splits transparently on Stellar.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#0C0D10] hover:bg-[#171A1F] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs tracking-widest uppercase transition-all group"
          >
            <span>■ LAUNCH CONSOLE APP</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 text-[#F97316]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
