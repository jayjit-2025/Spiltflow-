'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Code2,
  Cpu,
  Terminal,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" /> SplitFlow Documentation Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Developer & User Technical Docs
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-base">
            Complete technical specification, smart contract references, Stellar SDK integration guides, architecture models, and user guides.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>1. Overview</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>2. Architecture & BPS</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'contracts'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>3. Smart Contracts</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('frontend')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'frontend'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>4. Stellar SDK</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('deployment')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'deployment'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>5. Deployment & CI/CD</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('userguide')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'userguide'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-pink-400" />
                <span>6. User Guide</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          <a
            href="https://github.com/jayjit-2025/Spiltflow-/tree/main/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
          >
            <span>View Docs Repository in Git</span>
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
          </a>
        </div>

        {/* Content Viewer Area */}
        <div className="lg:col-span-9 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">SplitFlow Platform Overview</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Automated, trustless on-chain royalty distribution for digital assets on Stellar Soroban.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4" /> Multi-Contract Architecture
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Decouples digital asset registry governance (<code className="text-purple-300">RoyaltyManager</code>) from payment splitting execution (<code className="text-purple-300">RoyaltyDistributor</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Basis Point Precision
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Stores shares in basis points (1 bp = 0.01%) with strict on-chain validation requiring exact 10,000 basis points sum.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200">Core Workflow Summary</h3>
                <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
                  <li><strong>Asset Registration:</strong> Creator registers Asset ID & contributor split shares.</li>
                  <li><strong>Purchase & Distribution:</strong> Buyer sends XLM to RoyaltyDistributor for an asset.</li>
                  <li><strong>Atomic Token Split:</strong> Soroban contract transfers exact split shares to each contributor in one transaction.</li>
                  <li><strong>Permanent Audit Record:</strong> Soroban ledger records events and transaction hashes permanently.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">System Architecture & BPS Math</h2>
                <p className="text-slate-400 text-sm mt-1">
                  On-chain payment splitting formulas and decoupled contract design.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-purple-300">
                <div className="text-slate-400">// Basis Points Conversion Formula</div>
                <div>Share Percentage (%) = Basis Points (BPS) / 100</div>
                <div>Example: 5000 BPS = 50.00% | 3000 BPS = 30.00% | 2000 BPS = 20.00%</div>
                <div className="text-slate-400 mt-2">// Payment Calculation</div>
                <div>Contributor_Payment = (Total_Stroops * Contributor_BPS) / 10000</div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">Smart Contracts Specification</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Rust smart contracts compiled to Soroban WASM targets.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <h3 className="font-semibold text-purple-300 text-sm">1. RoyaltyManager (Asset Registry)</h3>
                  <p className="text-slate-300 text-xs">
                    Manages asset ownership, contributor address vectors, BPS share validation, and activation status.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <h3 className="font-semibold text-blue-300 text-sm">2. RoyaltyDistributor (Payment Engine)</h3>
                  <p className="text-slate-300 text-xs">
                    Executes atomic token transfers using Native XLM Soroban Asset Contract (SAC).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frontend' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">Stellar SDK Service Layer</h2>
                <p className="text-slate-400 text-sm mt-1">
                  How the Next.js frontend connects to Soroban RPC nodes via <code className="text-purple-300">@stellar/stellar-sdk</code>.
                </p>
              </div>

              <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800">
                <button
                  onClick={() => handleCopy(`import { rpc, Contract, TransactionBuilder } from '@stellar/stellar-sdk';`, 'sdk')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  {copiedCode === 'sdk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="font-mono text-xs text-purple-300 overflow-x-auto">
{`import { rpc, Contract, TransactionBuilder, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

export async function fetchAssetDetails(network, managerId, assetId) {
  const server = new rpc.Server(getRpcUrl(network));
  const contract = new Contract(managerId);
  const response = await server.simulateTransaction(...);
  return scValToNative(response.result.retval);
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">Deployment & CI/CD Guide</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Build WASM binaries, deploy to Testnet, and automate testing.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-300 space-y-2">
                <div># Compile Soroban WASM release binaries</div>
                <div className="text-slate-200">cargo build --target wasm32-unknown-unknown --release --workspace</div>
                <div># Run contract unit tests</div>
                <div className="text-slate-200">cargo test --workspace</div>
                <div># Run live Testnet deployment & integration tests</div>
                <div className="text-slate-200">npm run test:integration</div>
              </div>
            </div>
          )}

          {activeTab === 'userguide' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white">User & Creator Onboarding Guide</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Step-by-step instructions for asset registration and royalty collection.
                </p>
              </div>

              <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
                <li><strong>Connect Wallet:</strong> Click Connect Wallet in top right (Freighter, Albedo, xBull, HANA).</li>
                <li><strong>Fill Asset Form:</strong> Enter Asset ID and add contributor wallet addresses & shares.</li>
                <li><strong>Submit Registration:</strong> Confirm the BPS split equals 100.00% and approve signature in Freighter.</li>
                <li><strong>Distribute Payments:</strong> Enter Asset ID & payment amount in XLM to execute atomic royalty payout.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
