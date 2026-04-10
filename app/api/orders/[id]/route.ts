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

  const { count: proofCount, error: countError } = await supabase
    .from('proofs')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: proofRows, error: proofsListError } = await supabase
    .from('proofs')
    .select('id, proof_number, mockup_image_url, status')
    .eq('order_id', id)
    .order('proof_number', { ascending: true, nullsFirst: false });

  if (proofsListError) {
    return NextResponse.json({ error: proofsListError.message }, { status: 500 });
  }

  return NextResponse.json({
    order,
    proofCount: proofCount ?? 0,
    proofs: proofRows ?? [],
  });
}
