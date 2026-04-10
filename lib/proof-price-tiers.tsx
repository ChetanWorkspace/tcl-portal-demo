import type { ReactNode } from 'react';

export type PriceTiersContent =
  | { type: 'table'; rows: { qty: string; price: string }[] }
  | { type: 'text'; text: string };

export function parsePriceTiers(raw: string | null): PriceTiersContent | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  try {
    const p = JSON.parse(s) as unknown;
    if (Array.isArray(p)) {
      const rows: { qty: string; price: string }[] = [];
      for (const item of p) {
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const min = o.min_qty ?? o.minQty ?? o.qty ?? o.quantity ?? o.min ?? o.from;
          const price = o.price ?? o.price_each ?? o.each ?? o.per_piece ?? o.ppp;
          if (min != null && price != null) {
            rows.push({
              qty: String(min),
              price: typeof price === 'number' ? `$${price.toFixed(2)}` : String(price),
            });
          }
        }
      }
      if (rows.length) return { type: 'table', rows };
      return { type: 'text', text: JSON.stringify(p, null, 2) };
    }
    if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
      const rows = Object.entries(p as Record<string, unknown>).map(([k, v]) => ({
        qty: k,
        price: typeof v === 'number' ? `$${v.toFixed(2)}` : String(v),
      }));
      if (rows.length) return { type: 'table', rows };
    }
  } catch {
    // fall through
  }
  return { type: 'text', text: s };
}

export function PriceTiersDisplay({ content }: { content: PriceTiersContent | null }): ReactNode {
  if (!content) {
    return <span className="text-stone-400">—</span>;
  }
  if (content.type === 'text') {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-800">
        {content.text}
      </pre>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50/80">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-100/80 text-stone-600">
            <th className="px-3 py-2 font-semibold">Qty / tier</th>
            <th className="px-3 py-2 font-semibold">Price / pc</th>
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row, i) => (
            <tr key={i} className="border-b border-stone-100 last:border-0">
              <td className="px-3 py-2 font-medium text-stone-800">{row.qty}</td>
              <td className="px-3 py-2 text-stone-700">{row.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
