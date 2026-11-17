import { api } from './api'
import { demoStaff } from '../data/demoData'
import type { Staff } from '../types'

function normalise(s: Staff): Staff {
  return {
    ...s,
    full_name: s.full_name ?? s.name ?? '',
    role: s.role ?? s.title ?? 'Stylist',
    is_active: s.is_active ?? s.active ?? true,
    // Backend nests assigned services as `services: [{id, name, ...}]`.
    service_ids: s.service_ids ?? s.services?.map((sv) => sv.id) ?? [],
  }
}

function toBackend(body: Partial<Staff>): Record<string, unknown> {
  return {
    name: body.full_name ?? body.name ?? '',
    title: body.role ?? body.title ?? '',
    bio: body.bio ?? '',
    avatar_url: body.image_url ?? '',
    is_active: body.is_active ?? true,
  }
}

export const staffService = {
  async list(): Promise<Staff[]> {
    try {
      const data = await api.get<Staff[]>('/staff')
      return (Array.isArray(data) ? data : []).map(normalise).filter((s) => s.is_active !== false)
    } catch {
      return demoStaff
    }
  },
  async listAllAdmin(): Promise<Staff[]> {
    try {
      const data = await api.get<Staff[]>('/admin/staff')
      return (Array.isArray(data) ? data : []).map(normalise)
    } catch {
      return this.list()
    }
  },
  async create(body: Partial<Staff>): Promise<Staff> {
    const created = await api.post<Staff>('/admin/staff', toBackend(body))
    if (body.service_ids?.length) {
      try {
        await api.post(`/admin/staff/${created.id}/services`, { service_ids: body.service_ids })
      } catch {
        // Service assignment is best-effort; the staff member already exists.
      }
    }
    return normalise(created)
  },
  async update(id: number | string, body: Partial<Staff>): Promise<Staff> {
    const updated = await api.put<Staff>(`/admin/staff/${id}`, toBackend(body))
    if (body.service_ids) {
      try {
        await api.post(`/admin/staff/${id}/services`, { service_ids: body.service_ids })
      } catch {
        // Best-effort; the staff record itself was saved.
      }
    }
    return normalise(updated)
  },
  remove: (id: number | string) => api.del<void>(`/admin/staff/${id}`),
}
