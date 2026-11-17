import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'
import { appointmentService } from '../services/appointmentService'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatTime, isWithin24h, nextDays, todayISO } from '../utils/format'
import { formatDuration, formatPrice } from '../data/demoData'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Modal } from '../components/common/Modal'
import { StatusBadge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { EmptyState, Spinner } from '../components/common/Spinner'
import { useToast } from '../hooks/useToast'
import { ToastList } from '../components/common/Toast'
import type { Appointment } from '../types'

export function CustomerDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    appointmentService.myAppointments().then(setAppointments).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    if (!rescheduleTarget || !newDate) return
    appointmentService.slots(rescheduleTarget.staff_id ?? null, rescheduleTarget.service_id, newDate).then(setSlots).catch(() => setSlots([]))
  }, [rescheduleTarget, newDate])

  const upcoming = useMemo(
    () => appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show' && a.date >= todayISO()).sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`)),
    [appointments],
  )
  const history = useMemo(
    () => appointments.filter((a) => !upcoming.includes(a)).sort((a, b) => `${b.date} ${b.start_time}`.localeCompare(`${a.date} ${a.start_time}`)),
    [appointments, upcoming],
  )
  const shown = tab === 'upcoming' ? upcoming : history

  async function confirmCancel() {
    if (!cancelTarget) return
    await appointmentService.cancel(cancelTarget.id)
    setCancelTarget(null)
    push('Appointment cancelled.')
    load()
  }

  async function confirmReschedule() {
    if (!rescheduleTarget || !newDate || !newTime) return
    await appointmentService.reschedule(rescheduleTarget.id, newDate, newTime)
    setRescheduleTarget(null)
    push('Appointment rescheduled.')
    load()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Hello, {user?.full_name?.split(' ')[0] ?? 'beautiful'}</h1>
          <p className="section-sub">Your appointments, all in one place.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/profile" className="btn-secondary !py-2.5">Edit profile</Link>
          <Link to="/booking" className="btn-primary !py-2.5"><Calendar size={16} /> Book again</Link>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        {(['upcoming', 'history'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-blush-500 text-white' : 'border border-blush-200 bg-white text-ink-soft'}`}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading your appointments…" />
      ) : shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments yet'} message="Book your first visit — it only takes two minutes." />
          <div className="mt-4 text-center"><Link to="/booking" className="btn-primary">Book an Appointment</Link></div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {shown.map((a) => {
            const tooSoon = isWithin24h(a.date, a.start_time)
            const canChange = tab === 'upcoming' && a.status !== 'cancelled'
            return (
              <Card key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{a.service_name ?? 'Service'}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1"><Calendar size={15} /> {formatDate(a.date)}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={15} /> {formatTime(a.start_time)} · {formatDuration(a.duration_minutes ?? 60)}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">With {a.staff_name ?? 'No preference'} · {formatPrice(a.price ?? 0)}</p>
                  {canChange && tooSoon && <p className="mt-1 text-xs text-amber-700">This appointment is within 24 hours — please call the salon to change it.</p>}
                </div>
                {canChange && !tooSoon && (
                  <div className="flex gap-2">
                    <Button variant="secondary" className="!px-4 !py-2" onClick={() => { setRescheduleTarget(a); setNewDate(a.date); setNewTime('') }}>Reschedule</Button>
                    <Button variant="danger" className="!px-4 !py-2" onClick={() => setCancelTarget(a)}>Cancel</Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel this appointment?"
          message={`This will cancel your ${cancelTarget.service_name ?? 'appointment'} on ${formatDate(cancelTarget.date)} at ${formatTime(cancelTarget.start_time)}. You can always book again.`}
          confirmLabel="Yes, cancel it"
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {rescheduleTarget && (
        <Modal title="Reschedule appointment" onClose={() => setRescheduleTarget(null)}>
          <p className="text-sm text-ink-soft">{rescheduleTarget.service_name} with {rescheduleTarget.staff_name ?? 'No preference'}</p>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {nextDays(14).map((d) => (
              <button key={d} type="button" onClick={() => { setNewDate(d); setNewTime('') }} className={`rounded-lg border px-1 py-2 text-center text-xs ${newDate === d ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-200 hover:border-blush-400'}`}>
                {new Date(`${d}T12:00:00`).getDate()}<br />{new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {slots.map((t) => (
              <button key={t} type="button" onClick={() => setNewTime(t)} className={`rounded-lg border px-2 py-2 text-sm ${newTime === t ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-200 hover:border-blush-400'}`}>
                {formatTime(t)}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>Close</Button>
            <Button onClick={confirmReschedule} disabled={!newDate || !newTime}>Confirm new time</Button>
          </div>
        </Modal>
      )}
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
