import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const activities = (transactions || []).map((t) => ({
      id: t.id,
      type: t.type,
      assetId: t.asset_id,
      title: t.type === 'REGISTRATION' ? 'Asset Registered' : 'Royalty Distributed',
      description:
        t.type === 'REGISTRATION'
          ? `Asset "${t.asset_id}" registered on-chain`
          : `Distributed ${t.amount_xlm} XLM for asset "${t.asset_id}"`,
      timestamp: t.timestamp,
      hash: t.tx_hash,
      payer: t.payer_address,
      amountXlm: t.amount_xlm,
      source: 'DATABASE',
    }));

    return NextResponse.json({ success: true, activities });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
