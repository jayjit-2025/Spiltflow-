'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useTxStore } from '@/store/useTxStore';
import { useActivityStore } from '@/store/useActivityStore';
import { FALLBACK_MANAGER_ID, FALLBACK_DISTRIBUTOR_ID, XLM_SAC_ID, TESTNET_RPC_URL } from '@/services/stellar';
import { Settings, Save, RotateCcw, Shield, Server, Wallet, Database } from 'lucide-react';

export default function SettingsPage() {
  const { network, setNetwork } = useWalletStore();
  const { clearHistory } = useTxStore();
  const { clearActivities } = useActivityStore();

  const [managerId, setManagerId] = useState(FALLBACK_MANAGER_ID);
  const [distributorId, setDistributorId] = useState(FALLBACK_DISTRIBUTOR_ID);
  const [tokenId, setTokenId] = useState(XLM_SAC_ID);
  const [rpcUrl, setRpcUrl] = useState(TESTNET_RPC_URL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedManager = localStorage.getItem('splitflow:manager_id') || FALLBACK_MANAGER_ID;
      let storedDistributor = localStorage.getItem('splitflow:distributor_id');
      const storedToken = localStorage.getItem('splitflow:token_id') || XLM_SAC_ID;
      const storedRpc = localStorage.getItem('splitflow:rpc_url') || TESTNET_RPC_URL;

      // Auto-heal: If saved distributor ID is empty, equals manager ID, or matches the old distributor ID, replace with fallback distributor ID
      if (
        (!storedDistributor ||
          storedDistributor === storedManager ||
          storedDistributor === 'CBDSNV5OLO7OR5BH3AQOEEWXGDBBZCVT6FDJT7MCOHHH53MPVRKZV27K') &&
        FALLBACK_DISTRIBUTOR_ID &&
        FALLBACK_DISTRIBUTOR_ID !== storedManager
      ) {
        storedDistributor = FALLBACK_DISTRIBUTOR_ID;
        localStorage.setItem('splitflow:distributor_id', FALLBACK_DISTRIBUTOR_ID);
      }

      setManagerId(storedManager);
      if (storedDistributor) setDistributorId(storedDistributor);
      setTokenId(storedToken);
      setRpcUrl(storedRpc);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a full implementation, these would be persisted to a separate Zustand slice
    // or written into a local config store consumed by the services layer
    if (typeof window !== 'undefined') {
      localStorage.setItem('splitflow:manager_id', managerId);
      localStorage.setItem('splitflow:distributor_id', distributorId);
      localStorage.setItem('splitflow:token_id', tokenId);
      localStorage.setItem('splitflow:rpc_url', rpcUrl);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setManagerId(FALLBACK_MANAGER_ID);
    setDistributorId(FALLBACK_DISTRIBUTOR_ID);
    setTokenId(XLM_SAC_ID);
    setRpcUrl(TESTNET_RPC_URL);
    setSaved(false);
  };

  const handleClearAll = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure? This will clear all transaction history and activity logs.')) {
      clearHistory();
      clearActivities();
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            <span>Settings</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure contract addresses, RPC endpoints, and network preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Network Configuration */}
        <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Server className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Network & RPC</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Network</label>
              <select
                value={network}
                onChange={(e: any) => setNetwork(e.target.value)}
                className="bg-accent border border-border text-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="TESTNET">Testnet</option>
                <option value="PUBLIC">Mainnet (Public)</option>
                <option value="STANDALONE">Localhost / Futurenet</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">RPC Server URL</label>
              <input
                type="url"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="bg-accent border border-border text-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contract Addresses</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Royalty Manager Contract ID
              </label>
              <input
                type="text"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                placeholder="C..."
                className="bg-accent border border-border text-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Royalty Distributor Contract ID
              </label>
              <input
                type="text"
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                placeholder="C..."
                className="bg-accent border border-border text-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Payment Token Contract ID (SAC)
              </label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="C... (e.g. native XLM SAC)"
                className="bg-accent border border-border text-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                The token contract implementing the SEP-0041 interface. Default is the native XLM Stellar Asset Contract.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-orange-600 text-white font-bold text-sm rounded-xl orange-glow-btn cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saved ? 'Saved Successfully!' : 'Save Configuration'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-secondary border border-border hover:bg-secondary/80 text-foreground font-bold text-sm rounded-xl cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </form>

      {/* Security / Data Management */}
      <div className="p-6 rounded-2xl border border-destructive/25 bg-destructive/5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Data Management</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This action will permanently clear all locally stored transaction history and activity logs from your browser.
          On-chain data on the Stellar ledger is immutable and will not be affected.
        </p>
        <button
          type="button"
          onClick={handleClearAll}
          className="w-fit flex items-center gap-2 px-5 py-2.5 bg-destructive/15 border border-destructive/30 hover:bg-destructive/25 text-destructive-foreground font-bold text-sm rounded-xl cursor-pointer transition-colors"
        >
          Clear All Local Data
        </button>
      </div>

      {/* Security Audit Notes */}
      <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Security Notes</h3>
        </div>
        <ul className="flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
          {[
            'Private keys are never stored by SplitFlow. All signing happens inside your wallet extension.',
            'Contract interactions are simulated first to calculate exact fees before broadcasting.',
            'Smart contracts use require_auth() to prevent unauthorized state modifications.',
            'All contributor share sums are validated on-chain to equal exactly 10,000 basis points (100.00%).',
            'Asset owners can deactivate their assets immediately to halt further distribution.',
            'The Royalty Manager and Distributor use Persistent storage with TTL extension to prevent state expiration.',
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
