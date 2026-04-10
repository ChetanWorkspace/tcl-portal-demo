import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type CreateOrderBody = {
  event_name?: string;
  due_date?: string;
  order_type?: string;
  products_selected?: string;
  print_type?: string;
  front_design_description?: string;
  back_design_description?: string;
  front_design_file?: string | null;
  back_design_file?: string | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : '';
  const dueDate = typeof body.due_date === 'string' ? body.due_date : '';
  const orderType = body.order_type === 'link' ? 'link' : 'group';
  const productsSelected =
    typeof body.products_selected === 'string' ? body.products_selected : '';
  const printType = typeof body.print_type === 'string' ? body.print_type : '';
  const frontDesc =
    typeof body.front_design_description === 'string' ? body.front_design_description : '';
  const backDesc =
    typeof body.back_design_description === 'string' ? body.back_design_description : '';

  if (!eventName || !dueDate || !productsSelected || !printType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: inserted, error: insErr } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      event_name: eventName,
      due_date: dueDate,
      order_type: orderType,
      products_selected: productsSelected,
      print_type: printType,
      front_design_description: frontDesc || '—',
      back_design_description: backDesc || '—',
      front_design_file: body.front_design_file ?? null,
      back_design_file: body.back_design_file ?? null,
      status: 'new',
    })
    .select('id')
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order_id: inserted?.id ?? null });
}
