# Blush Beauty Salon — Frontend

React 19 + TypeScript + Vite + Tailwind CSS v3. Baby-pink / blush / white luxury feminine theme.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

The frontend talks to the Go backend at `VITE_API_URL` (see `.env.example`, default `http://localhost:8080/api`).

```bash
npm run build      # type-check + production build
npm run preview    # serve the production build
```

## Demo mode

If the backend is unreachable (for example on GitHub Pages before the backend is deployed), the site still works end-to-end with built-in demo data (13 services, 4 staff — the same as the backend seed) and bookings saved in `localStorage`. A clear "Demo mode — backend not connected yet" notice is shown on booking.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@blushsalon.com | Admin123! |
| Customer | demo@blushsalon.com | Demo123! |

## Routing

HashRouter is used so SPA routing works on GitHub Pages with no server rewrites. The Vite `base` is `/salon-booking-api/`.

## Structure

- `src/config.ts` — API URL and salon details (single source)
- `src/services/` — central fetch client (`api.ts`) + thin per-domain wrappers
- `src/data/demoData.ts` — demo services, staff, testimonials, slot generator
- `src/context/AuthContext.tsx` — auth state, token + user in localStorage
- `src/components/common/` — Button, Input, Card, Modal, Badge, Spinner, EmptyState, Alert, ConfirmDialog, Toast
- `src/components/layout/` — Navbar, Footer, AdminLayout
- `src/components/booking/BookingWizard.tsx` — 6-step booking flow
- `src/pages/` — Home, Services, Booking, Login, Register, CustomerDashboard, Profile
- `src/pages/admin/` — Dashboard, Appointments, Calendar, Customers, Services, Staff, Availability, Settings
