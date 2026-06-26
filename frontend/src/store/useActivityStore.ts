import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep up to 100 activities
        }));
      },

      clearActivities: () => {
        set({ activities: [] });
      },
    }),
    {
      name: 'splitflow-activity-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
