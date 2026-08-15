'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Database,
  Users,
  Percent,
  Zap,
  FileText,
  Cpu,
  ArrowRight,
  Code2,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Calculator,
  Activity,
  Server,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { FALLBACK_MANAGER_ID, FALLBACK_DISTRIBUTOR_ID, XLM_SAC_ID } from '@/services/stellar';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'contract' | 'bps' | 'telemetry' | 'sdk' | 'errors'>('quickstart');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // BPS Live Simulator State
  const [simAmount, setSimAmount] = useState<string>('1000');
  const [simShare1, setSimShare1] = useState<number>(50);
  const [simShare2, setSimShare2] = useState<number>(30);
  const [simShare3, setSimShare3] = useState<number>(20);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const totalSimPct = simShare1 + simShare2 + simShare3;
  const numSimAmount = parseFloat(simAmount) || 0;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#9ED8FF]">PROTOCOL_DEVELOPER_PORTAL</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">TECHNICAL DOCUMENTATION</h1>
          <p className="text-xs text-[#B8C0CC]">
            Complete reference spec for Soroban smart contracts, basis points math, event telemetry, and API integration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
            <BookOpen className="h-3.5 w-3.5 text-[#9ED8FF]" />
            <span className="text-[#B8C0CC]">SPEC:</span>
            <span className="text-[#F5F7FA] font-bold">SOROBAN_V2.1</span>
          </div>

          <a
            href="https://stellar.expert/explorer/testnet/contract/CD2GSKODG4YI7CCHFKJTTR2BMZIJMQZRYU7JH666T2Z2WQC5HOVAVFW4"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] hover:text-[#F5F7FA] font-mono text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>STELLAR EXPERT</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[rgba(255,255,255,0.1)] pb-2 custom-scrollbar">
        {[
          { id: 'quickstart', label: '🚀 QUICKSTART & OVERVIEW', icon: Zap },
          { id: 'contract', label: '⚙️ SOROBAN RUST CONTRACT', icon: Code2 },
          { id: 'bps', label: '🧮 BPS MATH & SIMULATOR', icon: Calculator },
          { id: 'telemetry', label: '📡 TELEMETRY & STORAGE', icon: Activity },
          { id: 'sdk', label: '💻 SDK & REST API', icon: Server },
          { id: 'errors', label: '🛡️ SECURITY & ERRORS', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider whitespace-nowrap border transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#171A1F] border-[#F97316] text-[#F5F7FA] shadow-[0_0_15px_rgba(249,115,22,0.15)] font-bold'
                  : 'bg-[#0C0D10] border-[rgba(255,255,255,0.08)] text-[#B8C0CC] hover:text-[#F5F7FA] hover:bg-[#12141A]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F97316]' : 'text-[#7D8794]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: QUICKSTART & ARCHITECTURE */}
      {activeTab === 'quickstart' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Network & Contract Specs Card */}
          <div className="architectural-panel p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[#9ED8FF]" />
                <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                  LIVE TESTNET DEPLOYMENT CONTRACTS
                </h2>
              </div>
              <span className="text-[10px] mono-font text-[#4ade80] bg-[#4ade80]/10 px-2.5 py-1 border border-[#4ade80]/30 font-bold">
                ● TESTNET ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-1">
                <span className="text-[#7D8794] text-[10px]">ROYALTY MANAGER CONTRACT</span>
                <div className="text-[#F97316] font-bold break-all">{FALLBACK_MANAGER_ID}</div>
              </div>

              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-1">
                <span className="text-[#7D8794] text-[10px]">ROYALTY DISTRIBUTOR CONTRACT</span>
                <div className="text-[#9ED8FF] font-bold break-all">{FALLBACK_DISTRIBUTOR_ID}</div>
              </div>

              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-1">
                <span className="text-[#7D8794] text-[10px]">XLM SAC TOKEN ID</span>
                <div className="text-[#CFAE6E] font-bold break-all">{XLM_SAC_ID}</div>
              </div>
            </div>
          </div>

          {/* 3-Step Protocol Flow */}
          <div className="architectural-panel p-6 md:p-8 space-y-6">
            <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider border-b border-[rgba(255,255,255,0.08)] pb-3">
              PROTOCOL ARCHITECTURAL WORKFLOW
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#F97316]/20 border border-[#F97316] text-[#F97316] text-xs font-bold font-mono flex items-center justify-center">
                    1
                  </span>
                  <Database className="w-4 h-4 text-[#F97316]" />
                </div>
                <h3 className="font-michroma text-xs text-[#F5F7FA]">ASSET REGISTRATION</h3>
                <p className="text-xs text-[#B8C0CC] leading-relaxed">
                  Creators register digital asset IDs on-chain along with an array of contributor addresses and basis point shares summing to exactly 10,000 BPS (100.00%).
                </p>
              </div>

              <div className="p-5 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#9ED8FF]/20 border border-[#9ED8FF] text-[#9ED8FF] text-xs font-bold font-mono flex items-center justify-center">
                    2
                  </span>
                  <Zap className="w-4 h-4 text-[#9ED8FF]" />
                </div>
                <h3 className="font-michroma text-xs text-[#F5F7FA]">SOROBAN PRE-SIMULATION</h3>
                <p className="text-xs text-[#B8C0CC] leading-relaxed">
                  Stellar RPC simulates the transaction footprint, verifying owner authorization (`require_auth()`), ledger read/write storage keys, and gas parameters.
                </p>
              </div>

              <div className="p-5 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#4ade80]/20 border border-[#4ade80] text-[#4ade80] text-xs font-bold font-mono flex items-center justify-center">
                    3
                  </span>
                  <Check className="w-4 h-4 text-[#4ade80]" />
                </div>
                <h3 className="font-michroma text-xs text-[#F5F7FA]">ATOMIC DISTRIBUTION</h3>
                <p className="text-xs text-[#B8C0CC] leading-relaxed">
                  Upon depositing XLM or custom SAC tokens, the smart contract splits and transfers funds to all payee wallets simultaneously in a single ledger block.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOROBAN RUST CONTRACT SPEC */}
      {activeTab === 'contract' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="architectural-panel p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#F97316]" />
                <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                  ROYALTYMANAGER (LIB.RS) SOROBAN SPEC
                </h2>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    `#[contractimpl]
impl RoyaltyManager {
    pub fn register_asset(env: Env, asset_id: Symbol, owner: Address, contributors: Vec<Contributor>) -> Result<(), Error> {
        owner.require_auth();
        let mut total_bps: u32 = 0;
        for c in contributors.iter() {
            total_bps += c.share;
        }
        if total_bps != 10000 {
            return Err(Error::InvalidBpsTotal);
        }
        env.storage().persistent().set(&DataKey::Asset(asset_id.clone()), &AssetData { owner, contributors });
        env.events().publish((symbol_short!("register"), asset_id), true);
        Ok(())
    }
}`,
                    'rust-code'
                  )
                }
                className="text-xs mono-font text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'rust-code' ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'rust-code' ? 'COPIED' : 'COPY RUST CODE'}</span>
              </button>
            </div>

            <p className="text-xs text-[#B8C0CC] leading-relaxed">
              Below is the core Soroban Rust contract implementation deployed on Stellar Testnet. It enforces strict authorization and 10,000 BPS validation.
            </p>

            <pre className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#9ED8FF] overflow-x-auto leading-relaxed">
              <code>{`#[contractimpl]
impl RoyaltyManager {
    /// Registers a new digital asset with contributor BPS allocation.
    pub fn register_asset(
        env: Env,
        asset_id: Symbol,
        owner: Address,
        contributors: Vec<Contributor>,
    ) -> Result<(), Error> {
        // Enforce owner signature authorization
        owner.require_auth();

        // Verify total allocation equals exactly 10,000 BPS (100.00%)
        let mut total_bps: u32 = 0;
        for c in contributors.iter() {
            total_bps += c.share;
        }
        if total_bps != 10000 {
            return Err(Error::InvalidBpsTotal);
        }

        // Store asset record in persistent ledger storage
        let key = DataKey::Asset(asset_id.clone());
        env.storage().persistent().set(&key, &AssetData { owner, contributors });

        // Emit on-chain Soroban event telemetry
        env.events().publish((symbol_short!("register"), asset_id), true);

        Ok(())
    }
}`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: BPS MATH & LIVE CALCULATOR */}
      {activeTab === 'bps' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="architectural-panel p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
              <Calculator className="w-5 h-5 text-[#CFAE6E]" />
              <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                LIVE INTERACTIVE BPS SPLIT CALCULATOR
              </h2>
            </div>

            <p className="text-xs text-[#B8C0CC] leading-relaxed">
              SplitFlow uses integer Basis Points (<code className="text-[#CFAE6E]">1 BPS = 0.01%</code>) to avoid floating-point math issues and ensure zero financial loss.
            </p>

            {/* Live Interactive Calculator Widget */}
            <div className="p-6 bg-[#050505] border border-[rgba(255,255,255,0.1)] space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] mono-font text-[#B8C0CC]">TOTAL ROYALTY AMOUNT (XLM)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-[#0C0D10] border border-[rgba(255,255,255,0.15)] px-3 py-2 text-xs font-mono text-[#F5F7FA] focus:border-[#CFAE6E] outline-none"
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] mono-font text-[#B8C0CC]">TOTAL ALLOCATION STATUS</label>
                  <div
                    className={`px-3 py-2 text-xs font-mono font-bold border flex items-center justify-between ${
                      totalSimPct === 100
                        ? 'bg-[#4ade80]/10 border-[#4ade80]/40 text-[#4ade80]'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    <span>{totalSimPct === 100 ? '✓ VALID 10,000 BPS (100.00%)' : `⚠️ INVALID ${totalSimPct * 100} BPS (${totalSimPct}%)`}</span>
                  </div>
                </div>
              </div>

              {/* Contributor Sliders */}
              <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs mono-font">
                    <span className="text-[#F97316] font-bold">CONTRIBUTOR #1 (PRODUCER)</span>
                    <span className="text-[#F5F7FA]">{simShare1}% ({simShare1 * 100} BPS) → {((numSimAmount * simShare1) / 100).toLocaleString()} XLM</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simShare1}
                    onChange={(e) => setSimShare1(parseInt(e.target.value) || 0)}
                    className="w-full accent-[#F97316]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs mono-font">
                    <span className="text-[#9ED8FF] font-bold">CONTRIBUTOR #2 (VOCALIST)</span>
                    <span className="text-[#F5F7FA]">{simShare2}% ({simShare2 * 100} BPS) → {((numSimAmount * simShare2) / 100).toLocaleString()} XLM</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simShare2}
                    onChange={(e) => setSimShare2(parseInt(e.target.value) || 0)}
                    className="w-full accent-[#9ED8FF]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs mono-font">
                    <span className="text-[#CFAE6E] font-bold">CONTRIBUTOR #3 (RIGHTS LABEL)</span>
                    <span className="text-[#F5F7FA]">{simShare3}% ({simShare3 * 100} BPS) → {((numSimAmount * simShare3) / 100).toLocaleString()} XLM</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simShare3}
                    onChange={(e) => setSimShare3(parseInt(e.target.value) || 0)}
                    className="w-full accent-[#CFAE6E]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TELEMETRY & STORAGE FOOTPRINTS */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="architectural-panel p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
              <Activity className="w-5 h-5 text-[#4ade80]" />
              <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                SOROBAN EVENT TOPICS & LEDGER STORAGE KEYS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-2">
                <span className="text-[#4ade80] font-bold text-xs">EVENT TOPIC: AssetRegistered</span>
                <p className="text-[11px] text-[#B8C0CC]">
                  Topic: <code className="text-[#F5F7FA]">(Symbol("register"), Symbol(asset_id))</code><br />
                  Data: <code className="text-[#F5F7FA]">bool(true)</code>
                </p>
              </div>

              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-2">
                <span className="text-[#4ade80] font-bold text-xs">EVENT TOPIC: PayoutDistributed</span>
                <p className="text-[11px] text-[#B8C0CC]">
                  Topic: <code className="text-[#F5F7FA]">(Symbol("distribute"), Symbol(asset_id))</code><br />
                  Data: <code className="text-[#F5F7FA]">i128(amount_xlm)</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TYPESCRIPT SDK & REST API */}
      {activeTab === 'sdk' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="architectural-panel p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#9ED8FF]" />
                <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                  TYPESCRIPT SDK (@STELLAR/STELLAR-SDK) INVOCATION
                </h2>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    `import { Contract, nativeToScVal, rpc } from '@stellar/stellar-sdk';
const contract = new Contract('${FALLBACK_MANAGER_ID}');
const tx = contract.call('register_asset', 
  nativeToScVal('cyberpunk_ost_2026', { type: 'symbol' }),
  nativeToScVal('GCVGGO...', { type: 'address' })
);`,
                    'ts-code'
                  )
                }
                className="text-xs mono-font text-[#9ED8FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'ts-code' ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'ts-code' ? 'COPIED' : 'COPY TS CODE'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#9ED8FF] overflow-x-auto leading-relaxed">
              <code>{`import { Contract, nativeToScVal, rpc } from '@stellar/stellar-sdk';

const server = new rpc.Server('https://soroban-testnet.stellar.org');
const contract = new Contract('${FALLBACK_MANAGER_ID}');

// Construct Soroban contract call parameters
const tx = contract.call(
  'register_asset',
  nativeToScVal('cyberpunk_ost_2026', { type: 'symbol' }),
  nativeToScVal('GCVGGO...', { type: 'address' }),
  nativeToScVal([
    { address: 'GCVGGO...', share: 5000 },
    { address: 'GAKRKY...', share: 3000 },
    { address: 'GC4EM2...', share: 2000 },
  ])
);`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & ERROR DICTIONARY */}
      {activeTab === 'errors' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="architectural-panel p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
              <ShieldCheck className="w-5 h-5 text-[#F97316]" />
              <h2 className="font-michroma text-sm text-[#F5F7FA] uppercase tracking-wider">
                SMART CONTRACT ERROR DICTIONARY
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.1)] text-[#7D8794]">
                    <th className="p-3">ERROR CODE</th>
                    <th className="p-3">NUMERIC ID</th>
                    <th className="p-[#F5F7FA] p-3">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)] text-[#B8C0CC]">
                  <tr>
                    <td className="p-3 text-[#F97316] font-bold">InvalidBpsTotal</td>
                    <td className="p-3">1</td>
                    <td className="p-3">Total allocation does not sum to exactly 10,000 BPS (100.00%).</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#F97316] font-bold">AssetAlreadyExists</td>
                    <td className="p-3">2</td>
                    <td className="p-3">Asset ID is already registered in persistent storage.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#F97316] font-bold">AssetNotFound</td>
                    <td className="p-3">3</td>
                    <td className="p-3">Requested Asset ID is not registered on-chain.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#F97316] font-bold">ZeroPayoutAmount</td>
                    <td className="p-3">4</td>
                    <td className="p-3">Royalty distribution amount must be greater than 0 XLM.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Console CTA */}
      <div className="architectural-panel p-6 text-center space-y-3">
        <h3 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
          READY TO RUN AN ON-CHAIN TRANSACTION?
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
