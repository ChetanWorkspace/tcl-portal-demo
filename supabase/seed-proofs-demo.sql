-- Demo proofs with real, loadable placeholder images (placehold.co).
-- Fictional cdn.tcl.io URLs from the brief are not real files and break in the browser.
--
-- Targets the first order that has ZERO proofs (any order without proofs — not only the oldest row).
-- Products: prefers SKUs TEE-BELLA-3001 and TEE-GILDAN-64000; otherwise uses the first / second product rows.
--
-- In Supabase SQL Editor: run the whole script. Check the result grid from RETURNING (3 rows) or "Success. N rows affected".
--
-- If 0 rows: every order may already have proofs, or there are no orders/products — run diagnostics at the bottom.

WITH
  ord AS (
    SELECT o.id
    FROM public.orders o
    WHERE NOT EXISTS (SELECT 1 FROM public.proofs p WHERE p.order_id = o.id)
    ORDER BY o.created_at ASC
    LIMIT 1
  ),
  pick AS (
    SELECT
      COALESCE(
        (SELECT id FROM public.products WHERE sku = 'TEE-BELLA-3001' LIMIT 1),
        (SELECT id FROM public.products ORDER BY name NULLS LAST, id LIMIT 1)
      ) AS p1,
      COALESCE(
        (SELECT id FROM public.products WHERE sku = 'TEE-GILDAN-64000' LIMIT 1),
        (SELECT id FROM public.products ORDER BY name NULLS LAST, id OFFSET 1 LIMIT 1),
        (SELECT id FROM public.products ORDER BY name NULLS LAST, id LIMIT 1)
      ) AS p2
  )
INSERT INTO public.proofs (
  order_id,
  proof_number,
  product_id,
  color,
  print_type,
  est_ship_date,
  price_tiers,
  mockup_image_url,
  status,
  uploaded_at
)
SELECT ord.id, 1, pick.p1, 'Heather Peach', 'screen_print'::public.print_type_enum, '2026-02-24'::date,
  '24-47: $13.50 | 48-71: $12.00 | 72+: $10.75',
  'https://placehold.co/800x600/0d9488/ffffff/png?text=Proof+1', 'approved'::public.proof_status_enum, '2026-02-10 14:32:00+00'::timestamptz
FROM ord CROSS JOIN pick
WHERE ord.id IS NOT NULL AND pick.p1 IS NOT NULL
UNION ALL
SELECT ord.id, 2, pick.p1, 'Coral', 'screen_print'::public.print_type_enum, '2026-02-24'::date,
  '24-47: $11.50 | 48-71: $10.25 | 72+: $9.00',
  'https://placehold.co/800x600/0f766e/ffffff/png?text=Proof+2', 'approved'::public.proof_status_enum, '2026-02-10 14:35:00+00'::timestamptz
FROM ord CROSS JOIN pick
WHERE ord.id IS NOT NULL AND pick.p1 IS NOT NULL
UNION ALL
SELECT ord.id, 3, pick.p2, 'Navy', 'screen_print'::public.print_type_enum, '2026-03-06'::date,
  '24-47: $10.50 | 48-71: $9.25 | 72+: $8.00',
  'https://placehold.co/800x600/115e59/ffffff/png?text=Proof+3', 'pending'::public.proof_status_enum, '2026-02-12 09:15:00+00'::timestamptz
FROM ord CROSS JOIN pick
WHERE ord.id IS NOT NULL AND pick.p2 IS NOT NULL
RETURNING id, order_id, proof_number, status;

-- Move matching orders to proof_ready for the customer UI
UPDATE public.orders o
SET status = 'proof_ready'
WHERE o.status IN ('new', 'proof_pending')
  AND EXISTS (
    SELECT 1
    FROM public.proofs p
    WHERE p.order_id = o.id
      AND p.mockup_image_url IS NOT NULL
  );

-- --- Diagnostics (run as separate queries if you get 0 rows from INSERT above) ---
-- SELECT COUNT(*) AS orders FROM public.orders;
-- SELECT COUNT(*) AS products FROM public.products;
-- SELECT COUNT(*) AS proofs FROM public.proofs;
-- SELECT o.id, o.event_name, COUNT(p.id) AS proof_count
--   FROM public.orders o
--   LEFT JOIN public.proofs p ON p.order_id = o.id
--   GROUP BY o.id, o.event_name
--   ORDER BY o.created_at DESC;

-- --- Force one order (replace UUID) if every order already has proofs ---
-- INSERT INTO public.proofs (order_id, proof_number, product_id, color, print_type, est_ship_date, price_tiers, mockup_image_url, status, uploaded_at)
-- SELECT 'YOUR-ORDER-UUID'::uuid, 1, id, 'Heather Peach', 'screen_print', '2026-02-24',
--   '24-47: $13.50 | 48-71: $12.00 | 72+: $10.75', 'https://placehold.co/800x600/0d9488/ffffff/png?text=Proof+1', 'approved', now()
-- FROM public.products ORDER BY id LIMIT 1;
