import { api, setStoredUser, setToken } from './api'
import { demoAdmin, demoCustomer } from '../data/demoData'
import type { LoginPayload, RegisterPayload, User } from '../types'

interface AuthResponse {
  user: User
  token: string
}

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    try {
      const res = await api.post<AuthResponse>('/auth/login', payload)
      setToken(res.token)
      setStoredUser(res.user)
      return res.user
    } catch (err) {
      // Demo fallback so the Pages site is fully explorable without a backend.
      if (payload.email === demoAdmin.email && payload.password === demoAdmin.password) {
        const user: User = { id: 'demo-admin', full_name: 'Blush Admin', email: demoAdmin.email, role: 'admin' }
        setToken('demo-admin-token')
        setStoredUser(user)
        return user
      }
      if (payload.email === demoCustomer.email && payload.password === demoCustomer.password) {
        const user: User = { id: 'demo-customer', full_name: 'Demo Customer', email: demoCustomer.email, phone: '+251 911 000 000', role: 'customer' }
        setToken('demo-customer-token')
        setStoredUser(user)
        return user
      }
      throw err
    }
  },

  async register(payload: RegisterPayload): Promise<User> {
    const res = await api.post<AuthResponse>('/auth/register', payload)
    setToken(res.token)
    setStoredUser(res.user)
    return res.user
  },

  async me(): Promise<User | null> {
    try {
      return await api.get<User>('/auth/me')
    } catch {
      return null
    }
  },

  logout(): void {
    setToken(null)
    setStoredUser(null)
  },
}
