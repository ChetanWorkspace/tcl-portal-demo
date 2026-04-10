import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (orderError || !order || order.customer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: proofs, error: proofsError } = await supabase
    .from('proofs')
    .select(
      'id, order_id, proof_number, color, print_type, est_ship_date, price_tiers, mockup_image_url, status, product:products(name)',
    )
    .eq('order_id', id)
    .order('proof_number', { ascending: true, nullsFirst: false });

  if (proofsError) {
    return NextResponse.json({ error: proofsError.message }, { status: 500 });
  }

  return NextResponse.json({ order, proofs: proofs ?? [] });
}
