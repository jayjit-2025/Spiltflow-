'use client';

import React, { useState, useEffect } from 'react';
import { fetchStellarTelemetry, StellarTelemetry } from '@/services/stellar';
import { Activity, Cpu, ShieldCheck } from 'lucide-react';

export default function StellarTelemetryBadge() {
  const [telemetry, setTelemetry] = useState<StellarTelemetry>({
    ledgerSequence: 1482905,
    blockTimeSec: 3.8,
    baseFeeStroops: 100,
    status: 'ONLINE',
  });

  useEffect(() => {
    let isSubscribed = true;
    const loadTelemetry = async () => {
      const data = await fetchStellarTelemetry('TESTNET');
      if (isSubscribed && data) {
        setTelemetry(data);
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, 10000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="inline-flex flex-wrap items-center gap-3 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] px-3 py-1.5 mono-font text-[11px]">
      {/* Network Online Pulse */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
        <span className="text-[#F5F7FA] font-bold">TESTNET</span>
      </div>

      <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.15)]" />

      {/* Live Ledger Sequence */}
      <div className="flex items-center gap-1 text-[#B8C0CC]">
        <Activity className="w-3 h-3 text-[#F97316]" />
        <span>LEDGER #{telemetry.ledgerSequence.toLocaleString()}</span>
      </div>

      <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.15)] hidden sm:block" />

      {/* Block Time */}
      <div className="hidden sm:flex items-center gap-1 text-[#B8C0CC]">
        <span className="text-[#9ED8FF]">~{telemetry.blockTimeSec}s</span>
        <span>BLOCK</span>
      </div>

      <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.15)] hidden md:block" />

      {/* Gas Fee */}
      <div className="hidden md:flex items-center gap-1 text-[#B8C0CC]">
        <Cpu className="w-3 h-3 text-[#CFAE6E]" />
        <span className="text-[#CFAE6E]">{telemetry.baseFeeStroops} STROOPS</span>
        <span className="text-[9px] text-[#7D8794]">(0.00001 XLM)</span>
      </div>
    </div>
  );
}
