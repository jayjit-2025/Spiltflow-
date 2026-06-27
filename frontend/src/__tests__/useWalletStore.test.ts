/**
 * Test Suite 1: useWalletStore — wallet connection state management
 * Uses direct Zustand store access (no React rendering needed)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the external wallet kit so imports work in jsdom
vi.mock('@creit.tech/stellar-wallets-kit', () => {
  return {
    StellarWalletsKit: {
      init: vi.fn(),
      setWallet: vi.fn(),
      setNetwork: vi.fn(),
      getAddress: vi.fn().mockResolvedValue({ address: 'GMOCK...' }),
      fetchAddress: vi.fn().mockResolvedValue({ address: 'GMOCK...' }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    },
    Networks: {
      TESTNET: 'TESTNET',
      PUBLIC: 'PUBLIC',
      STANDALONE: 'STANDALONE',
    },
  };
});

// Mock modules so subpath imports don't fail
vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({
  FreighterModule: class {},
  FREIGHTER_ID: 'FREIGHTER',
}));
vi.mock('@creit.tech/stellar-wallets-kit/modules/albedo', () => ({
  AlbedoModule: class {},
  ALBEDO_ID: 'ALBEDO',
}));
vi.mock('@creit.tech/stellar-wallets-kit/modules/xbull', () => ({
  xBullModule: class {},
  XBULL_ID: 'XBULL',
}));

import { useWalletStore } from '@/store/useWalletStore';

const initialState = useWalletStore.getState();

describe('useWalletStore', () => {
  beforeEach(() => {
    useWalletStore.setState(initialState);
  });

  it('should start in a disconnected state', () => {
    const state = useWalletStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.address).toBeNull();
    expect(state.activeWallet).toBeNull();
    expect(state.isConnecting).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should disconnect and clear address and wallet', () => {
    // Set a "connected" state manually
    useWalletStore.setState({
      address: 'GABC123XYZ456',
      isConnected: true,
      activeWallet: 'FREIGHTER',
      error: null,
    });

    expect(useWalletStore.getState().isConnected).toBe(true);
    expect(useWalletStore.getState().address).toBe('GABC123XYZ456');

    // Disconnect
    useWalletStore.getState().disconnect();

    expect(useWalletStore.getState().isConnected).toBe(false);
    expect(useWalletStore.getState().address).toBeNull();
    expect(useWalletStore.getState().activeWallet).toBeNull();
  });

  it('should set an error state', () => {
    useWalletStore.getState().setError('User rejected the connection request.');
    expect(useWalletStore.getState().error).toBe('User rejected the connection request.');
  });

  it('should clear error after setting it', () => {
    useWalletStore.getState().setError('Some error');
    expect(useWalletStore.getState().error).toBe('Some error');

    useWalletStore.getState().setError(null);
    expect(useWalletStore.getState().error).toBeNull();
  });

  it('should switch network via setNetwork', () => {
    expect(useWalletStore.getState().network).toBe('TESTNET');

    useWalletStore.getState().setNetwork('PUBLIC' as any);
    expect(useWalletStore.getState().network).toBe('PUBLIC');
  });
});
