'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWalletStore } from '@/store/useWalletStore';
import { ALBEDO_ID } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { XBULL_ID } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { Wallet, LogOut, Loader2, AlertCircle } from 'lucide-react';

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
        <div className="flex items-center gap-3">
          {/* Network Selector */}
          <select
            value={network}
            onChange={(e: any) => setNetwork(e.target.value)}
            className="text-xs bg-accent border border-border text-foreground px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="TESTNET">Testnet</option>
            <option value="PUBLIC">Mainnet</option>
            <option value="STANDALONE">Localhost</option>
          </select>

          {/* Wallet Balance/Info */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent border border-border">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium tracking-wide">
              {truncateAddress(address)}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 text-destructive-foreground transition-all duration-200"
            title="Disconnect Wallet"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isConnecting}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-orange-600 hover:opacity-95 text-white font-semibold text-sm rounded-xl shadow-lg transition-all duration-200 orange-glow-btn cursor-pointer"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}

      {/* Wallet Selector Modal via Portal */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-border shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-wide">Select a Wallet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a supported Stellar wallet to connect.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Freighter */}
              <button
                onClick={() => handleConnect(FREIGHTER_ID)}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    F
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-foreground">Freighter Wallet</div>
                    <div className="text-xs text-muted-foreground">Official Stellar Extension</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Connect &rarr;
                </div>
              </button>

              {/* Albedo */}
              <button
                onClick={() => handleConnect(ALBEDO_ID)}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-lg">
                    A
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-foreground">Albedo Wallet</div>
                    <div className="text-xs text-muted-foreground">Web-based Signer</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Connect &rarr;
                </div>
              </button>

              {/* xBull */}
              <button
                onClick={() => handleConnect(XBULL_ID)}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-lg">
                    X
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-foreground">xBull Wallet</div>
                    <div className="text-xs text-muted-foreground">Multi-chain Wallet</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Connect &rarr;
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground flex items-start gap-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
