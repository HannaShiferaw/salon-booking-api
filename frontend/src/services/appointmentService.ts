import { api, isDemoMode } from './api'
import { demoServices, demoSlots, demoStaff } from '../data/demoData'
import type { Appointment, AppointmentStatus, BookingPayload } from '../types'

const DEMO_KEY = 'blush_demo_appointments'

function demoAppointments(): Appointment[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? '[]') as Appointment[]
  } catch {
    return []
  }
}
function saveDemoAppointments(list: Appointment[]): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(list))
}

export function enrich(a: Appointment): Appointment {
  const service = demoServices.find((s) => String(s.id) === String(a.service_id))
  const staff = demoStaff.find((s) => String(s.id) === String(a.staff_id))
  // Backend nests staff as {name, title}; demo/frontend types use full_name/role.
  const nestedStaffName =
    (a.staff as unknown as { full_name?: string; name?: string } | null | undefined)?.full_name ??
    (a.staff as unknown as { full_name?: string; name?: string } | null | undefined)?.name
  return {
    ...a,
    customer_name: a.customer_name ?? (a.customer as unknown as { full_name?: string } | undefined)?.full_name,
    service_name: a.service_name ?? a.service?.name ?? service?.name,
    staff_name: a.staff_name ?? nestedStaffName ?? staff?.full_name ?? null,
    duration_minutes: a.duration_minutes ?? a.service?.duration_minutes ?? service?.duration_minutes,
    price: a.price ?? service?.price,
    start_time: a.start_time ?? a.time ?? '',
  }
}

export const appointmentService = {
  async slots(staffId: number | string | null, serviceId: number | string, date: string): Promise<string[]> {
    try {
      const q = new URLSearchParams({ date, service_id: String(serviceId) })
      if (staffId) q.set('staff_id', String(staffId))
      const data = await api.get<string[] | { slots: string[] }>(`/availability/slots?${q.toString()}`)
      if (Array.isArray(data)) return data
      if (data && Array.isArray((data as { slots: string[] }).slots)) return (data as { slots: string[] }).slots
      return demoSlots(date)
    } catch {
      const taken = demoAppointments().filter((a) => a.date === date && String(a.staff_id ?? '') === String(staffId ?? ''))
      return demoSlots(date).filter((s) => !taken.some((a) => a.start_time === s))
    }
  },

  async create(payload: BookingPayload, customerName: string): Promise<Appointment> {
    try {
      const created = await api.post<Appointment>('/appointments', payload)
      return enrich(created)
    } catch (err) {
      if (!isDemoMode() && !(err instanceof TypeError)) throw err
      const service = demoServices.find((s) => String(s.id) === String(payload.service_id))
      const staff = demoStaff.find((s) => String(s.id) === String(payload.staff_id))
      const appt: Appointment = {
        id: `demo-${Date.now()}`,
        customer_name: customerName,
        service_id: payload.service_id,
        service_name: service?.name,
        staff_id: payload.staff_id ?? null,
        staff_name: staff?.full_name ?? null,
        date: payload.date,
        start_time: payload.start_time,
        duration_minutes: service?.duration_minutes,
        price: service?.price,
        status: 'pending',
        notes: payload.notes,
        created_at: new Date().toISOString(),
      }
      const list = demoAppointments()
      list.push(appt)
      saveDemoAppointments(list)
      return appt
    }
  },

  async myAppointments(): Promise<Appointment[]> {
    try {
      const data = await api.get<Appointment[]>('/appointments/me')
      return (Array.isArray(data) ? data : []).map(enrich)
    } catch {
      return demoAppointments().map(enrich)
    }
  },

  async all(params: Record<string, string> = {}): Promise<Appointment[]> {
    try {
      const q = new URLSearchParams(params).toString()
      const data = await api.get<Appointment[] | { items: Appointment[] }>(`/admin/appointments${q ? `?${q}` : ''}`)
      const list = Array.isArray(data) ? data : data?.items ?? []
      return list.map(enrich)
    } catch {
      return demoAppointments().map(enrich)
    }
  },

  async setStatus(id: number | string, status: AppointmentStatus): Promise<void> {
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status })
    } catch {
      const list = demoAppointments().map((a) => (String(a.id) === String(id) ? { ...a, status } : a))
      saveDemoAppointments(list)
    }
  },

  async cancel(id: number | string): Promise<void> {
    try {
      await api.patch(`/appointments/${id}/cancel`, {})
    } catch (err) {
      // Demo mode, or an admin cancelling via the customer endpoint: fall back to the admin status route.
      if (err instanceof TypeError) {
        const list = demoAppointments().map((a) => (String(a.id) === String(id) ? { ...a, status: 'cancelled' as AppointmentStatus } : a))
        saveDemoAppointments(list)
        return
      }
      await this.setStatus(id, 'cancelled')
    }
  },

  async reschedule(id: number | string, date: string, startTime: string): Promise<void> {
    try {
      await api.patch(`/appointments/${id}/reschedule`, { date, start_time: startTime })
    } catch {
      const list = demoAppointments().map((a) =>
        String(a.id) === String(id) ? { ...a, date, start_time: startTime, status: 'pending' as AppointmentStatus } : a,
      )
      saveDemoAppointments(list)
    }
  },
}
