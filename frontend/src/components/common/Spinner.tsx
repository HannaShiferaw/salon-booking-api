export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blush-200 border-t-blush-500" />
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-blush-200 bg-blush-50 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
    </div>
  )
}

export function Alert({ kind, message }: { kind: 'error' | 'info' | 'success'; message: string }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blush-200 bg-blush-50 text-blush-700'
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{message}</div>
}
