import type { AppointmentStatus } from '../../types'

const styles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-rose-100 text-rose-700',
  'no_show': 'bg-gray-200 text-gray-700',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status === 'no_show' ? 'No-show' : status}
    </span>
  )
}

export function Badge({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`inline-flex rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-semibold text-blush-700 ${className}`}>{children}</span>
}
