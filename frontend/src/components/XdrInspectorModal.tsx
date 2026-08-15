'use client';

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Database, Cpu, ShieldCheck } from 'lucide-react';

interface XdrInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId?: string;
  operationType?: string;
  xdrString?: string;
}

export default function XdrInspectorModal({
  isOpen,
  onClose,
  assetId = 'cyberpunk_ost_2026',
  operationType = 'register_asset',
  xdrString,
}: XdrInspectorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleXdr =
    xdrString ||
    'AAAAAgAAAAA1N7F3e4qfX5H8D...AAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAA=';

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleXdr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-fade-in-up">
      <div className="w-full max-w-3xl bg-[#0C0D10] border border-[rgba(255,255,255,0.15)] shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 md:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-[#F97316]" />
            <div>
              <h3 className="font-michroma text-sm text-[#F5F7FA]">SOROBAN XDR PAYLOAD INSPECTOR</h3>
              <p className="text-[10px] mono-font text-[#9ED8FF]">FUNCTION: {operationType.toUpperCase()} ({assetId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7D8794] hover:text-[#F5F7FA] hover:bg-[#171A1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Raw XDR String Box */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs mono-font">
            <span className="text-[#B8C0CC]">TRANSACTION ENVELOPE XDR</span>
            <button
              onClick={handleCopy}
              className="text-[10px] mono-font text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY XDR'}</span>
            </button>
          </div>
          <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.08)] font-mono text-[11px] text-[#9ED8FF] break-all max-h-28 overflow-y-auto select-all leading-relaxed">
            {sampleXdr}
          </div>
        </div>

        {/* Section 2: Decoded ScVal Parameters */}
        <div className="space-y-2">
          <div className="text-xs mono-font text-[#B8C0CC]">DECODED SOROBAN SCVAL PARAMETERS</div>
          <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#B8C0CC] space-y-2">
            <div className="flex gap-2">
              <span className="text-[#F97316] font-bold">param[0]:</span>
              <span className="text-[#F5F7FA]">ScVal::Symbol("{assetId}")</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#F97316] font-bold">param[1]:</span>
              <span className="text-[#F5F7FA]">ScVal::Address("GCVGGOLEXAX6474V3JWG2CRSTB2SFZDJI4AXMC7W3NSZU6F...")</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#F97316] font-bold">param[2]:</span>
              <span className="text-[#F5F7FA]">
                ScVal::Vec([Map{"{address: GCVG..., share: 5000}"}, Map{"{address: GAKR..., share: 3000}"}, Map{"{address: GC4E..., share: 2000}"}])
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Footprint Keys & Storage Footprint Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs mono-font text-[#CFAE6E]">
              <Database className="w-3.5 h-3.5" />
              <span>SOROBAN FOOTPRINT KEYS</span>
            </div>
            <p className="text-[10px] mono-font text-[#7D8794]">
              Read-Write persistent ledger entry key for <code className="text-[#F5F7FA]">AssetData("{assetId}")</code>.
            </p>
          </div>

          <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs mono-font text-[#4ade80]">
              <Cpu className="w-3.5 h-3.5" />
              <span>SIMULATED RESOURCE FOOTPRINT</span>
            </div>
            <p className="text-[10px] mono-font text-[#7D8794]">
              CPU Instructions: <span className="text-[#F5F7FA]">3,840</span> | Memory: <span className="text-[#F5F7FA]">1.2 KB</span> | Fee: <span className="text-[#F5F7FA]">100 Stroops</span>
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[rgba(255,255,255,0.08)]">
          <a
            href="https://laboratory.stellar.org/#xdr-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mono-font text-[#9ED8FF] hover:underline flex items-center gap-1"
          >
            <span>OPEN STELLAR XDR LABORATORY</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#171A1F] hover:bg-[#222730] border border-[rgba(255,255,255,0.2)] text-[#F5F7FA] font-mono text-xs tracking-wider uppercase transition-all"
          >
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
}
