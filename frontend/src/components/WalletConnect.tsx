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
        <div className="flex items-center gap-2">
          {/* Network Selector */}
          <select
            value={network}
            onChange={(e: any) => setNetwork(e.target.value)}
            className="text-xs bg-[#080808] border border-[rgba(232,237,242,0.12)] text-[#8A8F96] hover:text-[#E8EDF2] px-2 py-1.5 rounded-sm mono-font focus:outline-none focus:border-[#F97316] cursor-pointer"
          >
            <option value="TESTNET">TESTNET</option>
            <option value="PUBLIC">MAINNET</option>
            <option value="STANDALONE">LOCAL</option>
          </select>

          {/* Wallet Address Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#080808] border border-[rgba(232,237,242,0.12)] tech-border">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span className="text-xs mono-font text-[#E8EDF2]">
              [{truncateAddress(address)}]
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-1.5 rounded-sm bg-[#080808] border border-[rgba(232,237,242,0.12)] hover:border-red-500/50 hover:bg-red-950/20 text-[#8A8F96] hover:text-red-400 transition-all cursor-pointer"
            title="Disconnect Wallet"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#080808] hover:bg-[#0A0A0A] border border-[rgba(232,237,242,0.15)] hover:border-[#F97316] text-[#E8EDF2] hover:text-[#F97316] text-xs font-mono rounded-sm transition-all tech-border cursor-pointer"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F97316]" />
              <span className="mono-font">[ INITIALIZING... ]</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
              <span className="mono-font">[ CONNECT_WALLET ]</span>
            </>
          )}
        </button>
      )}

      {/* Wallet Selector Modal via Portal */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#040404]/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md p-6 rounded-sm bg-[#080808] border border-[rgba(232,237,242,0.15)] shadow-2xl tech-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
                  <h3 className="text-sm font-mono text-[#E8EDF2] tracking-wider uppercase">
                    AUTHENTICATE WALLET
                  </h3>
                </div>
                <p className="text-xs text-[#8A8F96] mono-font mt-1">
                  Select a supported Soroban wallet signer to proceed.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[#8A8F96] hover:text-[#E8EDF2] hover:bg-[#0A0A0A] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-950/30 border border-red-800/40 flex items-center gap-2 text-xs text-red-300 mono-font">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={() => handleConnect(FREIGHTER_ID)}
                className="w-full flex items-center justify-between p-3.5 rounded bg-[#0A0A0A] border border-[rgba(232,237,242,0.08)] hover:border-[#F97316]/60 hover:bg-[#080808] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center border border-[rgba(232,237,242,0.1)] text-[#E8EDF2]">
                    <Wallet className="h-4 w-4 text-[#F97316]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#E8EDF2] group-hover:text-[#F97316]">
                      FREIGHTER WALLET
                    </div>
                    <div className="text-[10px] text-[#8A8F96] mono-font">
                      Official Stellar Browser Extension
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#8A8F96] group-hover:text-[#E8EDF2] mono-font">[ SELECT ]</span>
              </button>

              <button
                onClick={() => handleConnect(ALBEDO_ID)}
                className="w-full flex items-center justify-between p-3.5 rounded bg-[#0A0A0A] border border-[rgba(232,237,242,0.08)] hover:border-[#F97316]/60 hover:bg-[#080808] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center border border-[rgba(232,237,242,0.1)] text-[#E8EDF2]">
                    <Wallet className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#E8EDF2] group-hover:text-[#F97316]">
                      ALBEDO LINK
                    </div>
                    <div className="text-[10px] text-[#8A8F96] mono-font">
                      Web-Based Passwordless Key Signer
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#8A8F96] group-hover:text-[#E8EDF2] mono-font">[ SELECT ]</span>
              </button>

              <button
                onClick={() => handleConnect(XBULL_ID)}
                className="w-full flex items-center justify-between p-3.5 rounded bg-[#0A0A0A] border border-[rgba(232,237,242,0.08)] hover:border-[#F97316]/60 hover:bg-[#080808] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center border border-[rgba(232,237,242,0.1)] text-[#E8EDF2]">
                    <Wallet className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#E8EDF2] group-hover:text-[#F97316]">
                      XBULL WALLET
                    </div>
                    <div className="text-[10px] text-[#8A8F96] mono-font">
                      Advanced Multi-Account Wallet
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#8A8F96] group-hover:text-[#E8EDF2] mono-font">[ SELECT ]</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
