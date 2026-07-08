'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  getContractSettings,
  getNetworkPassphrase,
  getRpcUrl,
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
  Activity,
  ArrowRight,
} from 'lucide-react';
import { nativeToScVal, xdr, rpc, TransactionBuilder } from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

// ─── Registration Success Modal ──────────────────────────────────────────────
function RegistrationSuccessModal({
  assetId,
  onGoToFeed,
}: {
  assetId: string;
  onGoToFeed: () => void;
}) {
  // Lock page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-success-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-[hsl(224,71%,4%)] p-8 flex flex-col items-center gap-6 shadow-2xl"
        style={{
          boxShadow: '0 0 60px rgba(249,115,22,0.12), 0 25px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Glow ring around icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-green-500/10 blur-xl" />
          <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Copy */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h3
            id="reg-success-title"
            className="text-xl font-black tracking-tight text-foreground"
          >
            Asset Successfully Registered
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            <span className="font-semibold text-foreground">&ldquo;{assetId}&rdquo;</span> has been
            successfully registered on the Stellar blockchain.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Visit the Activity Feed to verify your registration and view the transaction details.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border" />

        {/* CTA */}
        <button
          id="go-to-activity-feed-btn"
          onClick={onGoToFeed}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary to-orange-600 hover:opacity-95 transition-all duration-200 orange-glow-btn cursor-pointer"
        >
          <Activity className="h-4 w-4" />
          <span>Go to Activity Feed</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, address, network, initializeKit } = useWalletStore();
  const { addTx, updateTxStatus } = useTxStore();
  const { addActivity } = useActivityStore();
  
  // Selected manager/distributor addresses (can be modified in settings, fallback default)
  const [managerId, setManagerId] = useState(FALLBACK_MANAGER_ID);
  const [distributorId, setDistributorId] = useState(FALLBACK_DISTRIBUTOR_ID);

  useEffect(() => {
    const settings = getContractSettings();
    let currentDistributorId = settings.distributorId;

    // Auto-heal: If the saved distributor ID is empty or incorrectly set to the manager ID,
    // and we have a valid fallback distributor contract, update it automatically.
    if (
      (!currentDistributorId ||
        currentDistributorId === settings.managerId ||
        currentDistributorId === 'CBDSNV5OLO7OR5BH3AQOEEWXGDBBZCVT6FDJT7MCOHHH53MPVRKZV27K') &&
      FALLBACK_DISTRIBUTOR_ID &&
      FALLBACK_DISTRIBUTOR_ID !== settings.managerId
    ) {
      currentDistributorId = FALLBACK_DISTRIBUTOR_ID;
      if (typeof window !== 'undefined') {
        localStorage.setItem('splitflow:distributor_id', FALLBACK_DISTRIBUTOR_ID);
      }
    }

    setManagerId(settings.managerId);
    setDistributorId(currentDistributorId);
  }, []);

  // Local state for forms
  const [assetId, setAssetId] = useState('');
  const [contributors, setContributors] = useState<{ address: string; share: number }[]>([
    { address: address || '', share: 100 },
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

  // Success modal: stores the asset ID of the just-confirmed registration,
  // or null when the modal is not visible.
  const [successAssetId, setSuccessAssetId] = useState<string | null>(null);

  // Add/remove contributor fields
  // Validation function for Asset ID
  const validateAssetId = (val: string): { isValid: boolean; error: string } => {
    if (!val) {
      return { isValid: false, error: 'Asset ID is required.' };
    }
    if (val.length < 3 || val.length > 32) {
      return { isValid: false, error: 'Asset ID must be between 3 and 32 characters.' };
    }
    // Check characters: A-Z, a-z, 0-9, hyphen, underscore
    const allowedRegex = /^[a-zA-Z0-9-_]+$/;
    if (!allowedRegex.test(val)) {
      return { isValid: false, error: 'Spaces and special characters are not allowed.' };
    }
    return { isValid: true, error: '' };
  };

  const handleAssetIdChange = (val: string) => {
    setAssetId(val);
    const result = validateAssetId(val);
    if (!val) {
      setValidationError('');
      setValidationStatus('IDLE');
    } else if (result.isValid) {
      setValidationError('');
      setValidationStatus('VALID');
    } else {
      setValidationError(result.error);
      setValidationStatus('INVALID');
    }
  };

  // Validation state variables
  const [validationError, setValidationError] = useState('');
  const [validationStatus, setValidationStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');

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

    const validation = validateAssetId(assetId);
    if (!validation.isValid) {
      setRegisterError(validation.error);
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

    if (totalShares !== 100) {
      setRegisterError(`Total shares must equal exactly 100%. Currently: ${totalShares}%.`);
      return;
    }

    // Convert percentages to basis points (bps) before writing to store/sending to contract
    const bpsContributors = contributors.map((c) => ({
      address: c.address,
      share: Math.round(c.share * 100),
    }));

    // Add transaction to persistent store
    const txId = addTx({
      title: 'Register Asset',
      description: `Registering asset "${assetId}" with ${contributors.length} contributors`,
      txType: 'REGISTER_ASSET',
      txArgs: { assetId, owner: address, contributors: bpsContributors, managerId },
    });

    try {
      updateTxStatus(txId, 'PROCESSING');
      initializeKit();
      
      // Convert contributors into Soroban XDR ScVal struct instances.
      // Each ContributorShare is a Soroban struct: { address: Address, share: u32 }
      const scContributors = bpsContributors.map((c) =>
        xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('address'),
            val: nativeToScVal(c.address, { type: 'address' }),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('share'),
            val: xdr.ScVal.scvU32(c.share),
          }),
        ])
      );

      // Prepare contract args: register_asset(asset_id: Symbol, owner: Address, contributors: Vec<ContributorShare>)
      const args = [
        nativeToScVal(assetId, { type: 'symbol' }),
        nativeToScVal(address, { type: 'address' }),
        xdr.ScVal.scvVec(scContributors),
      ];

      console.log("[SplitFlow] Invoking register_asset on contract ID:", managerId);

      // Build, simulate and assemble transaction with resource footprints
      const assembledTx = await buildAndSimulateTx(
        network,
        address,
        managerId,
        'register_asset',
        args
      );

      // Sign transaction via connected wallet (pass networkPassphrase so wallets sign for the correct chain)
      const passphrase = getNetworkPassphrase(network);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(assembledTx.toXDR(), {
        networkPassphrase: passphrase,
        address,
      });

      // Parse the signed transaction envelope XDR string back into a Transaction object
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, passphrase);

      // Submit to network
      const server = new rpc.Server(getRpcUrl(network));
      const submissionResponse = await server.sendTransaction(signedTx);
      
      if (submissionResponse.status === 'ERROR') {
        throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResult)}`);
      }

      const txHash = submissionResponse.hash;
      updateTxStatus(txId, 'PROCESSING', txHash);

      // Poll transaction status
      await pollTxStatus(network, txHash);
      updateTxStatus(txId, 'CONFIRMED', txHash);

      // Add to Activity Feed immediately (tagged as LOCAL so the store knows it
      // came from this session's transaction, not from the RPC poller).
      addActivity({
        id: `local-${txHash}`,
        type: 'REGISTRATION',
        assetId,
        title: 'Asset Registered',
        description: `Successfully registered asset "${assetId}" on-chain`,
        timestamp: Date.now(),
        hash: txHash,
        payer: address,
        source: 'LOCAL',
      });

      // Show the success modal — the user will navigate to Activity Feed from there.
      setSuccessAssetId(assetId);

      // Reset form (modal remains until user navigates away)
      setAssetId('');
      setContributors([{ address: address || '', share: 100 }]);
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

    const effectiveDistributorId = distributorId || '';
    if (!effectiveDistributorId || !effectiveDistributorId.startsWith('C') || effectiveDistributorId === managerId) {
      alert(
        '⚠️ Royalty Distributor is not configured.\n\n' +
        'The Distributor contract has not been deployed yet (it is different from the Manager).\n\n' +
        'Steps to fix:\n' +
        '1. Run: node scripts/deploy-distributor.js   (from the project root)\n' +
        '2. Copy the printed Distributor contract ID\n' +
        '3. Go to Settings → Contract Addresses → paste it under "Royalty Distributor Contract ID" → Save'
      );
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
      initializeKit();

      // args: distribute_royalty(payer: Address, asset_id: Symbol, amount: i128)
      const args = [
        nativeToScVal(address, { type: 'address' }),
        nativeToScVal(distAssetId, { type: 'symbol' }),
        nativeToScVal(stroopAmount, { type: 'i128' }),
      ];

      const assembledTx = await buildAndSimulateTx(
        network,
        address,
        distributorId,
        'distribute_royalty',
        args
      );

      const passphrase2 = getNetworkPassphrase(network);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(assembledTx.toXDR(), {
        networkPassphrase: passphrase2,
        address,
      });
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, passphrase2);
      const server = new rpc.Server(getRpcUrl(network));
      const submissionResponse = await server.sendTransaction(signedTx);
      
      if (submissionResponse.status === 'ERROR') {
        throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResult)}`);
      }

      const txHash = submissionResponse.hash;
      updateTxStatus(txId, 'PROCESSING', txHash);

      await pollTxStatus(network, txHash);
      updateTxStatus(txId, 'CONFIRMED', txHash);

      // Add to Activity Feed immediately (tagged as LOCAL)
      addActivity({
        id: `local-${txHash}`,
        type: 'DISTRIBUTION',
        assetId: distAssetId,
        title: 'Royalties Distributed',
        description: `Split ${distAmount} XLM for asset "${distAssetId}"`,
        timestamp: Date.now(),
        hash: txHash,
        amount: distAmount,
        payer: address,
        source: 'LOCAL',
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
      {/* Success modal — rendered via Portal so it clears all stacking contexts */}
      {successAssetId !== null && (
        <RegistrationSuccessModal
          assetId={successAssetId}
          onGoToFeed={() => {
            setSuccessAssetId(null);
            router.push('/activity');
          }}
        />
      )}
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
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Identifier</label>
                {validationStatus === 'VALID' && (
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                    ✓ Valid Asset ID
                  </span>
                )}
                {validationStatus === 'INVALID' && (
                  <span className="text-[10px] text-destructive-foreground bg-destructive/10 px-2 py-0.5 rounded font-bold">
                    {validationError}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. summer_song_2026, retro-beats"
                value={assetId}
                onChange={(e) => handleAssetIdChange(e.target.value)}
                className={`w-full bg-accent border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 text-foreground font-medium transition-all ${
                  validationStatus === 'INVALID'
                    ? 'border-destructive focus:ring-destructive'
                    : validationStatus === 'VALID'
                    ? 'border-green-500/50 focus:ring-green-500'
                    : 'border-border focus:ring-primary'
                }`}
              />
              <span className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                Use only letters (A-Z, a-z), numbers (0-9), hyphens (-), and underscores (_). Spaces and special characters are not allowed.
              </span>
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
                      step="any"
                      value={c.share || ''}
                      onChange={(e) => updateContributor(index, 'share', parseFloat(e.target.value) || 0)}
                      className="w-full bg-accent border border-border pl-3 pr-8 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground">%</span>
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
              disabled={validationStatus === 'INVALID' || !assetId}
              className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-200 orange-glow-btn ${
                validationStatus === 'INVALID' || !assetId
                  ? 'opacity-40 cursor-not-allowed bg-secondary/80 border border-border/50 shadow-none'
                  : 'bg-gradient-to-r from-primary to-orange-600 hover:opacity-95 cursor-pointer'
              }`}
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
