import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const assetId = searchParams.get('assetId');

    let query = supabase.from('transactions').select('*').order('timestamp', { ascending: false });

    if (wallet) {
      query = query.eq('payer_address', wallet);
    }
    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transactions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, assetId, type, payerAddress, amountXlm, status, timestamp } = body;

    if (!txHash || !assetId || !type || !payerAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: txHash, assetId, type, payerAddress required.' },
        { status: 400 }
      );
    }

    const { data: tx, error } = await supabase
      .from('transactions')
      .upsert(
        {
          tx_hash: txHash,
          asset_id: assetId,
          type,
          payer_address: payerAddress,
          amount_xlm: amountXlm || '0',
          status: status || 'CONFIRMED',
          timestamp: timestamp || Date.now(),
        },
        { onConflict: 'tx_hash' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: tx });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
