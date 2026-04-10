-- Client demo seed (runs after migrations on `supabase db reset`).
-- Sign in: test@tcl-demo.com / Test@123 (documented in repo README).

SET session_replication_role = replica;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'test@tcl-demo.com',
  crypt('Test@123', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}',
  '{}',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
);

INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'email', 'test@tcl-demo.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
);

-- public.users row is created by trigger handle_new_user; align display name
UPDATE public.users
SET name = 'Demo Customer'
WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO storage.buckets (id, name, public)
SELECT 'product_image', 'product_image', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product_image');

INSERT INTO public.products (sku, name, category, turnaround_days, starting_price, is_featured, print_types_available)
VALUES
  ('TEE-GILDAN-64000', 'Gildan Softstyle Tee', 'T-Shirts', 10, 8.50, true, 'screen_print,puff_print,foil'),
  ('TEE-BELLA-3001', 'Bella+Canvas Unisex Tee', 'T-Shirts', 10, 11.00, true, 'screen_print,dye_sublimation,foil'),
  ('CREW-INDEPENDENT-SS3000', 'Independent Trading Crewneck', 'Sweatshirts', 12, 22.00, true, 'screen_print,embroidery,puff_print'),
  ('HOOD-GILDAN-18500', 'Gildan Heavy Blend Hoodie', 'Sweatshirts', 12, 24.00, true, 'screen_print,embroidery,puff_print')
ON CONFLICT (sku) DO NOTHING;

DO $$
DECLARE
  pid uuid;
BEGIN
  SELECT id INTO pid FROM public.products WHERE sku = 'TEE-BELLA-3001' LIMIT 1;
  IF pid IS NULL THEN
    RAISE EXCEPTION 'seed: missing product TEE-BELLA-3001';
  END IF;
  INSERT INTO public.orders (
    customer_id,
    event_name,
    due_date,
    status,
    order_type,
    products_selected,
    print_type,
    front_design_description,
    back_design_description
  ) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo campus order',
    CURRENT_DATE + 30,
    'new',
    'group',
    format('[{"productId":"%s","name":"Bella+Canvas Unisex Tee","color":"Black"}]', pid),
    'screen_print',
    'Demo front design notes for client review.',
    'Demo back design notes.'
  );
END $$;

SET session_replication_role = DEFAULT;
