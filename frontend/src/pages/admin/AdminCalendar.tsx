import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { appointmentService } from '../../services/appointmentService'
import { formatTime } from '../../utils/format'
import { StatusBadge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { Spinner } from '../../components/common/Spinner'
import type { Appointment } from '../../types'

export function AdminCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(now.toISOString().slice(0, 10))

  useEffect(() => {
    appointmentService.all().then(setAppointments).finally(() => setLoading(false))
  }, [])

  const days = useMemo(() => {
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<string | null> = Array.from({ length: startPad }, () => null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    return cells
  }, [year, month])

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const list = map.get(a.date) ?? []
      list.push(a)
      map.set(a.date, list)
    }
    return map
  }, [appointments])

  const selectedList = (byDate.get(selected) ?? []).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  if (loading) return <Spinner label="Loading calendar…" />
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="rounded-full border border-blush-200 p-2 hover:bg-blush-50"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => shift(1)} aria-label="Next month" className="rounded-full border border-blush-200 p-2 hover:bg-blush-50"><ChevronRight size={18} /></button>
        </div>
      </div>
      <Card className="mt-4 p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} />
            const count = byDate.get(d)?.length ?? 0
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm transition ${selected === d ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-100 hover:border-blush-300'}`}
              >
                <span className="font-semibold">{Number(d.slice(-2))}</span>
                {count > 0 && <span className={`mt-0.5 rounded-full px-1.5 text-[10px] font-bold ${selected === d ? 'bg-white text-blush-600' : 'bg-blush-100 text-blush-700'}`}>{count} appt</span>}
              </button>
            )
          })}
        </div>
      </Card>
      <h3 className="mt-6 font-display text-lg font-semibold">Appointments on {selected}</h3>
      {selectedList.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">No appointments on this day.</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {selectedList.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{formatTime(a.start_time)} — {a.service_name}</p>
                <p className="text-sm text-ink-soft">{a.customer_name ?? 'Customer'} · {a.staff_name ?? 'No preference'}</p>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
