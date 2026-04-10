import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { PackageOpen, Plus } from 'lucide-react';
import type { OrderRow } from '@/types/customer';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderCreatedBanner } from '@/components/dashboard/OrderCreatedBanner';
import { NextBestActionPanel } from '@/components/dashboard/NextBestActionPanel';
import { Card } from '@/components/ui/Card';

type DashboardPageProps = {
  searchParams: Promise<{ orderCreated?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams;
  const showOrderCreated = sp.orderCreated === '1';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, organization')
    .eq('id', user.id)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const name = profile?.name ?? 'there';
  const org = profile?.organization ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <OrderCreatedBanner show={showOrderCreated} />
      <NextBestActionPanel fromSessionStorage active={showOrderCreated} />

      <Card className="border-gray-200 bg-gradient-to-br from-white via-gray-50/40 to-teal-50/20 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
              Welcome, {name}
            </h1>
            {org ? (
              <p className="mt-2 text-sm text-gray-600">{org}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Your organization</p>
            )}
          </div>
          <Link
            href="/orders/new"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 lg:w-auto"
          >
            <Plus className="size-4" strokeWidth={2} />
            Create new order
          </Link>
        </div>
      </Card>

      <section className="mt-8 lg:mt-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your orders</h2>
          {orders && orders.length > 0 ? (
            <span className="text-xs font-medium text-gray-500">{orders.length} total</span>
          ) : null}
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed border-gray-300 bg-gray-50/50 p-8 text-center sm:p-12 lg:p-16">
            <span className="flex size-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <PackageOpen className="size-8" strokeWidth={1.25} />
            </span>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">No orders yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              When you&apos;re ready, start an order to pick products, upload art, and choose a
              print method.
            </p>
            <Link
              href="/orders/new"
              className="mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 sm:w-auto"
            >
              <Plus className="size-4" strokeWidth={2} />
              Create order
            </Link>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4 lg:gap-6">
            {(orders as OrderRow[]).map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
