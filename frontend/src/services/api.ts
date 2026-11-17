import { config } from '../config'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const TOKEN_KEY = 'blush_token'
const USER_KEY = 'blush_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
export function setStoredUser(user: unknown): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}
export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/** True once a request has failed because the backend cannot be reached. */
export let backendUnreachable = false
export function isDemoMode(): boolean {
  return backendUnreachable
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof Error && err.message.includes('Failed to fetch'))
}

/** Unwrap either { success, data } or a bare payload. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.headers) Object.assign(headers, init.headers as Record<string, string>)
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${config.apiUrl}${path}`, { ...init, headers })
  } catch (err) {
    if (isNetworkError(err)) backendUnreachable = true
    throw err
  }
  const text = await res.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }
  if (!res.ok) {
    const msg =
      (payload && typeof payload === 'object' && 'message' in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).message)
        : null) ??
      (payload && typeof payload === 'object' && 'error' in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).error)
        : null) ??
      `Request failed (${res.status})`
    throw new ApiError(res.status, msg)
  }
  return unwrap<T>(payload)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/** Quick probe used by pages to decide whether to show demo data. */
export async function probeBackend(): Promise<boolean> {
  try {
    await api.get<unknown>('/services')
    backendUnreachable = false
    return true
  } catch (err) {
    if (isNetworkError(err)) backendUnreachable = true
    return !backendUnreachable
  }
}
