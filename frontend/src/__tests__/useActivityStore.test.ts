/**
 * Test Suite 3: useActivityStore — activity feed state management
 * Uses direct Zustand store access (no React rendering needed)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore, ActivityItem } from '@/store/useActivityStore';

const initialState = useActivityStore.getState();

// Helper to build a minimal valid ActivityItem
function makeActivity(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    type: 'REGISTRATION',
    assetId: 'my_song_1',
    title: 'Asset Registered',
    description: 'Asset "my_song_1" was registered',
    timestamp: Date.now(),
    source: 'LOCAL',
    hash: 'abc123',
    payer: 'GABC123',
    ...overrides,
  };
}

describe('useActivityStore', () => {
  beforeEach(() => {
    useActivityStore.setState({ ...initialState, activities: [] });
  });

  it('should start with empty activities', () => {
    expect(useActivityStore.getState().activities).toHaveLength(0);
  });

  it('should add an activity with the provided id and fields', () => {
    const item = makeActivity({ id: 'canonical-id-001' });
    useActivityStore.getState().addActivity(item);

    const state = useActivityStore.getState();
    expect(state.activities).toHaveLength(1);
    const activity = state.activities[0];
    expect(activity.id).toBe('canonical-id-001');
    expect(activity.type).toBe('REGISTRATION');
    expect(activity.assetId).toBe('my_song_1');
    expect(activity.title).toBe('Asset Registered');
    expect(activity.hash).toBe('abc123');
    expect(activity.source).toBe('LOCAL');
  });

  it('should deduplicate: adding the same id twice results in only one entry', () => {
    const item = makeActivity({ id: 'dedup-id-001' });
    useActivityStore.getState().addActivity(item);
    useActivityStore.getState().addActivity(item); // second call with same id

    const state = useActivityStore.getState();
    expect(state.activities).toHaveLength(1);
  });

  it('should insert newer activities at the top (most recent first)', () => {
    useActivityStore.getState().addActivity(
      makeActivity({ id: 'id-first', title: 'First', assetId: 'asset_1' })
    );
    useActivityStore.getState().addActivity(
      makeActivity({ id: 'id-second', type: 'DISTRIBUTION', title: 'Second', assetId: 'asset_2', amount: '100' })
    );

    const state = useActivityStore.getState();
    expect(state.activities[0].title).toBe('Second');
    expect(state.activities[1].title).toBe('First');
  });

  it('should clear all activities', () => {
    useActivityStore.getState().addActivity(makeActivity({ id: 'clear-a' }));
    useActivityStore.getState().addActivity(makeActivity({ id: 'clear-b', type: 'DISTRIBUTION', amount: '50' }));

    expect(useActivityStore.getState().activities).toHaveLength(2);

    useActivityStore.getState().clearActivities();

    expect(useActivityStore.getState().activities).toHaveLength(0);
  });

  it('should accept REAL, LOCAL, and SIMULATED sources', () => {
    useActivityStore.getState().addActivity(makeActivity({ id: 'src-real', source: 'REAL' }));
    useActivityStore.getState().addActivity(makeActivity({ id: 'src-local', source: 'LOCAL' }));
    useActivityStore.getState().addActivity(makeActivity({ id: 'src-sim', source: 'SIMULATED' }));

    const activities = useActivityStore.getState().activities;
    expect(activities).toHaveLength(3);
    const sources = activities.map((a) => a.source);
    expect(sources).toContain('REAL');
    expect(sources).toContain('LOCAL');
    expect(sources).toContain('SIMULATED');
  });
});
