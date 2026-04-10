/**
 * Mock Shopify Storefront–shaped products for /api/sync-products (no live API keys).
 * Maps into the public.products row shape used by this app.
 */
export type MockShopifyProduct = {
  sku: string;
  title: string;
  productType: string;
  turnaroundDays: number;
  price: number;
  featured: boolean;
  printTypes: string;
};

export const MOCK_SHOPIFY_PRODUCTS: MockShopifyProduct[] = [
  {
    sku: 'TEE-GILDAN-64000',
    title: 'Gildan Softstyle Tee',
    productType: 'T-Shirts',
    turnaroundDays: 10,
    price: 8.5,
    featured: true,
    printTypes: 'screen_print,puff_print,foil',
  },
  {
    sku: 'TEE-BELLA-3001',
    title: 'Bella+Canvas Unisex Tee',
    productType: 'T-Shirts',
    turnaroundDays: 10,
    price: 11.0,
    featured: true,
    printTypes: 'screen_print,dye_sublimation,foil',
  },
  {
    sku: 'CREW-INDEPENDENT-SS3000',
    title: 'Independent Trading Crewneck',
    productType: 'Sweatshirts',
    turnaroundDays: 12,
    price: 22.0,
    featured: true,
    printTypes: 'screen_print,embroidery,puff_print',
  },
  {
    sku: 'MOCK-SYNC-HAT-001',
    title: 'Mock Sync Trucker Hat',
    productType: 'Headwear',
    turnaroundDays: 14,
    price: 17.5,
    featured: false,
    printTypes: 'embroidery,screen_print',
  },
];
