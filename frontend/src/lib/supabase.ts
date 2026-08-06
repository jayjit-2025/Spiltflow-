import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoicgaitdtapfqxuldng.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Se5TurPke9gTS4BaSZD1Sg_pEPirjV3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbAsset {
  id?: string;
  asset_id: string;
  owner_address: string;
  is_active: boolean;
  created_at?: string;
}

export interface DbContributor {
  id?: string;
  asset_id: string;
  address: string;
  share_bps: number;
  created_at?: string;
}

export interface DbTransaction {
  id?: string;
  tx_hash: string;
  asset_id: string;
  type: 'REGISTRATION' | 'DISTRIBUTION';
  payer_address: string;
  amount_xlm: string;
  status: 'CONFIRMED' | 'FAILED' | 'PROCESSING';
  timestamp: number;
  created_at?: string;
}

export interface DbUserFeedback {
  id?: string;
  name: string;
  email: string;
  wallet_address?: string;
  rating: number;
  feedback: string;
  created_at?: string;
}
