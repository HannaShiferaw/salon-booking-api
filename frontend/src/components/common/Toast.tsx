import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { Toast as ToastItem } from '../../hooks/useToast'

export function ToastList({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-soft">
          {t.kind === 'success' ? <CheckCircle2 size={18} className="text-emerald-300" /> : t.kind === 'error' ? <XCircle size={18} className="text-red-300" /> : <Info size={18} className="text-blush-300" />}
          <span>{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="ml-2 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
