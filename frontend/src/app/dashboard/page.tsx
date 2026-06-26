'use client';

import React, { useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useTxStore } from '@/store/useTxStore';
import { useActivityStore } from '@/store/useActivityStore';
import {
  fetchAssetDetails,
  buildAndSimulateTx,
  pollTxStatus,
  FALLBACK_MANAGER_ID,
  FALLBACK_DISTRIBUTOR_ID,
  XLM_SAC_ID,
  AssetDetails,
} from '@/services/stellar';
import {
  Wallet,
  Plus,
  Trash2,
  ListPlus,
  Coins,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { nativeToScVal } from '@stellar/stellar-sdk';

export default function DashboardPage() {
  const { isConnected, address, network, initializeKit } = useWalletStore();
  const { addTx, updateTxStatus } = useTxStore();
  const { addActivity } = useActivityStore();

  // Selected manager/distributor addresses (can be modified in settings, fallback default)
  const managerId = FALLBACK_MANAGER_ID;
  const distributorId = FALLBACK_DISTRIBUTOR_ID;

  // Local state for forms
  const [assetId, setAssetId] = useState('');
  const [contributors, setContributors] = useState<{ address: string; share: number }[]>([
    { address: address || '', share: 10000 },
  ]);
  
  // Royalty distribution form state
  const [distAssetId, setDistAssetId] = useState('');
  const [distAmount, setDistAmount] = useState('');

  // Asset search state
  const [searchAssetId, setSearchAssetId] = useState('');
  const [searchedAsset, setSearchedAsset] = useState<AssetDetails | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form errors
  const [registerError, setRegisterError] = useState('');

  // Add/remove contributor fields
  const addContributorField = () => {
    if (contributors.length >= 10) {
      setRegisterError('Maximum 10 contributors allowed.');
      return;
    }
    setContributors([...contributors, { address: '', share: 0 }]);
  };

  const removeContributorField = (index: number) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const updateContributor = (index: number, field: 'address' | 'share', value: string | number) => {
    const updated = contributors.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setContributors(updated);
  };

  // 1. Submit Registration Transaction
  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!isConnected || !address) {
      setRegisterError('Please connect your wallet first.');
      return;
    }

    if (!assetId.trim()) {
      setRegisterError('Asset ID is required.');
      return;
    }

    // Validate contributor addresses and shares
    let totalShares = 0;
    for (const c of contributors) {
      if (!c.address.trim()) {
        setRegisterError('All contributor addresses must be populated.');
        return;
      }
      if (c.share <= 0) {
        setRegisterError('Shares must be greater than 0.');
        return;
      }
      totalShares += c.share;
    }

    if (totalShares !== 10000) {
      setRegisterError(`Total shares must equal exactly 10000 (100.00%). Currently: ${totalShares}.`);
      return;
    }

    // Add transaction to persistent store
    const txId = addTx({
      title: 'Register Asset',
      description: `Registering asset "${assetId}" with ${contributors.length} contributors`,
      txType: 'REGISTER_ASSET',
      txArgs: { assetId, owner: address, contributors, managerId },
    });

    try {
      updateTxStatus(txId, 'PROCESSING');
      const kit = initializeKit();

      // Convert contributors input into Soroban XDR ScVal types
      const scContributors = contributors.map((c) => {
        return nativeToScVal(
          {
            address: c.address,
            share: c.share,
          },
          {
            type: 'map',
            template: {
              address: 'Address',
              share: 'u32',
            },
          }
        );
      });

      // Prepare contract args: register_asset(asset_id: Symbol, owner: Address, contributors: Vec<ContributorShare>)
      const args = [
        nativeToScVal(assetId, { type: 'Symbol' }),
        nativeToScVal(address, { type: 'Address' }),
        nativeToScVal(scContributors, { type: 'Vec' }),
      ];

      // Build, simulate and assemble transaction with resource footprints
      const assembledTx = await buildAndSimulateTx(
        network,
        address,
        managerId,
        'register_asset',
        args
      );

      // Sign transaction via connected wallet
      const { signedTxXdr } = await kit.signTransaction(assembledTx.toXDR());
      
      // Submit to network
      const serverUrl = rpc.Server.prototype.constructor.name; // trick to avoid unused import issues
      const server = new rpc.Server(network === 'PUBLIC' ? 'https://soroban-mainnet.stellar.org' : network === 'TESTNET' ? 'https://soroban-testnet.stellar.org' : 'http://localhost:8000');
      const submissionResponse = await server.sendTransaction(assembledTx.toEnvelope().toXDR());
      
      if (submissionResponse.status === rpc.Api.SendTransactionStatus.ERROR) {
        throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResultXdr)}`);
      }

      const txHash = submissionResponse.hash;
      updateTxStatus(txId, 'PROCESSING', txHash);

      // Poll transaction status
      await pollTxStatus(network, txHash);
      updateTxStatus(txId, 'CONFIRMED', txHash);

      // Add to Activity Feed
      addActivity({
        type: 'REGISTRATION',
        assetId,
        title: 'Asset Registered',
        description: `Successfully registered asset "${assetId}" on-chain`,
        hash: txHash,
        payer: address,
      });

      // Reset form
      setAssetId('');
      setContributors([{ address: address || '', share: 10000 }]);
    } catch (err: any) {
      console.error(err);
      updateTxStatus(txId, 'FAILED', null, err.message || 'Transaction failed');
    }
  };

  // 2. Submit Distribution Transaction
  const handleDistributeRoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!isConnected || !address) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!distAssetId.trim()) {
      alert('Asset ID is required.');
      return;
    }

    const amountNum = parseFloat(distAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Distribution amount must be a positive number.');
      return;
    }

    // Soroban works with i128 stroops. 1 XLM = 10,000,000 stroops (7 decimals)
    const stroopAmount = BigInt(Math.floor(amountNum * 10000000));

    const txId = addTx({
      title: 'Distribute Royalty',
      description: `Splitting ${distAmount} XLM for asset "${distAssetId}"`,
      txType: 'DISTRIBUTE_ROYALTY',
      txArgs: { assetId: distAssetId, amount: distAmount, distributorId },
    });

    try {
      updateTxStatus(txId, 'PROCESSING');
      const kit = initializeKit();

      // args: distribute_royalty(payer: Address, asset_id: Symbol, amount: i128)
      const args = [
        nativeToScVal(address, { type: 'Address' }),
        nativeToScVal(distAssetId, { type: 'Symbol' }),
        nativeToScVal(stroopAmount, { type: 'i128' }),
      ];

      const assembledTx = await buildAndSimulateTx(
        network,
        address,
        distributorId,
        'distribute_royalty',
        args
      );

      const { signedTxXdr } = await kit.signTransaction(assembledTx.toXDR());
      const server = new rpc.Server(network === 'PUBLIC' ? 'https://soroban-mainnet.stellar.org' : network === 'TESTNET' ? 'https://soroban-testnet.stellar.org' : 'http://localhost:8000');
      const submissionResponse = await server.sendTransaction(assembledTx.toEnvelope().toXDR());
      
      if (submissionResponse.status === rpc.Api.SendTransactionStatus.ERROR) {
        throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResultXdr)}`);
      }

      const txHash = submissionResponse.hash;
      updateTxStatus(txId, 'PROCESSING', txHash);

      await pollTxStatus(network, txHash);
      updateTxStatus(txId, 'CONFIRMED', txHash);

      // Add to Activity Feed
      addActivity({
        type: 'DISTRIBUTION',
        assetId: distAssetId,
        title: 'Royalties Distributed',
        description: `Split ${distAmount} XLM for asset "${distAssetId}"`,
        hash: txHash,
        amount: distAmount,
        payer: address,
      });

      setDistAssetId('');
      setDistAmount('');
    } catch (err: any) {
      console.error(err);
      updateTxStatus(txId, 'FAILED', null, err.message || 'Transaction failed');
    }
  };

  // 3. Search On-Chain Asset Details
  const handleSearchAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchedAsset(null);

    if (!searchAssetId.trim()) {
      setSearchError('Please enter an Asset ID.');
      return;
    }

    setIsSearching(true);
    try {
      const details = await fetchAssetDetails(network, managerId, searchAssetId);
      if (details) {
        setSearchedAsset(details);
      } else {
        setSearchError('Asset does not exist or is inactive.');
      }
    } catch (err) {
      setSearchError('Failed to fetch asset from ledger.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 gap-6 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
          <Wallet className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Wallet Connection Required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please connect your Stellar wallet using the button in the header to view your dashboard, register digital assets, and distribute payments.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Console Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your digital assets and execute instant royalty divisions.
          </p>
        </div>
        <div className="text-xs bg-secondary border border-border px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-fit">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-muted-foreground">Connected: {address?.slice(0, 8)}...{address?.slice(-8)}</span>
        </div>
      </div>

      {/* Bento Grid Core Operations */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Panel 1: Register Asset Form */}
        <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-6 relative overflow-hidden glass-card-glow">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <ListPlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold tracking-wide">Register Digital Asset</h3>
          </div>

          <form onSubmit={handleRegisterAsset} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Identifier</label>
              <input
                type="text"
                placeholder="e.g. song_retro_vibe"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-accent border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contributor Split (Max 10)</label>
                <button
                  type="button"
                  onClick={addContributorField}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Payee</span>
                </button>
              </div>

              {contributors.map((c, index) => (
                <div key={index} className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    placeholder="Stellar Wallet Address (G...)"
                    value={c.address}
                    onChange={(e) => updateContributor(index, 'address', e.target.value)}
                    className="flex-1 bg-accent border border-border px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
                  />
                  <div className="relative w-28 shrink-0">
                    <input
                      type="number"
                      placeholder="Share"
                      value={c.share || ''}
                      onChange={(e) => updateContributor(index, 'share', parseInt(e.target.value) || 0)}
                      className="w-full bg-accent border border-border pl-3 pr-8 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground">bps</span>
                  </div>
                  {contributors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContributorField(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {registerError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-orange-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-200 orange-glow-btn cursor-pointer"
            >
              Submit On-Chain Registry
            </button>
          </form>
        </div>

        {/* Panel 2: Distribute Royalties Form & On-Chain Query */}
        <div className="flex flex-col gap-8">
          {/* Form 2: Distribute */}
          <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-6 relative overflow-hidden glass-card-glow">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <Coins className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-wide">Distribute Royalties</h3>
            </div>

            <form onSubmit={handleDistributeRoyalty} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset ID</label>
                  <input
                    type="text"
                    placeholder="e.g. song_retro_vibe"
                    value={distAssetId}
                    onChange={(e) => setDistAssetId(e.target.value)}
                    className="w-full bg-accent border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (XLM)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 100.5"
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    className="w-full bg-accent border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-orange-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-200 orange-glow-btn cursor-pointer"
              >
                Execute Splitting Pipeline
              </button>
            </form>
          </div>

          {/* On-Chain Query */}
          <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-5 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-wide">Query On-Chain Asset Registry</h3>
            </div>

            <form onSubmit={handleSearchAsset} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Asset ID..."
                value={searchAssetId}
                onChange={(e) => setSearchAssetId(e.target.value)}
                className="flex-1 bg-accent border border-border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-xl cursor-pointer"
              >
                {isSearching ? 'Querying...' : 'Search'}
              </button>
            </form>

            {searchError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs">
                {searchError}
              </div>
            )}

            {searchedAsset && (
              <div className="p-4 rounded-xl bg-accent border border-border flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{searchAssetId}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${searchedAsset.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {searchedAsset.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-bold">Owner:</span> {searchedAsset.owner}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shareholders Breakdown</span>
                  <div className="flex flex-col gap-1.5">
                    {searchedAsset.contributors.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-secondary/40 p-2 rounded-lg border border-border/50">
                        <span className="font-mono text-muted-foreground">{c.address.slice(0, 12)}...{c.address.slice(-10)}</span>
                        <span className="font-bold text-foreground">{(c.share / 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
