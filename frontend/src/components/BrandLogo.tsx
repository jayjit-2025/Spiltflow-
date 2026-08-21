'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'hero';
  className?: string;
}

export default function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 relative flex items-center justify-center">
          <div className="absolute inset-0 border border-[rgba(255,255,255,0.2)] bg-[#0C0D10] rotate-45 transition-colors group-hover:border-[#F97316]" />
          <div className="absolute inset-1 border border-[#F97316] border-dashed rotate-45 opacity-60" />
          <div className="w-3 h-3 bg-gradient-to-br from-[#F97316] to-[#EA580C] rotate-45 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="w-12 h-12 relative flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-[rgba(255,255,255,0.25)] bg-[#0C0D10] rotate-45" />
          <div className="absolute inset-1.5 border-2 border-[#F97316] rotate-45 opacity-80" />
          <div className="w-4 h-4 bg-gradient-to-br from-[#F97316] to-[#EA580C] rotate-45 shadow-[0_0_18px_rgba(249,115,22,0.9)] animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-michroma text-xl font-bold tracking-wider text-[#F5F7FA]">
            SPLITFLOW
          </span>
          <span className="text-[11px] font-mono tracking-widest text-[#F97316] uppercase">
            STELLAR SOROBAN V3.0
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link href="/" className={`flex items-center gap-2.5 sm:gap-3 group shrink-0 ${className}`}>
      {/* Rotated Dual Geometric Diamond Mark */}
      <div className="w-6 h-6 sm:w-7 sm:h-7 relative flex items-center justify-center shrink-0">
        <div className="absolute inset-0 border border-[rgba(255,255,255,0.2)] bg-[#0C0D10] rotate-45 transition-all duration-300 group-hover:border-[#F97316] group-hover:bg-[#171A1F]" />
        <div className="absolute inset-1 border border-[#F97316] border-dashed rotate-45 opacity-75" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-br from-[#F97316] to-[#EA580C] rotate-45 shadow-[0_0_12px_rgba(249,115,22,0.8)] group-hover:scale-110 transition-transform" />
      </div>

      {/* Typography Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-michroma text-xs sm:text-sm font-bold tracking-widest text-[#F5F7FA] group-hover:text-[#F97316] transition-colors">
            SPLITFLOW
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-[#F97316] bg-[#0C0D10] border border-[#F97316]/40 px-1 py-0.5 rounded-none tracking-widest">
            V3
          </span>
        </div>
        <span className="hidden sm:block text-[9px] text-[#7D8794] font-mono tracking-[0.2em] uppercase mt-0.5">
          SOROBAN PROTOCOL
        </span>
      </div>
    </Link>
  );
}
