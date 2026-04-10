'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, Info, Loader2, Package, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { DesignDirection, ProductRow, SelectedProductLine } from '@/types/customer';
import { PRODUCT_COLORS } from '@/lib/product-colors';
import { PRINT_TYPES } from '@/lib/print-types';
import { cn } from '@/lib/cn';
import { HorizontalWizardStepper } from '@/components/customer-flow/HorizontalWizardStepper';
import { useOrderWizardStep } from '@/components/customer-flow/OrderWizardContext';
import { ProductCard } from '@/components/catalog/ProductCard';
import { FileUpload } from '@/components/forms/FileUpload';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  SUPABASE_DESIGNS_BUCKET,
  formatStorageError,
  uploadDesignAssets,
} from '@/lib/supabase-storage';
import { OrderReviewModal } from '@/components/orders/OrderReviewModal';

type Props = {
  initialProducts: ProductRow[];
  customerName: string | null;
};

function formatLocalDateYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDueDateOnOrAfterToday(iso: string): boolean {
  if (!iso) return false;
  return iso >= formatLocalDateYyyyMmDd(new Date());
}

function isCompleteYyyyMmDd(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function withDirectionPrefix(direction: DesignDirection, text: string) {
  const labels: Record<DesignDirection, string> = {
    exact: 'Copy design exactly as provided',
    inspiration: 'Use as inspiration — designer interpretation',
    designer_choice: 'No preference — designer’s choice',
  };
  return `[${labels[direction]}]\n\n${text}`.trim();
}

export function NewOrderWizard({ initialProducts, customerName }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { setWizardStep } = useOrderWizardStep();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderType, setOrderType] = useState<'group' | 'link'>('group');
  const [eventName, setEventName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateReady, setDueDateReady] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [lines, setLines] = useState<SelectedProductLine[]>([]);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontDir, setFrontDir] = useState<DesignDirection>('exact');
  const [backDir, setBackDir] = useState<DesignDirection>('exact');
  const [printTypeId, setPrintTypeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step2Uploading, setStep2Uploading] = useState(false);
  const [frontStorageUrl, setFrontStorageUrl] = useState('');
  const [backStorageUrl, setBackStorageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    setWizardStep(1);
  }, [setWizardStep]);

  useEffect(() => {
    setWizardStep(step);
  }, [step, setWizardStep]);

  useEffect(() => {
    const today = formatLocalDateYyyyMmDd(new Date());
    setDueDate(today);
    setDueDateReady(true);
  }, []);

  const todayMin = dueDateReady ? formatLocalDateYyyyMmDd(new Date()) : undefined;

  const categories = useMemo(() => {
    const s = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) s.add(p.category);
    });
    return ['all', ...Array.from(s).sort()];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q || p.name.toLowerCase().includes(q) || (p.category?.toLowerCase().includes(q) ?? false);
      const matchC = category === 'all' || p.category === category;
      return matchQ && matchC;
    });
  }, [initialProducts, search, category]);

  const toggleProduct = useCallback((p: ProductRow) => {
    setLines((prev) => {
      const exists = prev.find((l) => l.productId === p.id);
      if (exists) return prev.filter((l) => l.productId !== p.id);
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          color: PRODUCT_COLORS[0],
          imageUrl: p.image_url,
          category: p.category,
          startingPrice: p.starting_price,
        },
      ];
    });
  }, []);

  const setLineColor = useCallback((productId: string, color: string) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, color } : l)));
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const canNextFromStep1 =
    eventName.trim().length > 0 &&
    dueDate.length > 0 &&
    isDueDateOnOrAfterToday(dueDate) &&
    lines.length > 0;
  const canNextFromStep2 = true;

  const goNext = async () => {
    setError(null);
    if (step === 1 && !canNextFromStep1) {
      if (dueDate && !isDueDateOnOrAfterToday(dueDate)) {
        setError('Due date must be today or a future date.');
        return;
      }
      setError('Add an event name, due date, and at least one product.');
      return;
    }
    if (step === 2) {
      if (!canNextFromStep2) return;
      setStep2Uploading(true);
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) {
          setError('You need to be signed in.');
          return;
        }

        const { frontUrl, backUrl } = await uploadDesignAssets(
          supabase,
          user.id,
          SUPABASE_DESIGNS_BUCKET,
          frontFile,
          backFile,
        );
        setFrontStorageUrl(frontUrl);
        setBackStorageUrl(backUrl);
        setStep(3);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : formatStorageError(e, SUPABASE_DESIGNS_BUCKET));
      } finally {
        setStep2Uploading(false);
      }
      return;
    }

    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const goBack = () => {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const selectedPrintType = useMemo(
    () => PRINT_TYPES.find((p) => p.id === printTypeId) ?? null,
    [printTypeId],
  );

  function openReviewModal() {
    if (!printTypeId) {
      setError('Choose a print type to continue.');
      return;
    }
    setError(null);
    setReviewModalOpen(true);
  }

  const submitOrder = async () => {
    setError(null);
    if (!printTypeId) {
      setError('Choose a print type to continue.');
      return;
    }
    if (!isDueDateOnOrAfterToday(dueDate)) {
      setError('Due date must be today or a future date.');
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError('You need to be signed in.');
        setSubmitting(false);
        return;
      }

      let frontUrl = frontStorageUrl;
      let backUrl = backStorageUrl;

      const needFrontUpload = Boolean(frontFile) && !frontUrl;
      const needBackUpload = Boolean(backFile) && !backUrl;
      if (needFrontUpload || needBackUpload) {
        const uploaded = await uploadDesignAssets(
          supabase,
          user.id,
          SUPABASE_DESIGNS_BUCKET,
          needFrontUpload ? frontFile : null,
          needBackUpload ? backFile : null,
        );
        if (needFrontUpload) frontUrl = uploaded.frontUrl;
        if (needBackUpload) backUrl = uploaded.backUrl;
      }

      const productsPayload = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        color: l.color,
      }));

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName.trim(),
          due_date: dueDate,
          order_type: orderType,
          products_selected: JSON.stringify(productsPayload),
          print_type: printTypeId,
          front_design_description: withDirectionPrefix(frontDir, frontText.trim() || '—'),
          back_design_description: withDirectionPrefix(backDir, backText.trim() || '—'),
          front_design_file: frontUrl || null,
          back_design_file: backUrl || null,
        }),
      });

      if (!orderRes.ok) {
        const errBody = (await orderRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? 'Could not create order');
      }

      const orderBody = (await orderRes.json()) as { order_id?: string | null };
      if (typeof window !== 'undefined' && orderBody.order_id) {
        try {
          sessionStorage.setItem('tcl_last_order_id', orderBody.order_id);
        } catch {
          /* ignore */
        }
      }

      setReviewModalOpen(false);
      router.push('/dashboard?orderCreated=1');
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : formatStorageError(e, SUPABASE_DESIGNS_BUCKET);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative pb-36">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-teal-700">
            Step {step} of 3 · Create order
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
            Create a new order
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Select products, share artwork direction, then choose how we&apos;ll decorate your
            pieces.
          </p>
        </div>

        <Card className="mt-6 p-6">
          <HorizontalWizardStepper current={step} />
        </Card>

        {error && !reviewModalOpen ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
            <div className="flex flex-col gap-6">
              <Card>
                <CardTitle>Order type</CardTitle>
                <CardDescription>How will this order be collected?</CardDescription>
                <div className="mt-6 grid gap-3">
                  {(
                    [
                      {
                        id: 'group' as const,
                        title: 'Group order',
                        desc: 'You submit one order with sizes and quantities.',
                      },
                      {
                        id: 'link' as const,
                        title: 'Get a link',
                        desc: 'Share a link so individuals can order on their own.',
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer flex-col rounded-xl border p-4 transition-colors',
                        orderType === opt.id
                          ? 'border-teal-400 bg-teal-50/50 ring-1 ring-teal-200'
                          : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="orderType"
                          className="mt-1"
                          checked={orderType === opt.id}
                          onChange={() => setOrderType(opt.id)}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{opt.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              <Card>
                <CardTitle>Event details</CardTitle>
                <div className="mt-6 flex flex-col gap-4">
                  <label className="block text-xs font-medium text-gray-600">
                    Event name
                    <input
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      placeholder="e.g. Lakeside summer league"
                      required
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-600">
                    Due date
                    <input
                      type="date"
                      value={dueDate}
                      min={todayMin}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDueDate(v);
                        if (!v) {
                          setError(null);
                          return;
                        }
                        if (!isCompleteYyyyMmDd(v)) {
                          setError(null);
                          return;
                        }
                        if (!isDueDateOnOrAfterToday(v)) {
                          setError('Due date must be today or a future date.');
                          return;
                        }
                        setError(null);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      required
                    />
                  </label>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="mt-0">Selected products</CardTitle>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {lines.length}
                  </span>
                </div>
                {lines.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">Pick styles from the catalog →</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-2">
                    {lines.map((l) => (
                      <li
                        key={l.productId}
                        className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{l.name}</p>
                          <select
                            value={l.color}
                            onChange={(e) => setLineColor(l.productId, e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 sm:mt-0 sm:max-w-[140px]"
                          >
                            {PRODUCT_COLORS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(l.productId)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="min-w-0">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900 shadow-sm">
                <div className="flex gap-2">
                  <Info className="size-4 shrink-0 text-sky-600" strokeWidth={1.5} />
                  <p>
                    Need something that&apos;s not listed? Add a note in the design step—we&apos;ll
                    confirm availability before production.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 md:w-auto md:min-w-[11rem]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All categories' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={lines.some((l) => l.productId === p.id)}
                    onToggle={() => toggleProduct(p)}
                  />
                ))}
              </div>
              {filteredProducts.length === 0 ? (
                <p className="mt-8 text-center text-sm text-stone-500">
                  No products match filters.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start">
            <p className="col-span-full text-xs text-gray-500 lg:col-span-2">
              Reference files are uploaded when you continue to the print type step.
            </p>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <div className="flex items-center gap-2 text-gray-900">
                  <Package className="size-4 text-teal-600" strokeWidth={1.5} />
                  <CardTitle className="mt-0">Order snapshot</CardTitle>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-gray-600">
                  <li>
                    <span className="text-gray-400">Event · </span>
                    {eventName || '—'}
                  </li>
                  <li>
                    <span className="text-gray-400">Due · </span>
                    {dueDate || '—'}
                  </li>
                  <li>
                    <span className="text-gray-400">Type · </span>
                    {orderType === 'group' ? 'Group order' : 'Shareable link'}
                  </li>
                </ul>
                <p className="mt-6 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Products ({lines.length})
                </p>
                <ul className="mt-2 max-h-48 space-y-2 overflow-auto text-sm">
                  {lines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-2 text-gray-700">
                      <span className="truncate">{l.name}</span>
                      <span className="shrink-0 text-gray-500">{l.color}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>

            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(['front', 'back'] as const).map((side) => {
                  const isFront = side === 'front';
                  const text = isFront ? frontText : backText;
                  const setText = isFront ? setFrontText : setBackText;
                  const file = isFront ? frontFile : backFile;
                  const setFile = isFront ? setFrontFile : setBackFile;
                  const dir = isFront ? frontDir : backDir;
                  const setDir = isFront ? setFrontDir : setBackDir;
                  return (
                    <Card key={side} className="flex flex-col">
                      <CardTitle className="capitalize">{side} design</CardTitle>
                      <CardDescription>
                        Describe the idea and upload any references.
                      </CardDescription>
                      <label className="mt-6 block text-xs font-medium text-gray-600">
                        What&apos;s the idea?
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          rows={4}
                          className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                          placeholder="Placement, colors, typography, mood…"
                        />
                      </label>
                      <div className="mt-4">
                        <FileUpload
                          label="Reference files"
                          file={file}
                          onFileChange={setFile}
                          disabled={submitting}
                        />
                      </div>
                      <fieldset className="mt-6">
                        <legend className="text-xs font-medium text-gray-600">
                          Design direction
                        </legend>
                        <div className="mt-2 flex flex-col gap-2">
                          {(
                            [
                              { id: 'exact' as const, label: 'Copy exactly as provided' },
                              {
                                id: 'inspiration' as const,
                                label: 'Use as inspiration — make it your own',
                              },
                              {
                                id: 'designer_choice' as const,
                                label: 'No preference — designer’s choice',
                              },
                            ] as const
                          ).map((o) => (
                            <label
                              key={o.id}
                              className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1 py-1 hover:bg-gray-50"
                            >
                              <input
                                type="radio"
                                name={`dir-${side}`}
                                checked={dir === o.id}
                                onChange={() => setDir(o.id)}
                                className="mt-0.5"
                              />
                              <span className="text-sm text-gray-700">{o.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-teal-100 bg-teal-50/50">
                <CardTitle className="text-teal-950">Design file tips</CardTitle>
                <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-teal-900/90">
                  <li>300 DPI raster artwork minimum; vector (.AI, .EPS, .PDF) preferred.</li>
                  <li>Outline fonts or convert text to paths before export.</li>
                  <li>RGB for digital mockups; we&apos;ll match inks to your approved proof.</li>
                </ul>
              </Card>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardTitle>Summary</CardTitle>
                <p className="mt-4 text-sm text-gray-600">
                  {lines.length} product{lines.length === 1 ? '' : 's'} ·{' '}
                  {eventName || 'Untitled event'}
                </p>
                <p className="mt-6 text-xs text-gray-500">
                  Pick the method that fits your timeline and minimums. You can discuss upgrades
                  with your coordinator after submit.
                </p>
              </Card>
            </aside>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PRINT_TYPES.map((pt) => {
                const Icon = pt.icon;
                const selected = printTypeId === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setPrintTypeId(pt.id)}
                    className={cn(
                      'flex flex-col rounded-xl border bg-white p-6 text-left shadow-sm transition-all',
                      selected
                        ? 'border-teal-400 ring-2 ring-teal-200 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <Icon className="size-5" strokeWidth={1.5} />
                      </span>
                      {pt.minQuantity <= 12 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-semibold text-gray-900">{pt.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{pt.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        Min {pt.minQuantity} pcs
                      </span>
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {pt.turnaroundDays}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-6 lg:left-72 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-gray-500 sm:text-left">
            <span className="font-medium text-gray-900">{lines.length}</span> products selected
            <span className="mx-2 text-gray-300">·</span>
            Step {step} of 3
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={goBack}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} />
                Back
              </Button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 sm:w-auto"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} />
                Exit
              </Link>
            )}
            {step < 3 ? (
              <Button
                type="button"
                disabled={step2Uploading}
                onClick={() => void goNext()}
                className="w-full sm:w-auto"
              >
                {step2Uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    {step === 1 ? 'Next: Design details' : 'Next: Print type'}
                    <ChevronRight className="size-4" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={openReviewModal} className="w-full sm:w-auto">
                Submit order
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <OrderReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setError(null);
        }}
        customerName={customerName}
        eventName={eventName}
        dueDate={dueDate}
        lines={lines}
        frontText={frontText}
        backText={backText}
        frontDir={frontDir}
        backDir={backDir}
        frontFileName={frontFile?.name ?? null}
        backFileName={backFile?.name ?? null}
        orderType={orderType}
        printType={selectedPrintType}
        onConfirm={submitOrder}
        confirming={submitting}
        error={error}
      />
    </div>
  );
}
