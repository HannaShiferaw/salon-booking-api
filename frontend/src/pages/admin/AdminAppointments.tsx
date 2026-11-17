import { useCallback, useEffect, useMemo, useState } from 'react'
import { appointmentService } from '../../services/appointmentService'
import { formatDate, formatTime } from '../../utils/format'
import { formatPrice } from '../../data/demoData'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Modal } from '../../components/common/Modal'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import { useToast } from '../../hooks/useToast'
import { ToastList } from '../../components/common/Toast'
import type { Appointment, AppointmentStatus } from '../../types'

const statuses: Array<AppointmentStatus | 'all'> = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']
const PAGE_SIZE = 10

export function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Appointment | null>(null)
  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    appointmentService.all().then(setAppointments).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return appointments.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (dateFilter && a.date !== dateFilter) return false
      if (q && !(a.customer_name ?? '').toLowerCase().includes(q) && !(a.service_name ?? '').toLowerCase().includes(q) && !(a.staff_name ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [appointments, search, status, dateFilter])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function setStatusOf(a: Appointment, s: AppointmentStatus) {
    await appointmentService.setStatus(a.id, s)
    push(`Appointment ${s}.`)
    setDetail(null)
    load()
  }

  if (loading) return <Spinner label="Loading appointments…" />
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search customer, service, stylist…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select className="input max-w-[180px]" value={status} onChange={(e) => { setStatus(e.target.value as AppointmentStatus | 'all'); setPage(1) }}>
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <input className="input max-w-[180px]" type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1) }} />
      </div>

      {shown.length === 0 ? (
        <div className="mt-6"><EmptyState title="No appointments found" message="Try a different search or filter." /></div>
      ) : (
        <Card className="mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-blush-100 text-ink-soft"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Date &amp; time</th><th className="px-4 py-3">Stylist</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} className="border-b border-blush-50 last:border-0 hover:bg-blush-50/50">
                  <td className="px-4 py-3 font-medium">{a.customer_name ?? '—'}</td>
                  <td className="px-4 py-3">{a.service_name}</td>
                  <td className="px-4 py-3">{formatDate(a.date)} · {formatTime(a.start_time)}</td>
                  <td className="px-4 py-3">{a.staff_name ?? 'No preference'}</td>
                  <td className="px-4 py-3">{formatPrice(a.price ?? 0)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><Button variant="ghost" className="!px-3 !py-1.5" onClick={() => setDetail(a)}>Details</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Button variant="secondary" className="!px-4 !py-2" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="secondary" className="!px-4 !py-2" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {detail && (
        <Modal title="Appointment details" onClose={() => setDetail(null)}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Customer</dt><dd className="font-semibold">{detail.customer_name ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Service</dt><dd className="font-semibold">{detail.service_name}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Stylist</dt><dd className="font-semibold">{detail.staff_name ?? 'No preference'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Date</dt><dd className="font-semibold">{formatDate(detail.date)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Time</dt><dd className="font-semibold">{formatTime(detail.start_time)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Price</dt><dd className="font-semibold">{formatPrice(detail.price ?? 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Status</dt><dd><StatusBadge status={detail.status} /></dd></div>
            {detail.notes && <p className="pt-2 text-ink-soft">Notes: {detail.notes}</p>}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="!px-4 !py-2" onClick={() => setStatusOf(detail, 'confirmed')}>Confirm</Button>
            <Button variant="secondary" className="!px-4 !py-2" onClick={() => setStatusOf(detail, 'completed')}>Complete</Button>
            <Button variant="secondary" className="!px-4 !py-2" onClick={() => setStatusOf(detail, 'no_show')}>No-show</Button>
            <Button variant="danger" className="!px-4 !py-2" onClick={() => setStatusOf(detail, 'cancelled')}>Cancel</Button>
          </div>
        </Modal>
      )}
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
