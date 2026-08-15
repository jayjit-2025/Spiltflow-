'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import WalletConnect from '@/components/WalletConnect';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'HOME', href: '/' },
  { name: 'DASHBOARD', href: '/dashboard' },
  { name: 'EVENTS', href: '/activity' },
  { name: 'LEDGER', href: '/transactions' },
  { name: 'ANALYTICS', href: '/analytics' },
  { name: 'DOCS', href: '/docs' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Left */}
        <BrandLogo variant="full" />

        {/* Desktop Navigation Box */}
        <nav className="hidden lg:flex items-center bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] px-1 py-1 rounded-none">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <React.Fragment key={item.href}>
                {idx > 0 && <div className="w-[1px] h-3 bg-[rgba(255,255,255,0.1)]" />}
                <Link
                  href={item.href}
                  className={`px-4 py-1 text-xs mono-font transition-colors ${
                    isActive ? 'text-[#F97316] font-bold bg-[#171A1F]' : 'text-[#B8C0CC] hover:text-[#F5F7FA]'
                  }`}
                >
                  {item.name}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Actions: Wallet Connect & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <WalletConnect />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#B8C0CC] hover:text-[#F5F7FA] border border-[rgba(255,255,255,0.1)] bg-[#0C0D10] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#F97316]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[rgba(255,255,255,0.1)] bg-[#0C0D10] px-4 py-4 space-y-2 animate-fade-in-up">
          <div className="text-[10px] mono-font text-[#7D8794] px-3 pb-1 border-b border-[rgba(255,255,255,0.05)]">
            NAVIGATION MENU
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs mono-font border transition-all ${
                  isActive
                    ? 'border-[#F97316] bg-[#171A1F] text-[#F97316] font-bold'
                    : 'border-transparent text-[#B8C0CC] hover:text-[#F5F7FA] hover:bg-[#12141A]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
