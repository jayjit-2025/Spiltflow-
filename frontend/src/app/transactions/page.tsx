'use client';

import React from 'react';
import { useTxStore, TxItem } from '@/store/useTxStore';
import { useWalletStore } from '@/store/useWalletStore';
import { useActivityStore } from '@/store/useActivityStore';
import {
  buildAndSimulateTx,
  pollTxStatus,
  XLM_SAC_ID,
} from '@/services/stellar';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { nativeToScVal, rpc } from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

export default function TransactionCenterPage() {
  const { transactions, updateTxStatus, incrementRetry, clearHistory } = useTxStore();
  const { network, address, initializeKit } = useWalletStore();
  const { addActivity } = useActivityStore();

  const getStatusIcon = (status: TxItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'PROCESSING':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 4. Retry Transaction Handler (rebuilds & re-executes)
  const handleRetry = async (tx: TxItem) => {
    if (!address) {
      alert('Wallet address missing. Connect wallet first.');
      return;
    }

    const txId = tx.id;
    incrementRetry(txId);
    updateTxStatus(txId, 'PROCESSING', null, null);

    try {
      initializeKit();

      if (tx.txType === 'REGISTER_ASSET') {
        const { assetId, contributors, managerId } = tx.txArgs;

        // Re-construct scContributors ScVal
        const scContributors = contributors.map((c: any) => ({
          address: nativeToScVal(c.address, { type: 'address' }),
          share: nativeToScVal(c.share, { type: 'u32' }),
        }));

        const args = [
          nativeToScVal(assetId, { type: 'symbol' }),
          nativeToScVal(address, { type: 'address' }),
          nativeToScVal(scContributors),
        ];

        // Re-build and simulate
        const assembledTx = await buildAndSimulateTx(
          network,
          address,
          managerId,
          'register_asset',
          args
        );

        // Sign & Submit
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(assembledTx.toXDR());
        const server = new rpc.Server(network === 'PUBLIC' ? 'https://soroban-mainnet.stellar.org' : network === 'TESTNET' ? 'https://soroban-testnet.stellar.org' : 'http://localhost:8000');
        const submissionResponse = await server.sendTransaction(assembledTx.toEnvelope().toXDR());
        
        if (submissionResponse.status === 'ERROR') {
          throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResult)}`);
        }

        const txHash = submissionResponse.hash;
        updateTxStatus(txId, 'PROCESSING', txHash);

        await pollTxStatus(network, txHash);
        updateTxStatus(txId, 'CONFIRMED', txHash);

        addActivity({
          type: 'REGISTRATION',
          assetId,
          title: 'Asset Registered (Retry)',
          description: `Asset "${assetId}" registered successfully after retry`,
          hash: txHash,
          payer: address,
        });
      } else if (tx.txType === 'DISTRIBUTE_ROYALTY') {
        const { assetId, amount, distributorId } = tx.txArgs;
        const amountNum = parseFloat(amount);
        const stroopAmount = BigInt(Math.floor(amountNum * 10000000));

        const args = [
          nativeToScVal(address, { type: 'address' }),
          nativeToScVal(assetId, { type: 'symbol' }),
          nativeToScVal(stroopAmount, { type: 'i128' }),
        ];

        const assembledTx = await buildAndSimulateTx(
          network,
          address,
          distributorId,
          'distribute_royalty',
          args
        );

        const { signedTxXdr } = await StellarWalletsKit.signTransaction(assembledTx.toXDR());
        const server = new rpc.Server(network === 'PUBLIC' ? 'https://soroban-mainnet.stellar.org' : network === 'TESTNET' ? 'https://soroban-testnet.stellar.org' : 'http://localhost:8000');
        const submissionResponse = await server.sendTransaction(assembledTx.toEnvelope().toXDR());
        
        if (submissionResponse.status === 'ERROR') {
          throw new Error(`Submission failed: ${JSON.stringify(submissionResponse.errorResult)}`);
        }

        const txHash = submissionResponse.hash;
        updateTxStatus(txId, 'PROCESSING', txHash);

        await pollTxStatus(network, txHash);
        updateTxStatus(txId, 'CONFIRMED', txHash);

        addActivity({
          type: 'DISTRIBUTION',
          assetId,
          title: 'Royalties Distributed (Retry)',
          description: `Split ${amount} XLM for asset "${assetId}" successfully after retry`,
          hash: txHash,
          amount,
          payer: address,
        });
      }
    } catch (err: any) {
      console.error('Retry error:', err);
      updateTxStatus(txId, 'FAILED', null, err.message || 'Transaction failed');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />
            <span>Transaction Center</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track, audit, and retry your on-chain operations through their lifecycle.
          </p>
        </div>

        <button
          onClick={clearHistory}
          className="px-4 py-2.5 bg-secondary border border-border hover:bg-secondary/80 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Clear History
        </button>
      </div>

      {/* Transaction Queue */}
      <div className="max-w-4xl w-full mx-auto p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Transaction Activity Log
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <History className="h-10 w-10 text-muted-foreground" />
            <h4 className="font-bold text-foreground text-sm font-sans">No Transaction Records</h4>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Your transaction history is currently empty. Submit a transaction from the dashboard to track it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-3 p-5 rounded-xl bg-accent/40 border border-border hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                      {getStatusIcon(tx.status)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{tx.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{tx.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                    {formatTimestamp(tx.timestamp)}
                  </span>
                </div>

                {/* Info Panel */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    {tx.hash && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-bold font-mono">
                          Hash: {tx.hash.slice(0, 14)}...{tx.hash.slice(-6)}
                        </span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          <span>Explorer</span>
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    {tx.retryCount > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                        Retries: {tx.retryCount}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {tx.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(tx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:opacity-95 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Operation</span>
                    </button>
                  )}
                </div>

                {/* Error Log */}
                {tx.status === 'FAILED' && tx.error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs font-mono flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="break-all">{tx.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
