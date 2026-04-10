import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapProductRow } from '@/lib/map-product';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: raw, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const products = (raw ?? []).map((r) => mapProductRow(r as Record<string, unknown>));

  const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();

  return NextResponse.json({
    products,
    customerName: profile?.name ?? null,
  });
}
