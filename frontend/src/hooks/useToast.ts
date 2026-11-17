import { useCallback, useState } from 'react'

export interface Toast {
  id: number
  message: string
  kind: 'success' | 'error' | 'info'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  return { toasts, push, dismiss }
}
