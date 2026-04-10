import type { LucideIcon } from 'lucide-react';
import { Droplets, Layers, Sparkles, Sun, Shirt } from 'lucide-react';

/** Must match `print_type_enum` in `supabase/01_Supabase_Migration.sql`. */
export type PrintTypeEnumId =
  | 'screen_print'
  | 'embroidery'
  | 'puff_print'
  | 'foil'
  | 'dye_sublimation';

export type PrintTypeOption = {
  id: PrintTypeEnumId;
  name: string;
  description: string;
  minQuantity: number;
  turnaroundDays: string;
  icon: LucideIcon;
};

export const PRINT_TYPES: PrintTypeOption[] = [
  {
    id: 'screen_print',
    name: 'Screen Printing',
    description:
      'Vibrant, durable inks pushed through mesh screens—ideal for bold graphics and team uniforms.',
    minQuantity: 12,
    turnaroundDays: '5–7 business days',
    icon: Layers,
  },
  {
    id: 'embroidery',
    name: 'Embroidery',
    description:
      'Thread-based decoration with a premium, tactile finish—great for polos, hats, and corporate apparel.',
    minQuantity: 6,
    turnaroundDays: '7–10 business days',
    icon: Shirt,
  },
  {
    id: 'puff_print',
    name: 'Puff Print',
    description:
      'Raised, textured ink that adds dimension and a retro athletic feel to logos and lettering.',
    minQuantity: 24,
    turnaroundDays: '6–9 business days',
    icon: Sparkles,
  },
  {
    id: 'foil',
    name: 'Foil',
    description:
      'Metallic accents that catch the light—perfect for premium events, awards, and statement pieces.',
    minQuantity: 36,
    turnaroundDays: '8–12 business days',
    icon: Sun,
  },
  {
    id: 'dye_sublimation',
    name: 'Dye Sublimation',
    description:
      'Full-color, all-over prints that become part of the fabric—best for performance wear and complex art.',
    minQuantity: 1,
    turnaroundDays: '4–6 business days',
    icon: Droplets,
  },
];

export function printTypeLabel(id: string | null | undefined): string {
  if (!id) return '—';
  const p = PRINT_TYPES.find((t) => t.id === id);
  return p?.name ?? id.replace(/_/g, ' ');
}
