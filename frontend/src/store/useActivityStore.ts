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
  /** Alias kept for backward compatibility with older store pushes */
  txHash?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  /**
   * 'REAL'      — event fetched from an on-chain Soroban RPC response
   * 'SIMULATED' — locally generated mock event (never from the ledger)
   * 'LOCAL'     — event pushed directly after a successful dashboard transaction
   */
  source: 'REAL' | 'SIMULATED' | 'LOCAL';
}

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (activity: ActivityItem) => void;
  fetchDbActivities: () => Promise<void>;
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

  fetchDbActivities: async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (data.success && Array.isArray(data.activities)) {
        data.activities.forEach((item: ActivityItem) => {
          get().addActivity(item);
        });
      }
    } catch (err) {
      console.warn('Could not fetch Supabase activity feed:', err);
    }
  },

  clearActivities: () => {
    set({ activities: [] });
  },
}));
