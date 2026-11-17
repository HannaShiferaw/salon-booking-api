# Blush Beauty Salon: Booking & Management System

A complete, production-quality booking and management system for a women's
beauty salon. Customers browse services, book appointments online and manage
their bookings. Salon admins manage appointments, customers, services, staff,
availability and business stats from a dashboard — all in a soft
baby-pink-and-white luxury theme.

- **Live site:** https://hannashiferaw.github.io/salon-booking-api/
- **Repository:** https://github.com/HannaShiferaw/salon-booking-api
- **Backend API:** deploy separately (see [Deployment](#deployment)) —
  GitHub Pages only hosts static sites, so the Go API cannot run there.

> **Demo mode:** the live Pages site works even before the backend is
> deployed. When the API is unreachable it uses built-in sample services,
> staff and bookings stored in the browser, clearly labelled
> “Demo mode — backend not connected yet”. Point `VITE_API_URL` at a
> deployed backend and everything switches to live data.

## Features

### Customers
- Browse services by category (Hair, Nails, Beauty) with price and duration
- 6-step booking: service → staff (or “No preference”) → date → time slot → review → confirm
- Register / log in / log out, profile management
- Dashboard with upcoming and past appointments, cancel and reschedule
  (cancellation only more than 24 hours ahead)
- Booking confirmation showing service, staff, date, time, duration, price and status

### Admins
- Dashboard: today's appointments, upcoming, total customers, pending, confirmed
- Appointments: search, filter by date/status/staff/service, pagination,
  confirm / complete / cancel / no-show, detail view
- Calendar: month view with appointments per day
- Customers: search and appointment history
- Services: create, edit, delete, activate/deactivate, price and duration
- Staff: add/edit/deactivate, assign services, working hours
- Availability: salon hours, staff schedules, block dates/times
- Settings: salon name, contact, opening hours

### Booking rules (enforced on the backend, not just the frontend)
- No double booking: overlapping appointments for the same staff member are
  rejected with `409 Conflict`, re-checked inside a transaction at creation
- Slots respect the service duration (a 45-minute service blocks 09:00 and 09:30)
- Staff who cannot perform a service are not bookable for it
- Blocked dates/times and staff days off return no slots (Sundays are closed)
- Past dates cannot be booked

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Go 1.23, Gin, GORM, JWT, bcrypt |
| Database | PostgreSQL (production), SQLite fallback for local dev |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 3, React Router (HashRouter) |
| Deployment | GitHub Pages (frontend), Render + managed PostgreSQL (backend) |

## Project structure

```
salon-booking-api/
├── backend/                 Go API (see backend/README.md)
│   ├── cmd/server/          entrypoint & routes
│   ├── internal/{config,database,handlers,middleware,models,
│   │            repositories,services,utils}
│   ├── migrations/001_init.sql
│   └── tests/
├── frontend/                React + TypeScript (see frontend/README.md)
│   └── src/{components,pages,services,context,data,types,utils}
├── .github/workflows/deploy-pages.yml
├── Dockerfile               backend image
└── render.yaml              Render blueprint (API + Postgres)
```

## Run locally

### Backend (zero setup — SQLite)

```bash
cd backend
go run ./cmd/server        # http://localhost:8080, seeds demo data
go test ./...              # backend tests
```

For PostgreSQL instead, copy `backend/.env.example` to `backend/.env` and
set `DATABASE_URL=postgres://user:pass@localhost:5432/blush_salon`.

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
npm run build              # production build
```

The frontend talks to `VITE_API_URL` (default `http://localhost:8080/api`).
Set it in `frontend/.env` to point at a deployed backend.

## Demo accounts

Seeded automatically on first run (change the admin password via the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@blushsalon.com` | `Admin123!` |
| Customer | `demo@blushsalon.com` | `Demo123!` |

## API overview

All responses use `{ "success": true, "message": "...", "data": ... }`.
Errors use the same shape with `success: false` and an `error` message.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Public | `GET /api/services`, `GET /api/staff`, `GET /api/availability/slots?service_id=&staff_id=&date=` |
| Appointments | `POST /api/appointments`, `GET /api/appointments/me`, `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/reschedule` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/appointments`, `PATCH /api/admin/appointments/:id/status`, `GET /api/admin/customers`, CRUD on `/api/admin/services`, `/api/admin/staff`, `/api/admin/blocked-dates`, `GET/PUT /api/admin/settings` |

Appointment statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`.

## Deployment

### Frontend — GitHub Pages (automatic)
Pushing to `main` runs `.github/workflows/deploy-pages.yml`: it builds the
frontend and deploys it to GitHub Pages. SPA routing uses `HashRouter`, so
deep links work on Pages, and `vite.config.ts` sets
`base: '/salon-booking-api/'` so assets load correctly.
To connect the live site to a real backend, set the repository variable
`VITE_API_URL` (Settings → Secrets and variables → Actions → Variables)
to the deployed API URL, e.g. `https://blush-salon-api.onrender.com/api`,
then re-run the workflow.

### Backend + database — Render (one click from this repo)
1. In Render: **New → Blueprint**, select this repository.
2. Render creates the free PostgreSQL database and the `blush-salon-api`
   web service from `render.yaml`, wiring `DATABASE_URL` automatically.
3. It generates a `JWT_SECRET` and sets `CORS_ORIGINS` to the Pages site.
4. Copy the service URL into the `VITE_API_URL` repository variable above.

The backend also runs anywhere Docker runs: `docker build -t blush-api .`
then run with `DATABASE_URL`, `JWT_SECRET` and `PORT` set. On first boot
with `SEED_DEMO=true` it creates the demo accounts, services and staff.

## Testing

- Backend: `go test ./...` in `backend/` — covers registration, login,
  duplicate email, invalid input, overlap logic, double-booking rejection,
  back-to-back bookings, past-date and inactive-service rejection.
- Live API smoke test (run while the server is up): login as admin and as
  the demo customer, fetch slots, create a booking, repeat the same
  slot (expect `409`), check the slot disappears, try an unauthenticated
  request (expect `401`) and a customer hitting an admin route (expect `403`).
- Frontend: `npm run build` (type-check + build) and manual checks of
  navigation, registration, login, the booking flow, the admin dashboard
  and mobile layouts.

## Limitations & future improvements

- No email/SMS notifications yet — booking confirmation is shown in-app.
  (Add an email provider and a notification table to enable it.)
- No online payments; bookings are pay-at-salon.
- No automated frontend tests yet; coverage is build + manual flows.
- PostgreSQL was not live-tested in the build environment (no Postgres
  server there); the Postgres driver, connection path and `001_init.sql`
  are in place — verify against the Render database on first deploy.
- Free Render services sleep after inactivity, so the first API request
  after a pause can take ~30 seconds.
