import { useEffect, useMemo, useState } from 'react'
import { adminService } from '../../services/adminService'
import { appointmentService } from '../../services/appointmentService'
import { formatDate, formatTime } from '../../utils/format'
import { StatusBadge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { Modal } from '../../components/common/Modal'
import { Button } from '../../components/common/Button'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import type { Appointment, CustomerSummary } from '../../types'

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerSummary | null>(null)
  const [history, setHistory] = useState<Appointment[]>([])

  useEffect(() => {
    adminService.customers().then(setCustomers).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter((c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }, [customers, search])

  async function openHistory(c: CustomerSummary) {
    setSelected(c)
    const list = await adminService.customerAppointments(c.id)
    setHistory(list.length ? list.map((a) => ({ ...a, service_name: a.service_name ?? a.service?.name })) : (await appointmentService.all()).filter((a) => (a.customer_name ?? '').toLowerCase() === c.full_name.toLowerCase()))
  }

  if (loading) return <Spinner label="Loading customers…" />
  return (
    <div>
      <input className="input max-w-sm" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {filtered.length === 0 ? (
        <div className="mt-6"><EmptyState title="No customers found" message="Try a different search." /></div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{c.full_name}</p>
                <p className="text-sm text-ink-soft">{c.email}</p>
                {c.phone && <p className="text-sm text-ink-soft">{c.phone}</p>}
                <p className="mt-1 text-xs text-ink-light">{c.total_appointments ?? 0} appointment(s)</p>
              </div>
              <Button variant="secondary" className="!px-4 !py-2" onClick={() => openHistory(c)}>History</Button>
            </Card>
          ))}
        </div>
      )}
      {selected && (
        <Modal title={`${selected.full_name} — appointment history`} onClose={() => setSelected(null)}>
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">No appointments recorded for this customer yet.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-blush-50 px-4 py-3 text-sm">
                  <span>{a.service_name} · {formatDate(a.date)} {formatTime(a.start_time)}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}
