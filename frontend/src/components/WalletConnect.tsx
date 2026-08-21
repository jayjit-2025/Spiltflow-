'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWalletStore } from '@/store/useWalletStore';
import { ALBEDO_ID } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { XBULL_ID } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { Wallet, LogOut, Loader2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function WalletConnect() {
  const { address, isConnected, isConnecting, error, connect, disconnect, network, setNetwork } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async (walletId: string) => {
    await connect(walletId);
    setIsOpen(false);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative">
      {isConnected && address ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Network Selector */}
          <select
            value={network}
            onChange={(e: any) => setNetwork(e.target.value)}
            aria-label="Select Stellar Network"
            className="hidden sm:inline-block text-xs bg-[#0C0D10] border border-[rgba(255,255,255,0.12)] text-[#B8C0CC] hover:text-[#F5F7FA] hover:border-[#F97316]/50 px-2.5 py-1.5 rounded-none mono-font focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316] cursor-pointer transition-colors"
          >
            <option value="TESTNET">TESTNET</option>
            <option value="PUBLIC">MAINNET</option>
            <option value="STANDALONE">LOCAL</option>
          </select>

          {/* Wallet Address Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-[#0C0D10] border border-[rgba(255,255,255,0.15)] hover:border-[#9ED8FF]/40 transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
            <span className="text-[10px] sm:text-xs mono-font text-[#F5F7FA] font-bold">
              [{truncateAddress(address)}]
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-1.5 rounded-none bg-[#0C0D10] border border-[rgba(255,255,255,0.12)] hover:border-red-500/60 hover:bg-red-950/30 text-[#7D8794] hover:text-red-400 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316] cursor-pointer"
            title="Disconnect Wallet"
            aria-label="Disconnect Wallet"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isConnecting}
          aria-label="Connect Stellar Wallet"
          className="btn-primary flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-mono rounded-none transition-all cursor-pointer shrink-0 border-[#F97316] shadow-[0_0_18px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316]"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F97316]" />
              <span className="mono-font">[ INIT... ]</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="mono-font sm:hidden">[ CONNECT ]</span>
              <span className="mono-font hidden sm:inline">[ CONNECT_WALLET ]</span>
            </>
          )}
        </button>
      )}

      {/* Wallet Selector Modal via Portal */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#050505]/85 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md p-6 bg-[#0C0D10] border border-[rgba(255,255,255,0.15)] shadow-[0_0_50px_rgba(0,0,0,0.9)] border-t-2 border-t-[#F97316]">
            <div className="flex justify-between items-start mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                  <h3 className="text-xs font-mono text-[#F5F7FA] tracking-wider uppercase font-bold">
                    AUTHENTICATE SOROBAN SIGNER
                  </h3>
                </div>
                <p className="text-[11px] text-[#7D8794] mono-font mt-1">
                  Select a supported Stellar wallet keypair to interact with SplitFlow.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#7D8794] hover:text-[#F5F7FA] hover:bg-[#171A1F] transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-800/40 flex items-center gap-2 text-xs text-red-300 mono-font">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleConnect(FREIGHTER_ID)}
                className="w-full flex items-center justify-between p-3.5 bg-[#171A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#F97316] hover:bg-[#1c2027] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0C0D10] flex items-center justify-center border border-[rgba(255,255,255,0.1)] text-[#F5F7FA]">
                    <Wallet className="h-4 w-4 text-[#F97316]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F5F7FA] group-hover:text-[#F97316]">
                      FREIGHTER WALLET
                    </div>
                    <div className="text-[10px] text-[#7D8794] mono-font">
                      Official Stellar Browser Extension
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#7D8794] group-hover:text-[#F5F7FA] mono-font">[ SELECT ]</span>
              </button>

              <button
                onClick={() => handleConnect(ALBEDO_ID)}
                className="w-full flex items-center justify-between p-3.5 bg-[#171A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#F97316] hover:bg-[#1c2027] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0C0D10] flex items-center justify-center border border-[rgba(255,255,255,0.1)] text-[#F5F7FA]">
                    <Wallet className="h-4 w-4 text-[#9ED8FF]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F5F7FA] group-hover:text-[#F97316]">
                      ALBEDO LINK
                    </div>
                    <div className="text-[10px] text-[#7D8794] mono-font">
                      Web-Based Passwordless Key Signer
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#7D8794] group-hover:text-[#F5F7FA] mono-font">[ SELECT ]</span>
              </button>

              <button
                onClick={() => handleConnect(XBULL_ID)}
                className="w-full flex items-center justify-between p-3.5 bg-[#171A1F] border border-[rgba(255,255,255,0.08)] hover:border-[#F97316] hover:bg-[#1c2027] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0C0D10] flex items-center justify-center border border-[rgba(255,255,255,0.1)] text-[#F5F7FA]">
                    <Wallet className="h-4 w-4 text-[#CFAE6E]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F5F7FA] group-hover:text-[#F97316]">
                      XBULL WALLET
                    </div>
                    <div className="text-[10px] text-[#7D8794] mono-font">
                      Advanced Multi-Account Wallet
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#7D8794] group-hover:text-[#F5F7FA] mono-font">[ SELECT ]</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
