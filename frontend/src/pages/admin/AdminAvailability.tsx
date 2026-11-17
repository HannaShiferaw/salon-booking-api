import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { adminService } from '../../services/adminService'
import { staffService } from '../../services/staffService'
import { formatDate } from '../../utils/format'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import { useToast } from '../../hooks/useToast'
import { ToastList } from '../../components/common/Toast'
import type { BlockedDate, Staff } from '../../types'

export function AdminAvailability() {
  const [blocked, setBlocked] = useState<BlockedDate[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [staffId, setStaffId] = useState('')
  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([adminService.blockedDates(), staffService.list()]).then(([b, s]) => { setBlocked(b); setStaff(s) }).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function addBlocked(e: FormEvent) {
    e.preventDefault()
    if (!date) return
    await adminService.addBlockedDate({ date, reason: reason || 'Closed', staff_id: staffId ? staffId : null })
    push('Date blocked — customers can no longer book it.')
    setDate(''); setReason(''); setStaffId('')
    load()
  }

  async function removeBlocked(id: number | string) {
    await adminService.removeBlockedDate(id)
    push('Block removed.')
    load()
  }

  if (loading) return <Spinner label="Loading availability…" />
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">Salon working hours</h2>
        <p className="mt-2 text-sm text-ink-soft">Monday – Saturday, 9:00 AM – 6:00 PM. Sunday closed.</p>
        <p className="mt-2 text-sm text-ink-soft">Staff follow the same hours by default. Change the salon hours in Settings — the booking system uses them to generate time slots.</p>
        <h3 className="mt-6 font-display text-lg font-semibold">Block a date</h3>
        <form onSubmit={addBlocked} className="mt-3 space-y-3">
          <div>
            <label htmlFor="block-date" className="label">Date</label>
            <input id="block-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="block-reason" className="label">Reason</label>
            <input id="block-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Public holiday" />
          </div>
          <div>
            <label htmlFor="block-staff" className="label">Applies to</label>
            <select id="block-staff" className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Whole salon (all staff)</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} only</option>)}
            </select>
          </div>
          <Button type="submit">Block this date</Button>
        </form>
      </Card>
      <div>
        <h2 className="font-display text-xl font-semibold">Blocked dates</h2>
        {blocked.length === 0 ? (
          <div className="mt-4"><EmptyState title="No blocked dates" message="Holidays and days off will appear here." /></div>
        ) : (
          <div className="mt-4 grid gap-3">
            {blocked.map((b) => (
              <Card key={b.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{formatDate(b.date)}</p>
                  <p className="text-sm text-ink-soft">{b.reason}{b.staff_name ? ` · ${b.staff_name} only` : ' · Whole salon'}</p>
                </div>
                <Button variant="danger" className="!px-3 !py-1.5" onClick={() => removeBlocked(b.id)}>Unblock</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
