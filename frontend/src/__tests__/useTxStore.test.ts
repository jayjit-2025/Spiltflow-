/**
 * Test Suite 2: useTxStore — transaction lifecycle management
 * Uses direct Zustand store access (no React rendering needed)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTxStore } from '@/store/useTxStore';

const initialState = useTxStore.getState();

describe('useTxStore', () => {
  beforeEach(() => {
    useTxStore.setState({ ...initialState, transactions: [] });
  });

  it('should start with empty transactions', () => {
    expect(useTxStore.getState().transactions).toHaveLength(0);
  });

  it('should add a transaction with PENDING status', () => {
    const txId = useTxStore.getState().addTx({
      title: 'Test Register',
      description: 'Registering test asset',
      txType: 'REGISTER_ASSET',
      txArgs: { assetId: 'test_asset_1' },
    });

    const state = useTxStore.getState();
    expect(state.transactions).toHaveLength(1);
    const tx = state.transactions[0];
    expect(tx.id).toBe(txId);
    expect(tx.status).toBe('PENDING');
    expect(tx.hash).toBeNull();
    expect(tx.error).toBeNull();
    expect(tx.retryCount).toBe(0);
    expect(tx.title).toBe('Test Register');
  });

  it('should transition status from PENDING to PROCESSING to CONFIRMED', () => {
    const txId = useTxStore.getState().addTx({
      title: 'Distribute',
      description: 'Distributing royalties',
      txType: 'DISTRIBUTE_ROYALTY',
      txArgs: { assetId: 'my_song', amount: '10' },
    });

    expect(useTxStore.getState().transactions[0].status).toBe('PENDING');

    useTxStore.getState().updateTxStatus(txId, 'PROCESSING');
    expect(useTxStore.getState().transactions[0].status).toBe('PROCESSING');

    useTxStore.getState().updateTxStatus(txId, 'CONFIRMED', 'abc123hashxyz');
    expect(useTxStore.getState().transactions[0].status).toBe('CONFIRMED');
    expect(useTxStore.getState().transactions[0].hash).toBe('abc123hashxyz');
  });

  it('should record error on FAILED status', () => {
    const txId = useTxStore.getState().addTx({
      title: 'Fail Op',
      description: 'Will fail',
      txType: 'REGISTER_ASSET',
      txArgs: {},
    });

    useTxStore.getState().updateTxStatus(txId, 'FAILED', null, 'Simulation failed: insufficient funds');

    const tx = useTxStore.getState().transactions[0];
    expect(tx.status).toBe('FAILED');
    expect(tx.error).toBe('Simulation failed: insufficient funds');
  });

  it('should increment retry count', () => {
    const txId = useTxStore.getState().addTx({
      title: 'Retry Me',
      description: 'Will be retried',
      txType: 'DISTRIBUTE_ROYALTY',
      txArgs: {},
    });

    expect(useTxStore.getState().transactions[0].retryCount).toBe(0);

    useTxStore.getState().incrementRetry(txId);
    expect(useTxStore.getState().transactions[0].retryCount).toBe(1);

    useTxStore.getState().incrementRetry(txId);
    expect(useTxStore.getState().transactions[0].retryCount).toBe(2);
  });

  it('should clear completed transaction history but keep pending/processing', () => {
    const id1 = useTxStore.getState().addTx({ title: 'A', description: '', txType: 'REGISTER_ASSET', txArgs: {} });
    const id2 = useTxStore.getState().addTx({ title: 'B', description: '', txType: 'REGISTER_ASSET', txArgs: {} });
    useTxStore.getState().updateTxStatus(id1, 'CONFIRMED', 'hash1');
    // id2 stays PENDING

    useTxStore.getState().clearHistory();

    // id1 (CONFIRMED) should be cleared; id2 (PENDING) should remain
    expect(useTxStore.getState().transactions).toHaveLength(1);
    expect(useTxStore.getState().transactions[0].status).toBe('PENDING');
  });
});
