export const config = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api',
  salonName: 'Blush Beauty Salon',
  salonPhone: '+251 911 234 567',
  salonEmail: 'hello@blushsalon.com',
  salonAddress: 'Bole, Addis Ababa, Ethiopia',
  openingHours: 'Mon – Sat, 9:00 AM – 6:00 PM',
} as const
