import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data: feedback, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, walletAddress, rating, feedback } = body;

    if (!name || !email || !rating || !feedback) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: name, email, rating, and feedback required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        name,
        email,
        wallet_address: walletAddress || null,
        rating: Number(rating),
        feedback,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
