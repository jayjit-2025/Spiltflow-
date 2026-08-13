'use client';

import React from 'react';
import { getContractSettings, getNetworkPassphrase, getRpcUrl, FALLBACK_MANAGER_ID, FALLBACK_DISTRIBUTOR_ID } from '@/services/stellar';
import { useWalletStore } from '@/store/useWalletStore';
import { Settings, ShieldCheck, Database, Server, Key, AlertTriangle, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { isConnected, address, activeWallet } = useWalletStore();
  const { managerId: managerContractId, distributorId: distributorContractId } = getContractSettings();
  const rpcUrl = getRpcUrl();
  const networkPassphrase = getNetworkPassphrase();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#F97316]">SOROBAN_PROTOCOL_CONFIGURATION</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">SETTINGS & NETWORK CONTEXT</h1>
          <p className="text-xs text-[#B8C0CC]">
            Active Soroban smart contract addresses, RPC telemetry endpoint, and wallet signer configurations.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
          <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
          <span className="text-[#B8C0CC]">NETWORK:</span>
          <span className="text-[#F5F7FA] font-bold">STELLAR_TESTNET</span>
        </div>
      </div>

      {/* Contract Configuration Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module 1: Smart Contract Registry Configuration */}
        <div className="architectural-panel p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-[#F97316]" />
              <h2 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
                SOROBAN SMART CONTRACTS
              </h2>
            </div>
            <span className="text-[10px] mono-font text-[#F97316]">CONTRACT_ADDRESSES</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Royalty Manager Contract */}
            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#7D8794]">ROYALTY_MANAGER_CONTRACT:</span>
                {managerContractId ? (
                  <span className="text-[#4ade80] text-[10px] px-2 py-0.5 border border-[#4ade80]/30 bg-[#4ade80]/10">ENV_CONFIGURED</span>
                ) : (
                  <span className="text-amber-400 text-[10px] px-2 py-0.5 border border-amber-400/30 bg-amber-400/10">USING_FALLBACK</span>
                )}
              </div>
              <div className="text-[#F5F7FA] break-all select-all font-bold">
                {managerContractId || FALLBACK_MANAGER_ID}
              </div>
            </div>

            {/* Royalty Distributor Contract */}
            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#7D8794]">ROYALTY_DISTRIBUTOR_CONTRACT:</span>
                {distributorContractId ? (
                  <span className="text-[#4ade80] text-[10px] px-2 py-0.5 border border-[#4ade80]/30 bg-[#4ade80]/10">ENV_CONFIGURED</span>
                ) : (
                  <span className="text-amber-400 text-[10px] px-2 py-0.5 border border-amber-400/30 bg-amber-400/10">USING_FALLBACK</span>
                )}
              </div>
              <div className="text-[#F5F7FA] break-all select-all font-bold">
                {distributorContractId || FALLBACK_DISTRIBUTOR_ID}
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Network & Wallet Context */}
        <div className="architectural-panel p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-[#9ED8FF]" />
              <h2 className="font-michroma text-xs text-[#F5F7FA] uppercase tracking-wider">
                NETWORK & SIGNER CONTEXT
              </h2>
            </div>
            <span className="text-[10px] mono-font text-[#9ED8FF]">RPC_TELEMETRY</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* RPC Endpoint */}
            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1.5">
              <div className="text-[11px] text-[#7D8794]">STELLAR RPC ENDPOINT:</div>
              <div className="text-[#9ED8FF] break-all select-all font-bold">{rpcUrl}</div>
            </div>

            {/* Network Passphrase */}
            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1.5">
              <div className="text-[11px] text-[#7D8794]">NETWORK PASSPHRASE:</div>
              <div className="text-[#F5F7FA] break-all select-all font-bold">{networkPassphrase}</div>
            </div>

            {/* Wallet Signer Context */}
            <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#7D8794]">CONNECTED WALLET:</span>
                <span className="text-[#F97316] uppercase">{activeWallet || 'NONE'}</span>
              </div>
              <div className="text-[#F5F7FA] break-all font-bold">
                {isConnected && address ? address : 'NOT CONNECTED'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
