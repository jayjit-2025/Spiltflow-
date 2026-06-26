/**
 * Test Suite 1: useWalletStore — wallet connection state management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the external wallet kit so enum imports work in jsdom
vi.mock('@creit.tech/stellar-wallets-kit', () => {
  return {
    StellarWalletsKit: class {
      openModal = vi.fn();
      closeModal = vi.fn();
      getAddress = vi.fn().mockResolvedValue({ address: 'GMOCK...' });
      signTx = vi.fn();
    },
    WalletNetwork: {
      TESTNET: 'TESTNET',
      PUBLIC: 'PUBLIC',
      STANDALONE: 'STANDALONE',
    },
    WalletId: {},
    FREIGHTER_ID: 'FREIGHTER',
    ALBEDO_ID: 'ALBEDO',
    RABET_ID: 'RABET',
    XBULL_ID: 'XBULL',
    HANA_ID: 'HANA',
  };
});

import { useWalletStore } from '@/store/useWalletStore';

// We need to clear the Zustand store state between tests
const initialState = useWalletStore.getState();

describe('useWalletStore', () => {
  beforeEach(() => {
    // Reset state between tests
    useWalletStore.setState(initialState);
  });

  it('should start in a disconnected state', () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.activeWallet).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should disconnect and clear address and wallet', () => {
    // First, set a "connected" state manually
    useWalletStore.setState({
      address: 'GABC123XYZ456',
      isConnected: true,
      activeWallet: 'FREIGHTER' as any,
      error: null,
    });

    const { result } = renderHook(() => useWalletStore());
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('GABC123XYZ456');

    // Disconnect
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.activeWallet).toBeNull();
  });

  it('should set an error state', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setError('User rejected the connection request.');
    });

    expect(result.current.error).toBe('User rejected the connection request.');
  });

  it('should clear error after setting it', () => {
    const { result } = renderHook(() => useWalletStore());

    act(() => {
      result.current.setError('Some error');
    });
    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.setError(null);
    });
    expect(result.current.error).toBeNull();
  });

  it('should switch network via setNetwork', () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.network).toBe('TESTNET');

    act(() => {
      result.current.setNetwork('PUBLIC' as any);
    });

    expect(result.current.network).toBe('PUBLIC');
  });
});
