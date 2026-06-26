import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TxItem {
  id: string;
  hash: string | null;
  title: string;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';
  timestamp: number;
  error: string | null;
  retryCount: number;
  txType: 'REGISTER_ASSET' | 'DISTRIBUTE_ROYALTY' | 'UPDATE_ASSET' | 'DEACTIVATE_ASSET';
  txArgs: any;
}

interface TxState {
  transactions: TxItem[];
  addTx: (tx: Omit<TxItem, 'id' | 'status' | 'timestamp' | 'error' | 'retryCount' | 'hash'>) => string;
  updateTxStatus: (id: string, status: TxItem['status'], hash?: string | null, error?: string | null) => void;
  incrementRetry: (id: string) => void;
  clearHistory: () => void;
}

export const useTxStore = create<TxState>()(
  persist(
    (set) => ({
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
          transactions: [newTx, ...state.transactions].slice(0, 50), // Limit history to 50 items
        }));
        return id;
      },

      updateTxStatus: (id, status, hash = null, error = null) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  status,
                  ...(hash !== undefined ? { hash } : {}),
                  ...(error !== undefined ? { error } : {}),
                }
              : tx
          ),
        }));
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
            (tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING'
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
