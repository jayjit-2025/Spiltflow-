import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId');

    if (assetId) {
      const { data: asset, error: assetErr } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_id', assetId)
        .single();

      if (assetErr) {
        return NextResponse.json({ success: false, error: assetErr.message }, { status: 404 });
      }

      const { data: contributors } = await supabase
        .from('contributors')
        .select('*')
        .eq('asset_id', assetId);

      return NextResponse.json({
        success: true,
        asset: {
          ...asset,
          contributors: contributors || [],
        },
      });
    }

    const { data: assets, error } = await supabase
      .from('assets')
      .select('*, contributors(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assetId, ownerAddress, contributors } = body;

    if (!assetId || !ownerAddress || !Array.isArray(contributors)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: assetId, ownerAddress, and contributors required.' },
        { status: 400 }
      );
    }

    // Upsert Asset
    const { data: asset, error: assetErr } = await supabase
      .from('assets')
      .upsert({ asset_id: assetId, owner_address: ownerAddress, is_active: true }, { onConflict: 'asset_id' })
      .select()
      .single();

    if (assetErr) {
      return NextResponse.json({ success: false, error: assetErr.message }, { status: 500 });
    }

    // Replace Contributors
    await supabase.from('contributors').delete().eq('asset_id', assetId);

    const contributorRows = contributors.map((c: { address: string; shareBps: number }) => ({
      asset_id: assetId,
      address: c.address,
      share_bps: c.shareBps,
    }));

    const { error: contribErr } = await supabase.from('contributors').insert(contributorRows);

    if (contribErr) {
      return NextResponse.json({ success: false, error: contribErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, asset });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
