import { api } from './api'
import { demoServices } from '../data/demoData'
import type { Service } from '../types'

function normalise(s: Service): Service {
  // Backend stores categories lowercase (hair/nails/beauty/skin); UI shows
  // Hair / Nails / Beauty (skin services group under Beauty).
  const raw = (s.category ?? '').toLowerCase()
  const category = raw === 'hair' ? 'Hair' : raw === 'nails' ? 'Nails' : 'Beauty'
  return {
    ...s,
    category,
    duration_minutes: s.duration_minutes ?? s.duration ?? 60,
    is_active: s.is_active ?? s.active ?? true,
  }
}

export const serviceService = {
  async list(): Promise<Service[]> {
    try {
      const data = await api.get<Service[]>('/services')
      return (Array.isArray(data) ? data : []).map(normalise).filter((s) => s.is_active !== false)
    } catch {
      return demoServices
    }
  },
  async listAllAdmin(): Promise<Service[]> {
    try {
      const data = await api.get<Service[]>('/admin/services')
      return (Array.isArray(data) ? data : []).map(normalise)
    } catch {
      try {
        const data = await api.get<Service[]>('/services')
        return (Array.isArray(data) ? data : []).map(normalise)
      } catch {
        return demoServices
      }
    }
  },
  create: (body: Partial<Service>) => api.post<Service>('/admin/services', body),
  update: (id: number | string, body: Partial<Service>) => api.put<Service>(`/admin/services/${id}`, body),
  remove: (id: number | string) => api.del<void>(`/admin/services/${id}`),
}
