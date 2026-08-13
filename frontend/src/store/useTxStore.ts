import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TxItem {
  id: string;
  hash: string | null;
  title: string;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'BUILDING' | 'SIMULATING' | 'SIGNING' | 'SUBMITTED' | 'SUCCESS';
  timestamp: number;
  error: string | null;
  retryCount: number;
  txType: 'REGISTER_ASSET' | 'DISTRIBUTE_ROYALTY' | 'UPDATE_ASSET' | 'DEACTIVATE_ASSET' | 'REGISTER' | 'DISTRIBUTE';
  txArgs: any;
  // Legacy / UI friendly aliases
  type?: string;
  assetId?: string;
  amount?: string;
}

export type Transaction = TxItem;

interface TxState {
  transactions: TxItem[];
  addTx: (tx: Omit<TxItem, 'id' | 'status' | 'timestamp' | 'error' | 'retryCount' | 'hash'>) => string;
  addTransaction: (tx: { id?: string; type: string; assetId: string; amount: string; status: any; timestamp: number }) => string;
  updateTxStatus: (id: string, status: TxItem['status'], hash?: string | null, error?: string | null) => void;
  updateTransactionStatus: (id: string, status: TxItem['status'], hash?: string | null, error?: string | null) => void;
  incrementRetry: (id: string) => void;
  clearHistory: () => void;
}

export const useTxStore = create<TxState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTx: (tx) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newTx: TxItem = {
          ...tx,
          id,
          hash: null,
          status: 'PENDING',
          timestamp: Date.now(),
          error: null,
          retryCount: 0,
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 50),
        }));
        return id;
      },

      addTransaction: (tx) => {
        const id = tx.id || `tx-${Date.now()}`;
        const newTx: TxItem = {
          id,
          hash: null,
          title: `${tx.type}: ${tx.assetId}`,
          description: `Transaction for asset ${tx.assetId}`,
          status: tx.status || 'PENDING',
          timestamp: tx.timestamp || Date.now(),
          error: null,
          retryCount: 0,
          txType: tx.type as any,
          txArgs: { assetId: tx.assetId, amount: tx.amount },
          type: tx.type,
          assetId: tx.assetId,
          amount: tx.amount,
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 50),
        }));
        return id;
      },

      updateTxStatus: (id, status, hash = null, error = null) => {
        set((state) => {
          const updatedTxs = state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  status,
                  ...(hash !== undefined ? { hash } : {}),
                  ...(error !== undefined ? { error } : {}),
                }
              : tx
          );

          const targetTx = updatedTxs.find((tx) => tx.id === id);
          if (typeof window !== 'undefined' && targetTx && hash && (status === 'CONFIRMED' || status === 'SUCCESS' || status === 'FAILED')) {
            const apiUrl = `${window.location.origin}/api/transactions`;
            fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                txHash: hash,
                assetId: targetTx.assetId || targetTx.txArgs?.assetId || 'splitflow_asset',
                type: targetTx.txType?.includes('REGISTER') || targetTx.type === 'REGISTER' ? 'REGISTRATION' : 'DISTRIBUTION',
                payerAddress: targetTx.txArgs?.senderAddress || 'G_STELLAR_ADDRESS',
                amountXlm: targetTx.amount || targetTx.txArgs?.amount || '0',
                status,
                timestamp: targetTx.timestamp,
              }),
            }).catch((err) => console.warn('Supabase transaction sync warning:', err));
          }

          return { transactions: updatedTxs };
        });
      },

      updateTransactionStatus: (id, status, hash = null, error = null) => {
        get().updateTxStatus(id, status, hash, error);
      },

      incrementRetry: (id) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, retryCount: tx.retryCount + 1 } : tx
          ),
        }));
      },

      clearHistory: () => {
        set((state) => ({
          transactions: state.transactions.filter(
            (tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING' || tx.status === 'BUILDING' || tx.status === 'SIMULATING' || tx.status === 'SIGNING'
          ),
        }));
      },
    }),
    {
      name: 'splitflow-tx-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
