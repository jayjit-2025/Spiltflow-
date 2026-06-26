/**
 * Test Suite 3: useActivityStore — activity feed state management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityStore } from '@/store/useActivityStore';

const initialState = useActivityStore.getState();

describe('useActivityStore', () => {
  beforeEach(() => {
    useActivityStore.setState({ ...initialState, activities: [] });
  });

  it('should start with empty activities', () => {
    const { result } = renderHook(() => useActivityStore());
    expect(result.current.activities).toHaveLength(0);
  });

  it('should add an activity with correct fields', () => {
    const { result } = renderHook(() => useActivityStore());

    act(() => {
      result.current.addActivity({
        type: 'REGISTRATION',
        assetId: 'my_song_1',
        title: 'Asset Registered',
        description: 'Asset "my_song_1" was registered by owner GX3J...',
        hash: 'abc123',
        payer: 'GABC123',
      });
    });

    expect(result.current.activities).toHaveLength(1);
    const activity = result.current.activities[0];
    expect(activity.type).toBe('REGISTRATION');
    expect(activity.assetId).toBe('my_song_1');
    expect(activity.title).toBe('Asset Registered');
    expect(activity.hash).toBe('abc123');
    expect(activity.id).toBeDefined();
    expect(activity.timestamp).toBeGreaterThan(0);
  });

  it('should insert newer activities at the top (most recent first)', () => {
    const { result } = renderHook(() => useActivityStore());

    act(() => {
      result.current.addActivity({
        type: 'REGISTRATION', assetId: 'asset_1', title: 'First', description: '', hash: 'h1',
      });
    });

    act(() => {
      result.current.addActivity({
        type: 'DISTRIBUTION', assetId: 'asset_2', title: 'Second', description: '', hash: 'h2', amount: '100',
      });
    });

    expect(result.current.activities[0].title).toBe('Second');
    expect(result.current.activities[1].title).toBe('First');
  });

  it('should clear all activities', () => {
    const { result } = renderHook(() => useActivityStore());

    act(() => {
      result.current.addActivity({ type: 'REGISTRATION', assetId: 'a', title: 'X', description: '' });
      result.current.addActivity({ type: 'DISTRIBUTION', assetId: 'b', title: 'Y', description: '', amount: '50' });
    });

    expect(result.current.activities).toHaveLength(2);

    act(() => {
      result.current.clearActivities();
    });

    expect(result.current.activities).toHaveLength(0);
  });
});
