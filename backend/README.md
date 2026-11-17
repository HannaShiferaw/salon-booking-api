# Blush Beauty Salon — Backend

Go + Gin + GORM REST API for the Blush Beauty Salon booking system.

## Stack

- Go 1.23, Gin, GORM
- PostgreSQL in production (`DATABASE_URL`), SQLite fallback locally when `DATABASE_URL` is empty or `sqlite:...` — so the API runs with zero setup
- JWT auth (24h), bcrypt password hashing
- Consistent JSON envelope: `{ "success": true, "message": "...", "data": {...} }`

## Run locally

```bash
export GOROOT=$HOME/go GOPATH=$HOME/gopath PATH=$HOME/go/bin:$PATH
cp .env.example .env   # optional; defaults work out of the box
go run ./cmd/server
# API on http://localhost:8080, health check: GET /health
```

With Postgres instead of SQLite, set `DATABASE_URL=postgres://user:pass@localhost:5432/blush_salon?sslmode=disable` in `.env`.

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8080` | |
| `DATABASE_URL` | _(empty = SQLite `blush.db`)_ | Postgres DSN in production |
| `JWT_SECRET` | dev-only placeholder | **Must be set to a long random secret in production** |
| `CORS_ORIGINS` | localhost:5173, localhost:4173, hannashiferaw.github.io | comma-separated |
| `SEED_DEMO` | `true` | Seeds demo admin, customer, services, staff |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@blushsalon.com` / `Admin123!` | Demo admin; change in production |

## Demo accounts (seeded)

- Admin: `admin@blushsalon.com` / `Admin123!`
- Customer: `demo@blushsalon.com` / `Demo123!`

## API overview

- `GET /health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`
- Public: `GET /api/services`, `GET /api/services/:id`, `GET /api/staff`, `GET /api/staff/:id`, `GET /api/availability/slots?service_id=&staff_id=&date=`
- Customer (Bearer token): `POST /api/appointments`, `GET /api/appointments/me`, `GET /api/appointments/:id`, `PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/reschedule`
- Admin (Bearer token + admin role): `GET /api/admin/stats`, `GET /api/admin/appointments`, `PATCH /api/admin/appointments/:id/status`, `GET /api/admin/customers`, `GET /api/admin/customers/:id/appointments`, CRUD for `/api/admin/services` and `/api/admin/staff`, `POST /api/admin/staff/:id/services`, `GET|PUT /api/admin/staff/:id/schedule`, `GET|POST|DELETE /api/admin/blocked-dates`, `GET|PUT /api/admin/settings`

## Booking rules (enforced in the backend, not just the frontend)

- Slots are 09:00–18:00, every 30 minutes, respecting the service duration.
- A slot is unavailable if it is in the past, outside staff working hours, on a blocked date, or overlaps an existing pending/confirmed appointment for that staff member (overlap = `start < existing_end AND end > existing_start`).
- Customers can only cancel more than 24 hours ahead; admins can always cancel.
- "No preference" bookings auto-assign the first available staff member who offers the service.

## Tests

```bash
go test ./...
go vet ./...
gofmt -l .
go build ./...
```

Tests use a temporary SQLite database — no Postgres needed.

## Structure

```
cmd/server/main.go          # entrypoint + routes
internal/config/            # env config
internal/models/            # User, Service, Staff, Appointment, ...
internal/database/          # connect, AutoMigrate, seed demo data
internal/repositories/      # database access
internal/services/          # business logic (auth, availability, appointments, admin stats)
internal/handlers/          # HTTP handlers
internal/middleware/        # JWT auth, role check, CORS
internal/utils/             # response envelope, validation, time helpers
migrations/001_init.sql     # canonical PostgreSQL DDL
tests/                      # auth + appointment/double-booking tests
```
