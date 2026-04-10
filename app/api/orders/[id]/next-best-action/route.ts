import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateGeminiText } from '@/lib/gemini-server';

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

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, event_name, due_date, print_type, order_type, status')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: proofRows } = await supabase
    .from('proofs')
    .select('status')
    .eq('order_id', id);

  const proofList = proofRows ?? [];
  const proofCounts = { pending: 0, approved: 0, revision_requested: 0 };
  for (const p of proofList) {
    if (p.status === 'pending') proofCounts.pending += 1;
    else if (p.status === 'approved') proofCounts.approved += 1;
    else if (p.status === 'revision_requested') proofCounts.revision_requested += 1;
  }
  const totalProofs = proofList.length;
  const allApproved =
    totalProofs > 0 &&
    proofCounts.approved === totalProofs &&
    proofCounts.pending === 0 &&
    proofCounts.revision_requested === 0;

  const proofSummary =
    totalProofs === 0
      ? 'No proofs on file yet (team is preparing mockups).'
      : `${totalProofs} proof(s): ${proofCounts.approved} approved, ${proofCounts.pending} pending review, ${proofCounts.revision_requested} revision requested.`;

  if (!process.env.GOOGLE_API_KEY?.trim()) {
    return NextResponse.json({
      suggestion: null,
      fallback:
        'Add GOOGLE_API_KEY to your environment to enable personalized next steps from our assistant.',
    });
  }

  const system = `You are a concise customer-success assistant for a custom apparel printer (TCL).
Respond in 2–4 short sentences, friendly and practical. No markdown headings, no bullet lists longer than 3 items.
Adapt to the order stage:
- Order new / proof_pending / no proofs yet: set expectations for when mockups arrive and one prep tip (roster, sizes, art).
- proof_ready with pending proofs: urge timely review and approval; mention revisions if something looks off.
- Any revision_requested: explain we'll send updated mockups and they should watch their email / this portal.
- Order approved (all proofs approved) or in_production: production is underway; rough timeline by due date; no need to re-approve unless contacted.
- shipped / complete: delivery expectations and who to contact for issues.`;

  const stageHint = allApproved
    ? 'All proofs are approved — focus on production and what happens until they receive the goods.'
    : proofCounts.revision_requested > 0
      ? 'At least one proof has revision requested — focus on turnaround for revised art.'
      : proofCounts.pending > 0 && order.status === 'proof_ready'
        ? 'Proofs are waiting for customer approval.'
        : totalProofs === 0
          ? 'Customer is still waiting for first mockups.'
          : 'Use proof counts and order status to set accurate expectations.';

  const userPrompt = `Order context (customer is viewing this order in the portal):
- Event name: ${order.event_name}
- Due date (ship/event): ${order.due_date ?? 'not set'}
- Print method: ${order.print_type ?? 'not specified'}
- Order collection type: ${order.order_type ?? 'not specified'} (group = one combined order; link = shareable individual ordering)
- Order workflow status: ${order.status}
- Proofs: ${proofSummary}
- Stage note: ${stageHint}

Give a brief "what happens next" message for this exact moment (including if they closed the page and came back after approving proofs).`;

  try {
    const suggestion = await generateGeminiText(system, userPrompt);
    return NextResponse.json({ suggestion, fallback: null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gemini request failed';
    return NextResponse.json(
      {
        suggestion: null,
        fallback:
          'We could not load an AI suggestion right now. Your order is saved — our team will follow up with proofs when ready.',
        error: msg,
      },
      { status: 200 },
    );
  }
}
