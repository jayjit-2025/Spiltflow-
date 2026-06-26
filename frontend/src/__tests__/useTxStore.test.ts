/**
 * Test Suite 2: useTxStore — transaction lifecycle management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTxStore } from '@/store/useTxStore';

const initialState = useTxStore.getState();

describe('useTxStore', () => {
  beforeEach(() => {
    useTxStore.setState({ ...initialState, transactions: [] });
  });

  it('should start with empty transactions', () => {
    const { result } = renderHook(() => useTxStore());
    expect(result.current.transactions).toHaveLength(0);
  });

  it('should add a transaction with PENDING status', () => {
    const { result } = renderHook(() => useTxStore());

    let txId: string = '';
    act(() => {
      txId = result.current.addTx({
        title: 'Test Register',
        description: 'Registering test asset',
        txType: 'REGISTER_ASSET',
        txArgs: { assetId: 'test_asset_1' },
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    const tx = result.current.transactions[0];
    expect(tx.id).toBe(txId);
    expect(tx.status).toBe('PENDING');
    expect(tx.hash).toBeNull();
    expect(tx.error).toBeNull();
    expect(tx.retryCount).toBe(0);
    expect(tx.title).toBe('Test Register');
  });

  it('should transition status from PENDING to PROCESSING to CONFIRMED', () => {
    const { result } = renderHook(() => useTxStore());
    let txId: string = '';

    act(() => {
      txId = result.current.addTx({
        title: 'Distribute',
        description: 'Distributing royalties',
        txType: 'DISTRIBUTE_ROYALTY',
        txArgs: { assetId: 'my_song', amount: '10' },
      });
    });

    expect(result.current.transactions[0].status).toBe('PENDING');

    act(() => {
      result.current.updateTxStatus(txId, 'PROCESSING');
    });
    expect(result.current.transactions[0].status).toBe('PROCESSING');

    act(() => {
      result.current.updateTxStatus(txId, 'CONFIRMED', 'abc123hashxyz');
    });
    expect(result.current.transactions[0].status).toBe('CONFIRMED');
    expect(result.current.transactions[0].hash).toBe('abc123hashxyz');
  });

  it('should record error on FAILED status', () => {
    const { result } = renderHook(() => useTxStore());
    let txId: string = '';

    act(() => {
      txId = result.current.addTx({
        title: 'Fail Op',
        description: 'Will fail',
        txType: 'REGISTER_ASSET',
        txArgs: {},
      });
    });

    act(() => {
      result.current.updateTxStatus(txId, 'FAILED', null, 'Simulation failed: insufficient funds');
    });

    const tx = result.current.transactions[0];
    expect(tx.status).toBe('FAILED');
    expect(tx.error).toBe('Simulation failed: insufficient funds');
  });

  it('should increment retry count', () => {
    const { result } = renderHook(() => useTxStore());
    let txId: string = '';

    act(() => {
      txId = result.current.addTx({
        title: 'Retry Me',
        description: 'Will be retried',
        txType: 'DISTRIBUTE_ROYALTY',
        txArgs: {},
      });
    });

    expect(result.current.transactions[0].retryCount).toBe(0);

    act(() => result.current.incrementRetry(txId));
    expect(result.current.transactions[0].retryCount).toBe(1);

    act(() => result.current.incrementRetry(txId));
    expect(result.current.transactions[0].retryCount).toBe(2);
  });

  it('should clear completed transaction history but keep pending/processing', () => {
    const { result } = renderHook(() => useTxStore());

    act(() => {
      const id1 = result.current.addTx({ title: 'A', description: '', txType: 'REGISTER_ASSET', txArgs: {} });
      const id2 = result.current.addTx({ title: 'B', description: '', txType: 'REGISTER_ASSET', txArgs: {} });
      result.current.updateTxStatus(id1, 'CONFIRMED', 'hash1');
      // id2 stays PENDING
    });

    act(() => {
      result.current.clearHistory();
    });

    // id1 (CONFIRMED) should be cleared; id2 (PENDING) should remain
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].status).toBe('PENDING');
  });
});
