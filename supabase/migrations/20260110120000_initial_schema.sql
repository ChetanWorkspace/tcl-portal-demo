-- Fresh-setup migration (client handoff): full public schema, RLS, auth profile trigger,
-- storage upload policy, proof-approved → order status trigger, revision_requests SELECT policy.

-- initial_customer_schema: enums, public tables, FKs, RLS, handle_new_user, storage policy (authenticated uploads).

drop extension if exists "pg_net";

create type "public"."order_status_enum" as enum ('new', 'proof_pending', 'proof_ready', 'approved', 'in_production', 'shipped', 'complete');

create type "public"."print_type_enum" as enum ('screen_print', 'embroidery', 'puff_print', 'foil', 'dye_sublimation');

create type "public"."proof_status_enum" as enum ('pending', 'approved', 'revision_requested');

create type "public"."user_type_enum" as enum ('customer', 'campus_rep', 'account_manager');


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "event_name" text not null,
    "due_date" date,
    "status" public.order_status_enum default 'new'::public.order_status_enum,
    "order_type" text,
    "products_selected" text,
    "print_type" public.print_type_enum,
    "front_design_description" text,
    "back_design_description" text,
    "front_design_file" text,
    "back_design_file" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "sku" text,
    "name" text,
    "category" text,
    "turnaround_days" integer,
    "starting_price" numeric,
    "is_featured" boolean,
    "print_types_available" text
      );


alter table "public"."products" enable row level security;


  create table "public"."proofs" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "proof_number" integer,
    "product_id" uuid,
    "color" text,
    "print_type" public.print_type_enum,
    "est_ship_date" date,
    "price_tiers" text,
    "mockup_image_url" text,
    "status" public.proof_status_enum default 'pending'::public.proof_status_enum,
    "uploaded_at" timestamp with time zone default now()
      );


alter table "public"."proofs" enable row level security;


  create table "public"."revision_requests" (
    "id" uuid not null default gen_random_uuid(),
    "proof_id" uuid not null,
    "customer_id" uuid not null,
    "notes" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."revision_requests" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "name" text,
    "email" text,
    "user_type" public.user_type_enum default 'customer'::public.user_type_enum,
    "organization" text,
    "school" text,
    "loyalty_points" integer default 0
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);

CREATE UNIQUE INDEX proofs_pkey ON public.proofs USING btree (id);

CREATE UNIQUE INDEX revision_requests_pkey ON public.revision_requests USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."proofs" add constraint "proofs_pkey" PRIMARY KEY using index "proofs_pkey";

alter table "public"."revision_requests" add constraint "revision_requests_pkey" PRIMARY KEY using index "revision_requests_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.users(id) not valid;

alter table "public"."orders" validate constraint "orders_customer_id_fkey";

alter table "public"."products" add constraint "products_sku_key" UNIQUE using index "products_sku_key";

alter table "public"."proofs" add constraint "proofs_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."proofs" validate constraint "proofs_order_id_fkey";

alter table "public"."proofs" add constraint "proofs_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;

alter table "public"."proofs" validate constraint "proofs_product_id_fkey";

alter table "public"."revision_requests" add constraint "revision_requests_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.users(id) not valid;

alter table "public"."revision_requests" validate constraint "revision_requests_customer_id_fkey";

alter table "public"."revision_requests" add constraint "revision_requests_proof_id_fkey" FOREIGN KEY (proof_id) REFERENCES public.proofs(id) not valid;

alter table "public"."revision_requests" validate constraint "revision_requests_proof_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
      INSERT INTO public.users (id, email, name, user_type)
      VALUES (new.id, new.email, split_part(new.email, '@', 1), 'customer');
      RETURN new;
    END;
    $function$
;

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."proofs" to "anon";

grant insert on table "public"."proofs" to "anon";

grant references on table "public"."proofs" to "anon";

grant select on table "public"."proofs" to "anon";

grant trigger on table "public"."proofs" to "anon";

grant truncate on table "public"."proofs" to "anon";

grant update on table "public"."proofs" to "anon";

grant delete on table "public"."proofs" to "authenticated";

grant insert on table "public"."proofs" to "authenticated";

grant references on table "public"."proofs" to "authenticated";

grant select on table "public"."proofs" to "authenticated";

grant trigger on table "public"."proofs" to "authenticated";

grant truncate on table "public"."proofs" to "authenticated";

grant update on table "public"."proofs" to "authenticated";

grant delete on table "public"."proofs" to "service_role";

grant insert on table "public"."proofs" to "service_role";

grant references on table "public"."proofs" to "service_role";

grant select on table "public"."proofs" to "service_role";

grant trigger on table "public"."proofs" to "service_role";

grant truncate on table "public"."proofs" to "service_role";

grant update on table "public"."proofs" to "service_role";

grant delete on table "public"."revision_requests" to "anon";

grant insert on table "public"."revision_requests" to "anon";

grant references on table "public"."revision_requests" to "anon";

grant select on table "public"."revision_requests" to "anon";

grant trigger on table "public"."revision_requests" to "anon";

grant truncate on table "public"."revision_requests" to "anon";

grant update on table "public"."revision_requests" to "anon";

grant delete on table "public"."revision_requests" to "authenticated";

grant insert on table "public"."revision_requests" to "authenticated";

grant references on table "public"."revision_requests" to "authenticated";

grant select on table "public"."revision_requests" to "authenticated";

grant trigger on table "public"."revision_requests" to "authenticated";

grant truncate on table "public"."revision_requests" to "authenticated";

grant update on table "public"."revision_requests" to "authenticated";

grant delete on table "public"."revision_requests" to "service_role";

grant insert on table "public"."revision_requests" to "service_role";

grant references on table "public"."revision_requests" to "service_role";

grant select on table "public"."revision_requests" to "service_role";

grant trigger on table "public"."revision_requests" to "service_role";

grant truncate on table "public"."revision_requests" to "service_role";

grant update on table "public"."revision_requests" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Users insert own orders"
  on "public"."orders"
  as permissive
  for insert
  to public
with check ((auth.uid() = customer_id));



  create policy "Users read own orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.uid() = customer_id));



  create policy "Users update own orders"
  on "public"."orders"
  as permissive
  for update
  to public
using ((auth.uid() = customer_id));



  create policy "Public Products"
  on "public"."products"
  as permissive
  for select
  to public
using (true);



  create policy "Users read proofs for their orders"
  on "public"."proofs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = proofs.order_id) AND (orders.customer_id = auth.uid())))));



  create policy "Users update own proofs"
  on "public"."proofs"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = proofs.order_id) AND (orders.customer_id = auth.uid())))));



  create policy "Users insert own revisions"
  on "public"."revision_requests"
  as permissive
  for insert
  to public
with check ((auth.uid() = customer_id));



  create policy "Users read own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users update own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy " Allow Inserts mrl72j_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = auth.uid()));





-- order_approved_when_all_proofs_approved: trigger sets orders.status = approved when every proof on that order is approved.

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_order_status_if_all_approved()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_proofs INT;
  approved_proofs INT;
BEGIN
  -- Count total proofs for this order
  SELECT COUNT(*) INTO total_proofs
  FROM public.proofs
  WHERE order_id = NEW.order_id;

  -- Count approved proofs
  SELECT COUNT(*) INTO approved_proofs
  FROM public.proofs
  WHERE order_id = NEW.order_id
    AND status = 'approved';

  -- Require at least one proof so we do not treat "zero proofs" as all approved.
  IF total_proofs > 0 AND total_proofs = approved_proofs THEN
    UPDATE public.orders
    SET status = 'approved'
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trigger_update_order_status AFTER UPDATE OF status ON public.proofs FOR EACH ROW WHEN ((new.status = 'approved'::public.proof_status_enum)) EXECUTE FUNCTION public.update_order_status_if_all_approved();




-- RLS: customers can read revision requests they created (insert policy already exists on public.revision_requests).
CREATE POLICY "Users read own revisions"
  ON public.revision_requests
  FOR SELECT
  TO public
  USING (auth.uid() = customer_id);
