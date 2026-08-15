'use client';

import React, { useState } from 'react';
import { Sliders, Zap, CheckCircle2, Play, RefreshCw } from 'lucide-react';

export default function RoyaltySimulator() {
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [producerShare, setProducerShare] = useState<number>(50);
  const [vocalistShare, setVocalistShare] = useState<number>(30);
  const [composerShare, setComposerShare] = useState<number>(20);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedTxHash, setSimulatedTxHash] = useState<string | null>(null);

  const totalBps = (producerShare + vocalistShare + composerShare) * 100;
  const isValidSplit = totalBps === 10000;

  const handleSimulate = () => {
    setIsSimulating(true);
    setSimulatedTxHash(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedTxHash(
        `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 8)}`
      );
    }, 800);
  };

  const handleReset = () => {
    setProducerShare(50);
    setVocalistShare(30);
    setComposerShare(20);
    setDepositAmount(1000);
    setSimulatedTxHash(null);
  };

  return (
    <div className="w-full bg-[#0C0D10] border border-[rgba(255,255,255,0.12)] p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative group overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#F97316] animate-pulse" />
          <span className="font-michroma text-xs text-[#F5F7FA] tracking-wider uppercase">
            LIVE ROYALTY SPLIT SIMULATOR
          </span>
        </div>
        <button
          onClick={handleReset}
          className="text-[11px] mono-font text-[#7D8794] hover:text-[#9ED8FF] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> RESET
        </button>
      </div>

      {/* Input: Deposit Amount */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center text-xs">
          <label className="text-[#B8C0CC] mono-font">ROYALTY DEPOSIT AMOUNT (XLM)</label>
          <span className="text-[#F97316] font-bold mono-font">{depositAmount.toLocaleString()} XLM</span>
        </div>
        <input
          type="range"
          min="10"
          max="10000"
          step="10"
          value={depositAmount}
          onChange={(e) => setDepositAmount(Number(e.target.value))}
          className="w-full h-1.5 bg-[#171A1F] appearance-none cursor-pointer accent-[#F97316]"
        />
      </div>

      {/* Contributor Split Sliders */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center text-xs border-b border-[rgba(255,255,255,0.05)] pb-2">
          <span className="text-[#7D8794] mono-font">CONTRIBUTOR SHARES (BASIS POINTS)</span>
          <span
            className={`mono-font font-bold text-[11px] px-2 py-0.5 border ${
              isValidSplit
                ? 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10'
                : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}
          >
            {totalBps.toLocaleString()} BPS ({isValidSplit ? '100.00%' : 'INVALID'})
          </span>
        </div>

        {/* Payee 1: Producer */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mono-font">
            <span className="text-[#F5F7FA]">PRODUCER (WALLET A)</span>
            <span className="text-[#F97316]">{producerShare}% ({producerShare * 100} BPS)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={producerShare}
            onChange={(e) => setProducerShare(Number(e.target.value))}
            className="w-full h-1.5 bg-[#171A1F] appearance-none cursor-pointer accent-[#F97316]"
          />
        </div>

        {/* Payee 2: Vocalist */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mono-font">
            <span className="text-[#F5F7FA]">VOCALIST (WALLET B)</span>
            <span className="text-[#9ED8FF]">{vocalistShare}% ({vocalistShare * 100} BPS)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={vocalistShare}
            onChange={(e) => setVocalistShare(Number(e.target.value))}
            className="w-full h-1.5 bg-[#171A1F] appearance-none cursor-pointer accent-[#9ED8FF]"
          />
        </div>

        {/* Payee 3: Composer */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mono-font">
            <span className="text-[#F5F7FA]">COMPOSER (WALLET C)</span>
            <span className="text-[#CFAE6E]">{composerShare}% ({composerShare * 100} BPS)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={composerShare}
            onChange={(e) => setComposerShare(Number(e.target.value))}
            className="w-full h-1.5 bg-[#171A1F] appearance-none cursor-pointer accent-[#CFAE6E]"
          />
        </div>
      </div>

      {/* Real-Time Calculated Split Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2 bg-[#050505] p-3 border border-[rgba(255,255,255,0.06)] mb-6 text-center">
        <div>
          <div className="text-[10px] mono-font text-[#7D8794]">PRODUCER</div>
          <div className="text-xs font-bold font-mono text-[#F97316]">
            {((depositAmount * producerShare) / 100).toFixed(1)} XLM
          </div>
        </div>
        <div>
          <div className="text-[10px] mono-font text-[#7D8794]">VOCALIST</div>
          <div className="text-xs font-bold font-mono text-[#9ED8FF]">
            {((depositAmount * vocalistShare) / 100).toFixed(1)} XLM
          </div>
        </div>
        <div>
          <div className="text-[10px] mono-font text-[#7D8794]">COMPOSER</div>
          <div className="text-xs font-bold font-mono text-[#CFAE6E]">
            {((depositAmount * composerShare) / 100).toFixed(1)} XLM
          </div>
        </div>
      </div>

      {/* Simulation Action Button */}
      <button
        onClick={handleSimulate}
        disabled={!isValidSplit || isSimulating}
        className="w-full py-3 bg-[#171A1F] hover:bg-[#222730] border border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSimulating ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F97316]" />
            <span>EXECUTING SOROBAN WASM SPLIT...</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 text-[#F97316]" />
            <span>SIMULATE ATOMIC DISTRIBUTION</span>
          </>
        )}
      </button>

      {/* Simulated TX Output Banner */}
      {simulatedTxHash && (
        <div className="mt-4 p-3 bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-xs mono-font flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>SIMULATED ON-CHAIN ATOMIC PAYOUT SETTLED (&lt;0.05s) — TX: {simulatedTxHash}</span>
        </div>
      )}
    </div>
  );
}
