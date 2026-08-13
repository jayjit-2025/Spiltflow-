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
  ShieldCheck,
  Check,
  ExternalLink,
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
      <div
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md p-6 rounded-none bg-[#080808] border border-[rgba(255,255,255,0.15)] shadow-2xl architectural-panel text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
          <Check className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 id="reg-success-title" className="font-michroma text-sm text-[#F3F4F6] tracking-wider uppercase">
            REGISTRATION CONFIRMED
          </h3>
          <p className="text-xs text-[#9CA3AF] mono-font">
            Asset <span className="text-[#F3F4F6] font-bold">"{assetId}"</span> is live on Soroban ledger.
          </p>
        </div>

        <button
          onClick={onGoToFeed}
          className="w-full py-3 bg-[#080808] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F3F4F6] font-mono text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>VIEW IN EVENT FEED</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

// ─── Dashboard Console Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, address, kit, signTransaction } = useWalletStore();
  const { addTransaction, updateTransactionStatus } = useTxStore();
  const { addActivity } = useActivityStore();

  const [registeredAssetId, setRegisteredAssetId] = useState<string | null>(null);

  // Registration Form State
  const [assetId, setAssetId] = useState('');
  const [contributors, setContributors] = useState<{ address: string; share: number }[]>([
    { address: '', share: 100 },
  ]);
  const [registerError, setRegisterError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [validationStatus, setValidationStatus] = useState<'IDLE' | 'VALID' | 'INVALID'>('IDLE');

  // Distribution Form State
  const [distAssetId, setDistAssetId] = useState('');
  const [distAmount, setDistAmount] = useState('');

  // Search State
  const [searchAssetId, setSearchAssetId] = useState('');
  const [searchedAsset, setSearchedAsset] = useState<AssetDetails | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const validateAssetId = (val: string) => {
    if (!val) {
      return { isValid: false, error: 'Asset ID is required.' };
    }
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

  // Calculate Total Percentage Split
  const totalPercentage = contributors.reduce((acc, curr) => acc + (curr.share || 0), 0);

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

    let totalShares = 0;
    for (const c of contributors) {
      if (!c.address.trim()) {
        setRegisterError('All contributor addresses must be populated.');
        return;
      }
      totalShares += c.share;
    }

    if (Math.abs(totalShares - 100) > 0.01) {
      setRegisterError(`Total shares must equal exactly 100%. Current sum: ${totalShares}%`);
      return;
    }

    const txId = `reg-${Date.now()}`;
    addTransaction({
      id: txId,
      type: 'REGISTER',
      assetId,
      amount: 'N/A',
      status: 'BUILDING',
      timestamp: Date.now(),
    });

    try {
      const { managerContractId } = getContractSettings();
      const targetManagerId = managerContractId || FALLBACK_MANAGER_ID;

      const scValContributors = contributors.map((c) => {
        const bpsShare = Math.round(c.share * 100);
        return xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('address'),
            val: nativeToScVal(c.address, { type: 'address' }),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol('share'),
            val: nativeToScVal(bpsShare, { type: 'u32' }),
          }),
        ]);
      });

      const params = [
        nativeToScVal(assetId, { type: 'symbol' }),
        nativeToScVal(address, { type: 'address' }),
        xdr.ScVal.scvVec(scValContributors),
      ];

      updateTransactionStatus(txId, 'SIMULATING');
      const preparedTx = await buildAndSimulateTx(
        address,
        targetManagerId,
        'register_asset',
        params
      );

      updateTransactionStatus(txId, 'SIGNING');
      const networkPassphrase = getNetworkPassphrase();
      const xdrString = preparedTx.toXDR();

      const signedResult = await signTransaction(xdrString, {
        networkPassphrase,
      });

      let signedTxXdr: string;
      if (typeof signedResult === 'string') {
        signedTxXdr = signedResult;
      } else if (signedResult && (signedResult as any).signedTxXdr) {
        signedTxXdr = (signedResult as any).signedTxXdr;
      } else {
        throw new Error('Wallet did not return a valid signed XDR.');
      }

      updateTransactionStatus(txId, 'SUBMITTED');
      const rpcServer = new rpc.Server(getRpcUrl(), { allowHttp: true });
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      const sendResp = await rpcServer.sendTransaction(txToSubmit);

      if (sendResp.status === 'ERROR' || !sendResp.hash) {
        throw new Error('Transaction submission failed to Stellar RPC node.');
      }

      const txHash = sendResp.hash;
      const statusResult = await pollTxStatus(txHash);

      if (statusResult.status === 'SUCCESS') {
        updateTransactionStatus(txId, 'SUCCESS', txHash);
        addActivity({
          id: `act-${Date.now()}`,
          type: 'REGISTRATION',
          assetId,
          amount: 'N/A',
          timestamp: Date.now(),
          txHash,
          status: 'SUCCESS',
        });
        setRegisteredAssetId(assetId);
      } else {
        throw new Error(statusResult.error || 'Transaction simulation or ledger execution failed.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errMsg = typeof err === 'string' ? err : err?.message || err?.error || (typeof err === 'object' && Object.keys(err).length > 0 ? JSON.stringify(err) : 'Transaction or wallet signing failed.');
      setRegisterError(errMsg);
      updateTransactionStatus(txId, 'FAILED', undefined, errMsg);
    }
  };

  // 2. Submit Distribution Transaction
  const handleDistributeRoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;

    const txId = `dist-${Date.now()}`;
    addTransaction({
      id: txId,
      type: 'DISTRIBUTE',
      assetId: distAssetId,
      amount: distAmount,
      status: 'BUILDING',
      timestamp: Date.now(),
    });

    try {
      const { distributorContractId } = getContractSettings();
      const targetDistributorId = distributorContractId || FALLBACK_DISTRIBUTOR_ID;
      const stroopsAmount = BigInt(Math.round(parseFloat(distAmount) * 10_000_000));

      const params = [
        nativeToScVal(address, { type: 'address' }),
        nativeToScVal(distAssetId, { type: 'symbol' }),
        nativeToScVal(stroopsAmount, { type: 'i128' }),
      ];

      updateTransactionStatus(txId, 'SIMULATING');
      const preparedTx = await buildAndSimulateTx(
        address,
        targetDistributorId,
        'distribute_royalty',
        params
      );

      updateTransactionStatus(txId, 'SIGNING');
      const networkPassphrase = getNetworkPassphrase();
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase,
      });

      let signedTxXdr: string;
      if (typeof signedResult === 'string') {
        signedTxXdr = signedResult;
      } else if (signedResult && (signedResult as any).signedTxXdr) {
        signedTxXdr = (signedResult as any).signedTxXdr;
      } else {
        throw new Error('Wallet did not return a valid signed XDR.');
      }

      updateTransactionStatus(txId, 'SUBMITTED');
      const rpcServer = new rpc.Server(getRpcUrl(), { allowHttp: true });
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      const sendResp = await rpcServer.sendTransaction(txToSubmit);

      if (sendResp.status === 'ERROR' || !sendResp.hash) {
        throw new Error('Transaction submission failed to Stellar RPC node.');
      }

      const txHash = sendResp.hash;
      const statusResult = await pollTxStatus(txHash);

      if (statusResult.status === 'SUCCESS') {
        updateTransactionStatus(txId, 'SUCCESS', txHash);
        addActivity({
          id: `act-${Date.now()}`,
          type: 'DISTRIBUTION',
          assetId: distAssetId,
          amount: `${distAmount} XLM`,
          timestamp: Date.now(),
          txHash,
          status: 'SUCCESS',
        });
        setDistAssetId('');
        setDistAmount('');
      } else {
        throw new Error(statusResult.error || 'Royalty distribution failed on ledger.');
      }
    } catch (err: any) {
      console.error('Distribution failed:', err);
      updateTransactionStatus(txId, 'FAILED', undefined, err?.message || 'Transaction failed.');
    }
  };

  // 3. Search Asset
  const handleSearchAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAssetId.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchedAsset(null);

    try {
      const details = await fetchAssetDetails(searchAssetId);
      if (!details) {
        setSearchError('Asset not registered on Soroban contract.');
      } else {
        setSearchedAsset(details);
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Error querying asset from Stellar RPC.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Registration Success Modal */}
      {registeredAssetId && (
        <RegistrationSuccessModal
          assetId={registeredAssetId}
          onGoToFeed={() => {
            setRegisteredAssetId(null);
            router.push('/activity');
          }}
        />
      )}

      {/* Editorial Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#F97316]">SOROBAN_PROTOCOL_CONSOLE</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F3F4F6]">CONSOLE DASHBOARD</h1>
          <p className="text-xs text-[#9CA3AF]">
            Manage digital asset registrations and execute automated royalty distributions.
          </p>
        </div>

        {isConnected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#050505] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
            <span className="text-[#9CA3AF]">CONNECTED:</span>
            <span className="text-[#F3F4F6] font-bold">[{address.slice(0, 6)}...{address.slice(-4)}]</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/20 border border-amber-800/30 text-amber-400 mono-font text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>AUTHENTICATION_REQUIRED</span>
          </div>
        )}
      </div>

      {/* Architectural Console Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: Register Digital Asset */}
        <div className="architectural-panel p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-[#F97316]" />
              <h2 className="font-michroma text-xs text-[#F3F4F6] uppercase tracking-wider">
                REGISTER DIGITAL ASSET
              </h2>
            </div>
            <span className="text-[10px] mono-font text-[#9CA3AF]">BPS_ALLOCATION</span>
          </div>

          <form onSubmit={handleRegisterAsset} className="flex flex-col gap-5">
            {/* Asset ID Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs mono-font text-[#9CA3AF]">ASSET ID</label>
                {validationStatus === 'VALID' && (
                  <span className="text-[10px] text-[#22C55E] mono-font font-bold">✓ VALID_ID</span>
                )}
                {validationStatus === 'INVALID' && (
                  <span className="text-[10px] text-red-400 mono-font font-bold">{validationError}</span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. album_split_001, retro_beats"
                value={assetId}
                onChange={(e) => handleAssetIdChange(e.target.value)}
                className="w-full bg-[#050505] border border-[rgba(255,255,255,0.12)] px-3 py-2.5 rounded-none text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-[#F97316]"
              />
            </div>

            {/* Contributor Allocation Section */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-2">
                <label className="text-xs mono-font text-[#9CA3AF]">CONTRIBUTOR ALLOCATION</label>
                <button
                  type="button"
                  onClick={addContributorField}
                  className="text-xs text-[#F97316] mono-font hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ ADD PAYEE</span>
                </button>
              </div>

              {/* Basis Points Allocation Visualizer */}
              <div className="p-3 bg-[#050505] border border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="flex justify-between text-xs mono-font">
                  <span className="text-[#9CA3AF]">TOTAL ALLOCATION:</span>
                  <span className={Math.abs(totalPercentage - 100) < 0.01 ? 'text-[#22C55E] font-bold' : 'text-amber-400 font-bold'}>
                    {totalPercentage.toFixed(2)}% ({Math.round(totalPercentage * 100)} BPS)
                  </span>
                </div>
                <div className="w-full h-1 bg-[#111] overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      Math.abs(totalPercentage - 100) < 0.01 ? 'bg-[#22C55E]' : 'bg-amber-500'
                    }`} 
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }} 
                  />
                </div>
                {Math.abs(totalPercentage - 100) < 0.01 && (
                  <div className="text-[10px] text-[#22C55E] mono-font font-bold flex items-center gap-1 mt-1">
                    <Check className="h-3 w-3" />
                    <span>✓ VALID SPLIT — 10,000 BPS (100.00%)</span>
                  </div>
                )}
              </div>

              {contributors.map((c, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Stellar Wallet Address (G...)"
                    value={c.address}
                    onChange={(e) => updateContributor(index, 'address', e.target.value)}
                    className="flex-1 bg-[#050505] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-[#F97316]"
                  />
                  <div className="relative w-28 shrink-0">
                    <input
                      type="number"
                      placeholder="Share"
                      step="any"
                      value={c.share || ''}
                      onChange={(e) => updateContributor(index, 'share', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#050505] border border-[rgba(255,255,255,0.12)] pl-3 pr-7 py-2 text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-[#F97316]"
                    />
                    <span className="absolute right-3 top-2 text-[10px] mono-font text-[#9CA3AF]">%</span>
                  </div>
                  {contributors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContributorField(index)}
                      className="p-2 text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {registerError && (
              <div className="p-3 bg-red-950/30 border border-red-800/40 text-red-300 text-xs mono-font flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{registerError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={validationStatus === 'INVALID' || !assetId || Math.abs(totalPercentage - 100) > 0.01}
              className={`w-full py-3 bg-[#080808] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F3F4F6] hover:text-[#F97316] font-mono text-xs tracking-widest uppercase transition-all cursor-pointer ${
                validationStatus === 'INVALID' || !assetId || Math.abs(totalPercentage - 100) > 0.01
                  ? 'opacity-40 cursor-not-allowed border-[rgba(255,255,255,0.06)] text-[#9CA3AF]'
                  : ''
              }`}
            >
              [ REGISTER ON-CHAIN → ]
            </button>
          </form>
        </div>

        {/* Module 2 & 3: Distribute & Query */}
        <div className="flex flex-col gap-8">
          {/* Module 2: Distribute Royalties */}
          <div className="architectural-panel p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-[#22C55E]" />
                <h2 className="font-michroma text-xs text-[#F3F4F6] uppercase tracking-wider">
                  DISTRIBUTE ROYALTIES
                </h2>
              </div>
              <span className="text-[10px] mono-font text-[#22C55E]">ATOMIC_SPLIT</span>
            </div>

            <form onSubmit={handleDistributeRoyalty} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs mono-font text-[#9CA3AF]">ASSET ID</label>
                  <input
                    type="text"
                    placeholder="e.g. album_split_001"
                    value={distAssetId}
                    onChange={(e) => setDistAssetId(e.target.value)}
                    className="w-full bg-[#050505] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs mono-font text-[#9CA3AF]">AMOUNT (XLM)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 100.5"
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    className="w-full bg-[#050505] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#080808] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#22C55E] text-[#F3F4F6] hover:text-[#22C55E] font-mono text-xs tracking-widest uppercase transition-all cursor-pointer"
              >
                [ EXECUTE DISTRIBUTION → ]
              </button>
            </form>
          </div>

          {/* Module 3: Query Registry */}
          <div className="architectural-panel p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-blue-400" />
                <h2 className="font-michroma text-xs text-[#F3F4F6] uppercase tracking-wider">
                  QUERY ON-CHAIN REGISTRY
                </h2>
              </div>
              <span className="text-[10px] mono-font text-blue-400">TELEMETRY</span>
            </div>

            <form onSubmit={handleSearchAsset} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Asset ID..."
                value={searchAssetId}
                onChange={(e) => setSearchAssetId(e.target.value)}
                className="flex-1 bg-[#050505] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2 bg-[#080808] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] font-mono text-xs cursor-pointer hover:border-[#F3F4F6] transition-colors"
              >
                {isSearching ? 'QUERYING...' : 'SEARCH'}
              </button>
            </form>

            {searchError && (
              <div className="p-3 bg-red-950/30 border border-red-800/40 text-red-300 text-xs mono-font">
                {searchError}
              </div>
            )}

            {searchedAsset && (
              <div className="p-4 bg-[#050505] border border-[rgba(255,255,255,0.08)] space-y-3 mono-font">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                  <span className="text-xs font-bold text-[#F3F4F6]">ASSET: {searchAssetId}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${searchedAsset.isActive ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30' : 'bg-red-500/10 text-red-400'}`}>
                    {searchedAsset.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="text-xs text-[#9CA3AF]">
                  <span className="text-[#F3F4F6]">OWNER:</span> {searchedAsset.owner}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">CONTRIBUTOR SPLITS</span>
                  {searchedAsset.contributors.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-[#080808] p-2 border border-[rgba(255,255,255,0.06)]">
                      <span className="text-[#9CA3AF]">{c.address.slice(0, 10)}...{c.address.slice(-6)}</span>
                      <span className="font-bold text-[#F3F4F6]">{(c.share / 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
