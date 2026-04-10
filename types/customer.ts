export type OrderStatus =
  | 'new'
  | 'proof_pending'
  | 'proof_ready'
  | 'approved'
  | 'in_production'
  | 'shipped'
  | 'complete'
  | string;

export type UserProfile = {
  name: string | null;
  organization: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  starting_price: number | null;
  turnaround_days: number | null;
  featured: boolean | null;
};

export type OrderRow = {
  id: string;
  customer_id: string;
  event_name: string;
  due_date: string | null;
  status: OrderStatus;
  order_type?: string | null;
  print_type?: string | null;
  products_selected?: string | null;
  front_design_description?: string | null;
  back_design_description?: string | null;
  created_at?: string;
};

export type SelectedProductLine = {
  productId: string;
  name: string;
  color: string;
  imageUrl: string | null;
  category: string | null;
  startingPrice: number | null;
};

export type DesignDirection = 'exact' | 'inspiration' | 'designer_choice';
