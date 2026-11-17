import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { appointmentService } from '../../services/appointmentService'
import { serviceService } from '../../services/serviceService'
import { staffService } from '../../services/staffService'
import { useAuth } from '../../context/AuthContext'
import { isDemoMode } from '../../services/api'
import { formatDate, formatTime, nextDays } from '../../utils/format'
import { formatDuration, formatPrice } from '../../data/demoData'
import { Alert } from '../common/Spinner'
import { Button } from '../common/Button'
import { Spinner } from '../common/Spinner'
import { EmptyState } from '../common/Spinner'
import type { Appointment, Service, Staff } from '../../types'

const steps = ['Service', 'Stylist', 'Date', 'Time', 'Review', 'Done']

export function BookingWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<Appointment | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const [serviceId, setServiceId] = useState<string>(params.get('serviceId') ?? '')
  const [staffId, setStaffId] = useState<string>('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const service = useMemo(() => services.find((s) => String(s.id) === serviceId), [services, serviceId])
  const selectedStaff = useMemo(() => staff.find((s) => String(s.id) === staffId) ?? null, [staff, staffId])
  const staffForService = useMemo(() => {
    if (!service) return staff
    return staff.filter((s) => !s.service_ids || s.service_ids.length === 0 || s.service_ids.map(String).includes(String(service.id)))
  }, [staff, service])

  useEffect(() => {
    Promise.all([serviceService.list(), staffService.list()])
      .then(([svcs, stf]) => {
        setServices(svcs)
        setStaff(stf)
        setDemoMode(isDemoMode())
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!date) return
    setSlotsLoading(true)
    appointmentService
      .slots(staffId ? staffId : null, serviceId, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [date, staffId, serviceId])

  async function confirmBooking() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/booking')}`)
      return
    }
    if (!service || !date || !time) return
    setSubmitting(true)
    setError('')
    try {
      const appt = await appointmentService.create(
        { service_id: serviceId, staff_id: staffId ? staffId : null, date, start_time: time, notes: notes || undefined },
        user.full_name,
      )
      setConfirmed(appt)
      setDemoMode(isDemoMode())
      setStep(6)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. That time may have just been taken — please pick another slot.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Loading services…" />
  if (services.length === 0) return <EmptyState title="No services available" message="Please check back soon — the salon is updating its service list." />

  return (
    <div className="mx-auto max-w-3xl">
      {demoMode && (
        <Alert kind="info" message="Demo mode — the backend is not connected yet, so this booking is saved on this device only. Connect the API to take real bookings." />
      )}
      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-between gap-1">
        {steps.map((label, i) => (
          <li key={label} className={`flex flex-1 flex-col items-center text-center ${i + 1 <= step ? 'text-blush-600' : 'text-ink-light'}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i + 1 < step ? 'bg-blush-500 text-white' : i + 1 === step ? 'bg-blush-500 text-white ring-4 ring-blush-100' : 'bg-blush-100'}`}>
              {i + 1 < step ? '✓' : i + 1}
            </span>
            <span className="mt-1 hidden text-xs font-medium sm:block">{label}</span>
          </li>
        ))}
      </ol>

      {error && <div className="mb-4"><Alert kind="error" message={error} /></div>}

      {step === 1 && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Choose a service</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setServiceId(String(s.id)); setStep(2) }}
                className={`card p-4 text-left transition hover:border-blush-400 hover:shadow-soft ${String(s.id) === serviceId ? 'border-blush-500 ring-2 ring-blush-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <span className="font-display text-lg font-bold text-blush-600">{formatPrice(s.price)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{s.description}</p>
                <p className="mt-2 text-xs font-medium text-ink-light">{s.category} · {formatDuration(s.duration_minutes)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Choose your stylist</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setStaffId(''); setStep(3) }} className="card p-4 text-left transition hover:border-blush-400 hover:shadow-soft">
              <p className="font-semibold">No preference</p>
              <p className="mt-1 text-sm text-ink-soft">We will match you with the best available stylist.</p>
            </button>
            {staffForService.map((s) => (
              <button key={s.id} type="button" onClick={() => { setStaffId(String(s.id)); setStep(3) }} className="card p-4 text-left transition hover:border-blush-400 hover:shadow-soft">
                <p className="font-semibold">{s.full_name}</p>
                <p className="text-sm text-blush-600">{s.role}</p>
                {s.bio && <p className="mt-1 text-sm text-ink-soft">{s.bio}</p>}
              </button>
            ))}
          </div>
          <div className="mt-6"><Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</Button></div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Choose a date</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {nextDays(30).map((d) => {
              const dt = new Date(`${d}T12:00:00`)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setDate(d); setTime(''); setStep(4) }}
                  className={`rounded-xl border px-2 py-3 text-center transition ${date === d ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-200 bg-white hover:border-blush-400'}`}
                >
                  <span className="block text-xs">{dt.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className="block font-display text-lg font-bold">{dt.getDate()}</span>
                  <span className="block text-xs">{dt.toLocaleDateString(undefined, { month: 'short' })}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-6"><Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</Button></div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Choose a time — {formatDate(date)}</h2>
          {slotsLoading ? (
            <Spinner label="Checking availability…" />
          ) : slots.length === 0 ? (
            <EmptyState title="No times available" message="This day is fully booked. Please choose another date." />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTime(t); setStep(5) }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${time === t ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-200 bg-white hover:border-blush-400'}`}
                >
                  {formatTime(t)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6"><Button variant="ghost" onClick={() => setStep(3)}><ChevronLeft size={16} /> Back</Button></div>
        </div>
      )}

      {step === 5 && service && (
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Review your booking</h2>
          <div className="card space-y-3 p-6">
            <ReviewRow label="Service" value={`${service.name} — ${formatDuration(service.duration_minutes)}`} />
            <ReviewRow label="Stylist" value={selectedStaff ? selectedStaff.full_name : 'No preference'} />
            <ReviewRow label="Date" value={formatDate(date)} />
            <ReviewRow label="Time" value={formatTime(time)} />
            <ReviewRow label="Price" value={formatPrice(service.price)} />
            <ReviewRow label="Name" value={user?.full_name ?? 'Please log in to confirm'} />
            <div>
              <label htmlFor="notes" className="label">Notes for your stylist (optional)</label>
              <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know? Allergies, inspiration photos, special occasion…" />
            </div>
          </div>
          {!user && <div className="mt-4"><Alert kind="info" message="You will be asked to log in or create an account to confirm." /></div>}
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(4)}><ChevronLeft size={16} /> Back</Button>
            <Button onClick={confirmBooking} disabled={submitting}>
              {submitting ? 'Booking…' : 'Confirm Appointment'} <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 6 && confirmed && (
        <div className="card p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h2 className="mt-4 font-display text-3xl font-semibold">You are booked in!</h2>
          <p className="mt-2 text-ink-soft">We cannot wait to see you, {user?.full_name?.split(' ')[0] ?? 'beautiful'}.</p>
          {demoMode && <div className="mx-auto mt-4 max-w-md text-left"><Alert kind="info" message="Demo mode — backend not connected yet. This booking is saved on this device only." /></div>}
          <div className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-blush-50 p-5 text-left text-sm">
            <ReviewRow label="Service" value={confirmed.service_name ?? service?.name ?? ''} />
            <ReviewRow label="Stylist" value={confirmed.staff_name ?? 'No preference'} />
            <ReviewRow label="Date" value={formatDate(confirmed.date)} />
            <ReviewRow label="Time" value={formatTime(confirmed.start_time)} />
            <ReviewRow label="Duration" value={formatDuration(confirmed.duration_minutes ?? service?.duration_minutes ?? 60)} />
            <ReviewRow label="Price" value={formatPrice(confirmed.price ?? service?.price ?? 0)} />
            <ReviewRow label="Status" value={confirmed.status} />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate('/dashboard')}>View my appointments</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Back to home</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-blush-100 pb-2 last:border-0 last:pb-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  )
}
