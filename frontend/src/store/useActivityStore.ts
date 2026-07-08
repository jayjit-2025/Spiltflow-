import { create } from 'zustand';

export interface ActivityItem {
  id: string;
  type: 'DISTRIBUTION' | 'REGISTRATION' | 'DEACTIVATION' | 'UPDATE';
  assetId: string;
  title: string;
  description: string;
  timestamp: number;
  amount?: string;
  payer?: string;
  hash?: string;
  /**
   * 'REAL'      — event fetched from an on-chain Soroban RPC response
   * 'SIMULATED' — locally generated mock event (never from the ledger)
   * 'LOCAL'     — event pushed directly after a successful dashboard transaction
   */
  source: 'REAL' | 'SIMULATED' | 'LOCAL';
}

interface ActivityState {
  activities: ActivityItem[];
  /**
   * Add an activity only if its `id` has not already been recorded.
   * For real on-chain events `id` is the canonical RPC event ID (`{ledger}-{index}`).
   * For local/simulated events a caller-provided unique string is expected.
   */
  addActivity: (activity: ActivityItem) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  activities: [],

  addActivity: (activity) => {
    // Deduplication guard: skip if we already have this event ID
    const exists = get().activities.some((a) => a.id === activity.id);
    if (exists) return;

    set((state) => ({
      // Newest first; cap at 200 entries
      activities: [activity, ...state.activities].slice(0, 200),
    }));
  },

  clearActivities: () => {
    set({ activities: [] });
  },
}));
