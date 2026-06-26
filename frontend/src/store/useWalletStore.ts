import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StellarWalletsKit, WalletNetwork, WalletId } from '@creit.tech/stellar-wallets-kit';

type NetworkType = 'TESTNET' | 'PUBLIC' | 'STANDALONE';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  activeWallet: WalletId | null;
  network: NetworkType;
  isConnecting: boolean;
  error: string | null;
  walletKit: StellarWalletsKit | null;

  setNetwork: (network: NetworkType) => void;
  initializeKit: () => StellarWalletsKit;
  connect: (walletId: WalletId) => Promise<void>;
  disconnect: () => void;
  setError: (error: string | null) => void;
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
      walletKit: null,

      initializeKit: () => {
        let kit = get().walletKit;
        if (!kit) {
          const net = get().network;
          const wn = net === 'PUBLIC' ? WalletNetwork.PUBLIC : net === 'STANDALONE' ? WalletNetwork.STANDALONE : WalletNetwork.TESTNET;
          kit = new StellarWalletsKit({
            network: wn,
            allowMultipleWallets: true,
          });
          set({ walletKit: kit });
        }
        return kit;
      },

      setNetwork: (network) => {
        set({ network });
        // Re-initialize kit when network changes
        const wn = network === 'PUBLIC' ? WalletNetwork.PUBLIC : network === 'STANDALONE' ? WalletNetwork.STANDALONE : WalletNetwork.TESTNET;
        const kit = new StellarWalletsKit({
          network: wn,
          allowMultipleWallets: true,
        });
        set({ walletKit: kit });
      },

      connect: async (walletId) => {
        set({ isConnecting: true, error: null });
        try {
          const kit = get().initializeKit();
          await kit.setWallet(walletId);
          const { address } = await kit.getAddress();
          
          set({
            address,
            isConnected: true,
            activeWallet: walletId,
            isConnecting: false,
          });
        } catch (err: any) {
          console.error("Wallet connection error:", err);
          set({
            error: err.message || "Failed to connect wallet",
            isConnecting: false,
            isConnected: false,
            address: null,
            activeWallet: null,
          });
        }
      },

      disconnect: () => {
        set({
          address: null,
          isConnected: false,
          activeWallet: null,
          error: null,
        });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'splitflow-wallet-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist serializable fields
      partialize: (state) => ({
        address: state.address,
        isConnected: state.isConnected,
        activeWallet: state.activeWallet,
        network: state.network,
      }),
    }
  )
);
