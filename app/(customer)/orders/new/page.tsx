import { redirect } from 'next/navigation';
import { NewOrderWizard } from '@/components/orders/NewOrderWizard';
import type { ProductRow } from '@/types/customer';
import { serverApiFetch } from '@/lib/server-api-fetch';

export default async function NewOrderPage() {
  const res = await serverApiFetch('/api/orders/new/bootstrap');
  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    throw new Error('Failed to load new order data');
  }

  const { products, customerName } = (await res.json()) as {
    products: ProductRow[];
    customerName: string | null;
  };

  return <NewOrderWizard initialProducts={products} customerName={customerName} />;
}
