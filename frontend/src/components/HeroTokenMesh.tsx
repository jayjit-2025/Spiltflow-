'use client';

import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Zap, Sparkles } from 'lucide-react';

export default function HeroTokenMesh() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center select-none group">
      
      {/* 1. Atmospheric Glowing Backdrop Circles */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F97316]/10 via-[#CFAE6E]/5 to-[#9ED8FF]/10 blur-3xl animate-pulse" />

      {/* 2. Outer Rotating Architectural Orbit Ring (Clockwise 25s) */}
      <div className="absolute inset-2 rounded-full border border-dashed border-[rgba(255,255,255,0.15)] animate-[spin_25s_linear_infinite]" />

      {/* 3. Middle Reverse Orbit Ring (Counter-clockwise 18s) */}
      <div className="absolute inset-10 rounded-full border border-[rgba(249,115,22,0.2)] animate-[spin_18s_linear_infinite_reverse] border-t-[#F97316]" />

      {/* 4. Inner Glacial Blue Orbit Ring (Clockwise 12s) */}
      <div className="absolute inset-20 rounded-full border border-[rgba(158,216,255,0.25)] animate-[spin_12s_linear_infinite] border-b-[#9ED8FF]" />

      {/* 5. Central Soroban Core Badge */}
      <div className="relative z-20 w-36 h-36 rounded-full bg-[#0C0D10] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] flex flex-col items-center justify-center p-4 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-300 transform group-hover:scale-105">
        <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-ping absolute top-3 right-3" />
        <Cpu className="h-7 w-7 text-[#F97316] mb-1.5 animate-pulse" />
        <span className="font-michroma text-[10px] text-[#F5F7FA] tracking-wider text-center">
          SOROBAN CORE
        </span>
        <span className="text-[8px] mono-font text-[#9ED8FF] mt-0.5">
          10,000 BPS
        </span>
      </div>

      {/* 6. Satellite Payee Node 1: Producer (45%) */}
      <div
        onMouseEnter={() => setHoveredNode('producer')}
        onMouseLeave={() => setHoveredNode(null)}
        className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-[#0C0D10] border border-[#F97316] rounded-none shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 hover:scale-110 cursor-pointer flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full" />
        <div className="text-[10px] mono-font">
          <span className="text-[#F5F7FA] font-bold">PRODUCER</span>
          <span className="text-[#F97316] ml-1.5">4,500 BPS (45%)</span>
        </div>
      </div>

      {/* 7. Satellite Payee Node 2: Vocalist (35%) */}
      <div
        onMouseEnter={() => setHoveredNode('vocalist')}
        onMouseLeave={() => setHoveredNode(null)}
        className="absolute bottom-6 right-0 z-30 px-3 py-1.5 bg-[#0C0D10] border border-[#9ED8FF] rounded-none shadow-[0_0_15px_rgba(158,216,255,0.3)] transition-all duration-300 hover:scale-110 cursor-pointer flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 bg-[#9ED8FF] rounded-full" />
        <div className="text-[10px] mono-font">
          <span className="text-[#F5F7FA] font-bold">VOCALIST</span>
          <span className="text-[#9ED8FF] ml-1.5">3,500 BPS (35%)</span>
        </div>
      </div>

      {/* 8. Satellite Payee Node 3: Label (20%) */}
      <div
        onMouseEnter={() => setHoveredNode('label')}
        onMouseLeave={() => setHoveredNode(null)}
        className="absolute bottom-6 left-0 z-30 px-3 py-1.5 bg-[#0C0D10] border border-[#CFAE6E] rounded-none shadow-[0_0_15px_rgba(207,174,110,0.3)] transition-all duration-300 hover:scale-110 cursor-pointer flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 bg-[#CFAE6E] rounded-full" />
        <div className="text-[10px] mono-font">
          <span className="text-[#F5F7FA] font-bold">RIGHTS LABEL</span>
          <span className="text-[#CFAE6E] ml-1.5">2,000 BPS (20%)</span>
        </div>
      </div>

      {/* 9. Floating Telemetry Badge */}
      <div className="absolute top-1/3 -right-6 z-30 hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#050505] border border-[rgba(255,255,255,0.1)] text-[9px] mono-font text-[#B8C0CC]">
        <Zap className="h-3 w-3 text-[#4ade80]" />
        <span>ATOMIC_PAYOUT: 0.00s</span>
      </div>

      {/* 10. Corner Crosshairs */}
      <div className="absolute top-0 left-0 text-[10px] mono-font text-[#7D8794]">+</div>
      <div className="absolute top-0 right-0 text-[10px] mono-font text-[#7D8794]">+</div>
      <div className="absolute bottom-0 left-0 text-[10px] mono-font text-[#7D8794]">+</div>
      <div className="absolute bottom-0 right-0 text-[10px] mono-font text-[#7D8794]">+</div>
    </div>
  );
}
