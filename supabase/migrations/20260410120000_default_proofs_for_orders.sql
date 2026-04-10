-- Default proof rows for every order: templates live in DB; new orders get proofs via trigger;
-- existing orders with zero proofs are backfilled once when this migration runs.

create table public.default_proof_templates (
  id serial primary key,
  proof_number integer not null unique,
  product_ordinal integer not null default 0,
  color text not null,
  price_tiers text not null,
  mockup_image_url text not null,
  status public.proof_status_enum not null default 'pending'::public.proof_status_enum
);

comment on table public.default_proof_templates is
  'Catalog of demo/default proofs copied onto each order at insert (and backfill). product_ordinal is 0-based index into order products_selected JSON.';

insert into public.default_proof_templates (
  proof_number,
  product_ordinal,
  color,
  price_tiers,
  mockup_image_url,
  status
)
values
  (
    1,
    0,
    'Heather Peach',
    '24-47: $13.50 | 48-71: $12.00 | 72+: $10.75',
    'https://placehold.co/800x600/0d9488/ffffff/png?text=Proof+1',
    'approved'::public.proof_status_enum
  ),
  (
    2,
    0,
    'Coral',
    '24-47: $11.50 | 48-71: $10.25 | 72+: $9.00',
    'https://placehold.co/800x600/0f766e/ffffff/png?text=Proof+2',
    'approved'::public.proof_status_enum
  ),
  (
    3,
    1,
    'Navy',
    '24-47: $10.50 | 48-71: $9.25 | 72+: $8.00',
    'https://placehold.co/800x600/115e59/ffffff/png?text=Proof+3',
    'pending'::public.proof_status_enum
  );

alter table public.default_proof_templates enable row level security;

revoke all on public.default_proof_templates from public;
grant all on public.default_proof_templates to postgres;
grant all on public.default_proof_templates to service_role;

-- Allow serial sequence for inserts from trigger (owner is typically postgres).
grant usage, select on sequence public.default_proof_templates_id_seq to postgres;
grant usage, select on sequence public.default_proof_templates_id_seq to service_role;

revoke all on public.default_proof_templates from anon, authenticated;

create or replace function public.create_default_proofs_for_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  product_ids uuid[];
  tmpl record;
  pid uuid;
  ord_idx int;
begin
  select * into o from public.orders where id = target_order_id;
  if not found then
    return;
  end if;

  if exists (select 1 from public.proofs p where p.order_id = target_order_id) then
    return;
  end if;

  begin
    with elems as (
      select elem, ordinality as ord
      from jsonb_array_elements(coalesce(o.products_selected::jsonb, '[]'::jsonb))
        with ordinality as t(elem, ordinality)
    )
    select array_agg((elem->>'productId')::uuid order by ord) into product_ids
    from elems;
  exception
    when others then
      product_ids := null;
  end;

  if product_ids is null or coalesce(array_length(product_ids, 1), 0) = 0 then
    select array(
      select p.id
      from public.products p
      order by p.name nulls last, p.id
      limit 2
    ) into product_ids;
  end if;

  if product_ids is null or coalesce(array_length(product_ids, 1), 0) = 0 then
    return;
  end if;

  for tmpl in
    select * from public.default_proof_templates order by proof_number
  loop
    ord_idx := tmpl.product_ordinal + 1;
    if ord_idx > array_length(product_ids, 1) then
      pid := product_ids[1];
    else
      pid := product_ids[ord_idx];
    end if;

    insert into public.proofs (
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
    values (
      o.id,
      tmpl.proof_number,
      pid,
      tmpl.color,
      coalesce(o.print_type, 'screen_print'::public.print_type_enum),
      o.due_date,
      tmpl.price_tiers,
      tmpl.mockup_image_url,
      tmpl.status,
      now()
    );
  end loop;

  if exists (
      select 1
      from public.proofs p
      where p.order_id = o.id
        and p.mockup_image_url is not null
    )
    and o.status in ('new'::public.order_status_enum, 'proof_pending'::public.order_status_enum)
  then
    update public.orders
    set status = 'proof_ready'::public.order_status_enum
    where id = o.id;
  end if;
end;
$$;

create or replace function public.seed_default_proofs_for_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_default_proofs_for_order(new.id);
  return new;
end;
$$;

create trigger trg_orders_seed_default_proofs
after insert on public.orders
for each row
execute function public.seed_default_proofs_for_new_order();

revoke all on function public.create_default_proofs_for_order(uuid) from public, anon, authenticated;
revoke all on function public.seed_default_proofs_for_new_order() from public, anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select o.id
    from public.orders o
    where not exists (select 1 from public.proofs p where p.order_id = o.id)
  loop
    perform public.create_default_proofs_for_order(r.id);
  end loop;
end $$;
