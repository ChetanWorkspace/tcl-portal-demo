'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export type ProofReviewState = { error?: string; success?: string } | null;

async function assertOwnOrderProof(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  proofId: string,
  userId: string,
) {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, customer_id')
    .eq('id', orderId)
    .single();

  if (orderErr || !order || order.customer_id !== userId) {
    return { ok: false as const, message: 'Order not found.' };
  }

  const { data: proof, error: proofErr } = await supabase
    .from('proofs')
    .select('id, status')
    .eq('id', proofId)
    .eq('order_id', orderId)
    .single();

  if (proofErr || !proof) {
    return { ok: false as const, message: 'Proof not found.' };
  }

  return { ok: true as const, proof };
}

async function maybeAdvanceOrderToApproved(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
) {
  const { data: proofs, error } = await supabase
    .from('proofs')
    .select('status')
    .eq('order_id', orderId);

  if (error || !proofs?.length) return;

  const allApproved = proofs.every((p) => p.status === 'approved');
  if (allApproved) {
    await supabase.from('orders').update({ status: 'approved' }).eq('id', orderId);
  }
}

function revalidateOrderProofs(orderId: string) {
  revalidatePath(`/orders/${orderId}/proofs`);
  revalidatePath(`/orders/${orderId}`);
}

export async function approveProof(_prev: ProofReviewState, formData: FormData): Promise<ProofReviewState> {
  const proofId = String(formData.get('proofId') ?? '').trim();
  const orderId = String(formData.get('orderId') ?? '').trim();

  if (!proofId || !orderId) {
    return { error: 'Missing proof or order.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const check = await assertOwnOrderProof(supabase, orderId, proofId, user.id);
  if (!check.ok) {
    return { error: check.message };
  }

  if (check.proof.status === 'approved') {
    return { success: 'This proof is already approved.' };
  }

  const { error: updateErr } = await supabase
    .from('proofs')
    .update({ status: 'approved' })
    .eq('id', proofId)
    .eq('order_id', orderId);

  if (updateErr) {
    return { error: 'Could not approve this proof. Please try again.' };
  }

  await maybeAdvanceOrderToApproved(supabase, orderId);
  revalidateOrderProofs(orderId);

  return { success: 'Proof approved.' };
}

export async function requestProofRevision(
  _prev: ProofReviewState,
  formData: FormData,
): Promise<ProofReviewState> {
  const proofId = String(formData.get('proofId') ?? '').trim();
  const orderId = String(formData.get('orderId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!proofId || !orderId) {
    return { error: 'Missing proof or order.' };
  }

  if (notes.length < 3) {
    return { error: 'Please add a short note (at least 3 characters) describing what to change.' };
  }

  if (notes.length > 4000) {
    return { error: 'Notes are too long.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const check = await assertOwnOrderProof(supabase, orderId, proofId, user.id);
  if (!check.ok) {
    return { error: check.message };
  }

  if (check.proof.status === 'approved') {
    return { error: 'This proof is already approved. Contact your account manager if you need changes.' };
  }

  const { error: revErr } = await supabase.from('revision_requests').insert({
    proof_id: proofId,
    customer_id: user.id,
    notes,
  });

  if (revErr) {
    return { error: 'Could not save your revision request. Please try again.' };
  }

  const { error: updateErr } = await supabase
    .from('proofs')
    .update({ status: 'revision_requested' })
    .eq('id', proofId)
    .eq('order_id', orderId);

  if (updateErr) {
    return { error: 'Could not update proof status. Please try again.' };
  }

  revalidateOrderProofs(orderId);

  return { success: 'Revision requested. Our team will follow up.' };
}
