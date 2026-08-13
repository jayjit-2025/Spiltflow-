import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';

type NetworkType = 'TESTNET' | 'PUBLIC' | 'STANDALONE';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  activeWallet: string | null;
  network: NetworkType;
  isConnecting: boolean;
  error: string | null;
  kit: typeof StellarWalletsKit;

  setNetwork: (network: NetworkType) => void;
  initializeKit: () => void;
  connect: (walletId: string) => Promise<void>;
  disconnect: () => void;
  setError: (error: string | null) => void;
  signTransaction: (xdr: string, opts?: any) => Promise<any>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      isConnected: false,
      activeWallet: null,
      network: 'TESTNET' as NetworkType,
      isConnecting: false,
      error: null,
      kit: StellarWalletsKit,

      initializeKit: () => {
        const net = get().network;
        const wn = net === 'PUBLIC' ? Networks.PUBLIC : net === 'STANDALONE' ? Networks.STANDALONE : Networks.TESTNET;
        
        if (typeof window !== 'undefined') {
          StellarWalletsKit.init({
            network: wn,
            modules: [
              new FreighterModule(),
              new AlbedoModule(),
              new xBullModule(),
            ]
          });
        }
      },

      setNetwork: (network) => {
        set({ network });
        const wn = network === 'PUBLIC' ? Networks.PUBLIC : network === 'STANDALONE' ? Networks.STANDALONE : Networks.TESTNET;
        if (typeof window !== 'undefined') {
          StellarWalletsKit.setNetwork(wn);
        }
      },

      connect: async (walletId) => {
        set({ isConnecting: true, error: null });
        try {
          get().initializeKit();
          StellarWalletsKit.setWallet(walletId);
          const { address } = await StellarWalletsKit.fetchAddress();
          
          set({
            address,
            isConnected: true,
            activeWallet: walletId,
            isConnecting: false,
          });
        } catch (err: any) {
          console.error("Wallet connection error:", err);
          set({
            error: err?.message || (typeof err === 'string' ? err : "Failed to connect wallet"),
            isConnecting: false,
            isConnected: false,
            address: null,
            activeWallet: null,
          });
        }
      },

      disconnect: () => {
        if (typeof window !== 'undefined') {
          StellarWalletsKit.disconnect().catch(console.error);
        }
        set({
          address: null,
          isConnected: false,
          activeWallet: null,
          error: null,
        });
      },

      signTransaction: async (xdr: string, opts?: any) => {
        get().initializeKit();
        const walletId = get().activeWallet || FREIGHTER_ID;
        StellarWalletsKit.setWallet(walletId);
        return StellarWalletsKit.signTransaction(xdr, opts);
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'splitflow-wallet-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        address: state.address,
        isConnected: state.isConnected,
        activeWallet: state.activeWallet,
        network: state.network,
      }),
    }
  )
);
