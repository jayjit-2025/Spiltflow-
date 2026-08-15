'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTxStore, Transaction } from '@/store/useTxStore';
import { FileText, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';

export default function TransactionsPage() {
  const { transactions } = useTxStore();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleExportCsv = () => {
    const dataToExport = transactions.length > 0 ? transactions : [
      { id: 'tx-sample-001', type: 'REGISTER', assetId: 'cyberpunk_ost_2026', amount: 'N/A', status: 'SUCCESS', timestamp: Date.now() },
      { id: 'tx-sample-002', type: 'DISTRIBUTE', assetId: 'cyberpunk_ost_2026', amount: '500.0 XLM', status: 'SUCCESS', timestamp: Date.now() - 3600000 },
    ];

    const formattedRows = dataToExport.map((tx) => ({
      'Transaction ID / Hash': tx.id,
      'Operation Type': tx.type,
      'Asset ID': tx.assetId,
      'Amount (XLM)': tx.amount || 'N/A',
      'Status': tx.status,
      'Timestamp (UTC)': new Date(tx.timestamp).toISOString(),
      'Stellar Explorer Link': `https://stellar.expert/explorer/testnet/tx/${tx.id}`,
    }));

    exportToCsv(`splitflow_royalty_transactions_audit_${new Date().toISOString().split('T')[0]}.csv`, formattedRows);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30';
      case 'FAILED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'SUBMITTED':
      case 'SIGNING':
      case 'SIMULATING':
      case 'BUILDING':
        return 'bg-amber-400/10 text-amber-400 border-amber-400/30 animate-pulse';
      default:
        return 'bg-[#171A1F] text-[#B8C0CC] border-[rgba(255,255,255,0.1)]';
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="architectural-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] mono-font text-[#F97316]">TRANSACTION_LEDGER_CONSOLE</div>
          <h1 className="text-xl md:text-2xl font-michroma text-[#F5F7FA]">TRANSACTION CENTER</h1>
          <p className="text-xs text-[#B8C0CC]">
            Lifecycle monitoring for Stellar transaction construction, simulation, wallet signatures, and ledger confirmations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] hover:text-[#F5F7FA] font-mono text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.15)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>EXPORT CSV AUDIT REPORT</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0D10] border border-[rgba(255,255,255,0.1)] mono-font text-xs">
            <Clock className="h-3.5 w-3.5 text-[#F97316]" />
            <span className="text-[#B8C0CC]">SESSION_TX_COUNT:</span>
            <span className="text-[#F5F7FA] font-bold">{transactions.length}</span>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table Container */}
      {transactions.length > 0 ? (
        <div className="space-y-4">
          <div className="architectural-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs mono-font border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#0C0D10] text-[#7D8794]">
                    <th className="p-4">TX ID / HASH</th>
                    <th className="p-4">OPERATION</th>
                    <th className="p-4">ASSET ID</th>
                    <th className="p-4">AMOUNT</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">TIMESTAMP</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {transactions.map((tx) => (
                    <React.Fragment key={tx.id}>
                      <tr 
                        onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                        className="hover:bg-[#171A1F]/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-[#F5F7FA] font-bold">
                          {tx.hash ? `[${tx.hash.slice(0, 8)}...]` : `[${tx.id.slice(0, 10)}]`}
                        </td>
                        <td className="p-4 text-[#B8C0CC]">{tx.type}</td>
                        <td className="p-4 text-[#F97316]">{tx.assetId}</td>
                        <td className="p-4 text-[#4ade80]">{tx.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 border text-[10px] ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#7D8794]">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-[#9ED8FF] hover:underline flex items-center gap-1 ml-auto">
                            <span>DETAILS</span>
                            {selectedTx?.id === tx.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Technical Detail Drawer */}
                      {selectedTx?.id === tx.id && (
                        <tr className="bg-[#050505] border-y border-[rgba(255,255,255,0.08)]">
                          <td colSpan={7} className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-[#7D8794]">
                              <span>[ TECHNICAL_TRANSACTION_PAYLOAD ]</span>
                              <span>ID: {tx.id}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[#7D8794]">FULL HASH: </span>
                                <span className="text-[#F5F7FA]">{tx.hash || 'NOT_CONFIRMED_YET'}</span>
                              </div>
                              <div>
                                <span className="text-[#7D8794]">ERROR DETAIL: </span>
                                <span className="text-red-400">{tx.error || 'NONE'}</span>
                              </div>
                            </div>
                            {tx.hash && (
                              <div className="pt-2">
                                <a
                                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#9ED8FF] hover:underline"
                                >
                                  <span>VIEW ON STELLAR EXPERT EXPLORER</span>
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Intentional Empty State */
        <div className="architectural-panel p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#171A1F] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mx-auto text-[#7D8794]">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-michroma text-xs text-[#F5F7FA] tracking-wider uppercase">
              NO TRANSACTIONS RECORDED IN SESSION
            </h3>
            <p className="text-xs text-[#B8C0CC]">
              Initiate on-chain registrations or distributions in the Console Dashboard to track full transaction lifecycles here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#050505] hover:bg-[#111] border border-[rgba(255,255,255,0.2)] hover:border-[#F97316] text-[#F5F7FA] hover:text-[#F97316] font-mono text-xs uppercase transition-all"
            >
              <span>■ OPEN CONSOLE DASHBOARD →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
