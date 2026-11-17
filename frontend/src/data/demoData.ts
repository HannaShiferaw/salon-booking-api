import type { Service, Staff } from '../types'

// Demo data mirrors the backend seed data exactly, so the site looks
// complete on GitHub Pages before the backend is deployed.
export const demoServices: Service[] = [
  { id: 1, name: 'Signature Haircut', description: 'A precision cut tailored to your face shape, finished with a relaxing wash and blow-dry.', category: 'Hair', price: 35, duration_minutes: 45, is_active: true },
  { id: 2, name: 'Blowout & Styling', description: 'Smooth, voluminous blow-dry styling that leaves your hair glossy and full of movement.', category: 'Hair', price: 30, duration_minutes: 30, is_active: true },
  { id: 3, name: 'Hair Coloring', description: 'Full colour with premium, gentle formulas — from rich brunettes to vivid fashion shades.', category: 'Hair', price: 85, duration_minutes: 120, is_active: true },
  { id: 4, name: 'Balayage', description: 'Hand-painted, sun-kissed highlights for a soft, natural grow-out. Includes toner and gloss.', category: 'Hair', price: 120, duration_minutes: 150, is_active: true },
  { id: 5, name: 'Deep Hair Treatment', description: 'Deep-conditioning ritual that repairs damage, restores shine and leaves hair silky soft.', category: 'Hair', price: 50, duration_minutes: 60, is_active: true },
  { id: 6, name: 'Classic Manicure', description: 'Classic manicure with shaping, cuticle care, a gentle massage and your choice of polish.', category: 'Nails', price: 25, duration_minutes: 45, is_active: true },
  { id: 7, name: 'Luxury Pedicure', description: 'Soak, exfoliation, shaping and polish — plus a soothing foot massage to finish.', category: 'Nails', price: 35, duration_minutes: 60, is_active: true },
  { id: 8, name: 'Gel Nails', description: 'Long-lasting gel polish with a flawless, high-shine finish that lasts for weeks.', category: 'Nails', price: 45, duration_minutes: 75, is_active: true },
  { id: 9, name: 'Nail Art', description: 'Creative, hand-painted nail art — from delicate florals to bold, modern designs.', category: 'Nails', price: 55, duration_minutes: 90, is_active: true },
  { id: 10, name: 'Glow Facial', description: 'A deep-cleansing, hydrating facial customised to your skin type for an instant glow.', category: 'Beauty', price: 65, duration_minutes: 60, is_active: true },
  { id: 11, name: 'Occasion Makeup', description: 'Professional makeup for any occasion — natural daytime glam or full evening look.', category: 'Beauty', price: 70, duration_minutes: 60, is_active: true },
  { id: 12, name: 'Eyebrow Shaping', description: 'Precise shaping and tinting for beautifully defined, natural-looking brows.', category: 'Beauty', price: 20, duration_minutes: 30, is_active: true },
  { id: 13, name: 'Eyelash Extensions', description: 'Full, fluttery lash extensions applied lash by lash for a wide-awake look.', category: 'Beauty', price: 90, duration_minutes: 90, is_active: true },
]

export const demoStaff: Staff[] = [
  { id: 1, full_name: 'Amara Tesfaye', role: 'Senior Hair Stylist', bio: '10 years of experience in cuts, colour and balayage.', service_ids: [1, 2, 3, 4, 5], is_active: true },
  { id: 2, full_name: 'Sofia Bekele', role: 'Nail Artist', bio: 'Gel, nail art and luxury manicures — precise and creative.', service_ids: [6, 7, 8, 9], is_active: true },
  { id: 3, full_name: 'Lily Haile', role: 'Makeup Artist', bio: 'Bridal and occasion makeup, plus brow and lash artistry.', service_ids: [11, 12, 13], is_active: true },
  { id: 4, full_name: 'Mia Girma', role: 'Esthetician', bio: 'Skin care and facials tailored to every skin type.', service_ids: [10, 12, 5], is_active: true },
]

export const demoTestimonials = [
  { name: 'Hana G.', service: 'Balayage', quote: 'The best salon experience I have ever had. Amara understood exactly what I wanted and my hair has never looked better.' },
  { name: 'Sara M.', service: 'Gel Nails', quote: 'Sofia is so talented — my nails lasted three weeks and looked flawless the whole time. I will not go anywhere else.' },
  { name: 'Meron T.', service: 'Facial', quote: 'Booking online took two minutes, the salon is calm and beautiful, and my skin glowed for days after my facial.' },
]

export const demoAdmin = { email: 'admin@blushsalon.com', password: 'Admin123!' }
export const demoCustomer = { email: 'demo@blushsalon.com', password: 'Demo123!' }

export function demoSlots(date: string): string[] {
  // 09:00–18:00, every 30 minutes. A couple of slots are "taken" on a
  // deterministic basis so the demo feels real without a backend.
  const slots: string[] = []
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  const day = Number(date.slice(-2)) || 1
  return slots.filter((_, i) => (i + day) % 7 !== 0)
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

export function staffName(staff: Staff | null | undefined, fallback = 'No preference'): string {
  if (!staff) return fallback
  return staff.full_name || staff.name || fallback
}

export function serviceName(s: Service | undefined, fallback = 'Service'): string {
  return s?.name ?? fallback
}
