import { api } from './api'
import type { AdminStats, BlockedDate, CustomerSummary, SalonSettings } from '../types'

const DEMO_BLOCKED_KEY = 'blush_demo_blocked'

export const adminService = {
  async stats(): Promise<AdminStats> {
    try {
      return await api.get<AdminStats>('/admin/stats')
    } catch {
      return { today_appointments: 3, upcoming_appointments: 12, total_customers: 48, pending_appointments: 4, confirmed_appointments: 8 }
    }
  },
  async customers(): Promise<CustomerSummary[]> {
    try {
      const data = await api.get<CustomerSummary[] | { items: CustomerSummary[] }>('/admin/customers')
      return Array.isArray(data) ? data : data?.items ?? []
    } catch {
      return [
        { id: 1, full_name: 'Demo Customer', email: 'demo@blushsalon.com', phone: '+251 911 000 000', total_appointments: 2 },
        { id: 2, full_name: 'Hana G.', email: 'hana@example.com', phone: '+251 911 111 111', total_appointments: 5 },
        { id: 3, full_name: 'Sara M.', email: 'sara@example.com', phone: '+251 911 222 222', total_appointments: 3 },
      ]
    }
  },
  async customerAppointments(id: number | string): Promise<import('../types').Appointment[]> {
    try {
      const data = await api.get<import('../types').Appointment[]>(`/admin/customers/${id}/appointments`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },
  async blockedDates(): Promise<BlockedDate[]> {
    try {
      const data = await api.get<BlockedDate[]>('/admin/blocked-dates')
      return Array.isArray(data) ? data : []
    } catch {
      try {
        return JSON.parse(localStorage.getItem(DEMO_BLOCKED_KEY) ?? '[]') as BlockedDate[]
      } catch {
        return []
      }
    }
  },
  async addBlockedDate(body: Partial<BlockedDate>): Promise<BlockedDate> {
    try {
      return await api.post<BlockedDate>('/admin/blocked-dates', body)
    } catch {
      const list = await this.blockedDates()
      const item: BlockedDate = { id: `demo-${Date.now()}`, date: body.date ?? '', reason: body.reason ?? 'Closed', staff_id: body.staff_id ?? null }
      list.push(item)
      localStorage.setItem(DEMO_BLOCKED_KEY, JSON.stringify(list))
      return item
    }
  },
  async removeBlockedDate(id: number | string): Promise<void> {
    try {
      await api.del(`/admin/blocked-dates/${id}`)
    } catch {
      const list = (await this.blockedDates()).filter((b) => String(b.id) !== String(id))
      localStorage.setItem(DEMO_BLOCKED_KEY, JSON.stringify(list))
    }
  },
  async settings(): Promise<SalonSettings> {
    try {
      // Backend stores settings as a flat key/value map (salon_name, phone, ...).
      const m = await api.get<Record<string, string>>('/admin/settings')
      return {
        name: m.salon_name ?? m.name ?? 'Blush Beauty Salon',
        phone: m.phone ?? '+251 911 234 567',
        email: m.email ?? 'hello@blushsalon.com',
        address: m.address ?? 'Bole, Addis Ababa',
        opening_hours: m.opening_hours ?? 'Mon – Sat, 9:00 AM – 6:00 PM',
        open_time: m.open_time ?? '09:00',
        close_time: m.close_time ?? '18:00',
      }
    } catch {
      try {
        return JSON.parse(localStorage.getItem('blush_settings') ?? 'null') as SalonSettings
      } catch {
        return { name: 'Blush Beauty Salon', phone: '+251 911 234 567', email: 'hello@blushsalon.com', address: 'Bole, Addis Ababa', opening_hours: 'Mon – Sat, 9:00 AM – 6:00 PM', open_time: '09:00', close_time: '18:00' }
      }
    }
  },
  async saveSettings(body: SalonSettings): Promise<void> {
    try {
      await api.put('/admin/settings', {
        salon_name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        opening_hours: body.opening_hours,
        open_time: body.open_time,
        close_time: body.close_time,
      })
    } catch {
      localStorage.setItem('blush_settings', JSON.stringify(body))
    }
  },
}
