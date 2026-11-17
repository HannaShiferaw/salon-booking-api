import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getStoredUser } from '../services/api'
import { authService } from '../services/authService'
import type { LoginPayload, RegisterPayload, User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If a real token exists, refresh the profile once; demo tokens skip this.
    const token = localStorage.getItem('blush_token')
    if (token && !token.startsWith('demo-') && !user) {
      setLoading(true)
      authService.me().then((u) => setUser(u)).finally(() => setLoading(false))
    }
  }, [user])

  const login = useCallback(async (payload: LoginPayload) => {
    const u = await authService.login(payload)
    setUser(u)
    return u
  }, [])
  const register = useCallback(async (payload: RegisterPayload) => {
    const u = await authService.register(payload)
    setUser(u)
    return u
  }, [])
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])
  const updateUser = useCallback((u: User) => setUser(u), [])

  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser }), [user, loading, login, register, logout, updateUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
