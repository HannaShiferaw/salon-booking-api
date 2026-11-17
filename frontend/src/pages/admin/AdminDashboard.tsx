import { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Hourglass, CheckCircle2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { appointmentService } from '../../services/appointmentService'
import { formatDate, formatTime, todayISO } from '../../utils/format'
import { formatPrice } from '../../data/demoData'
import { Card } from '../../components/common/Card'
import { StatusBadge } from '../../components/common/Badge'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import type { AdminStats, Appointment } from '../../types'

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recent, setRecent] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminService.stats(), appointmentService.all()])
      .then(([s, appts]) => {
        setStats(s)
        setRecent(appts.filter((a) => a.date >= todayISO()).sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`)).slice(0, 6))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  const cards = [
    { label: "Today's appointments", value: stats?.today_appointments ?? 0, icon: Calendar },
    { label: 'Upcoming', value: stats?.upcoming_appointments ?? 0, icon: Clock },
    { label: 'Total customers', value: stats?.total_customers ?? 0, icon: Users },
    { label: 'Pending', value: stats?.pending_appointments ?? 0, icon: Hourglass },
    { label: 'Confirmed', value: stats?.confirmed_appointments ?? 0, icon: CheckCircle2 },
  ]
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-600"><Icon size={20} /></span>
            <p className="mt-3 font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-ink-soft">{label}</p>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 font-display text-xl font-semibold">Next appointments</h2>
      {recent.length === 0 ? (
        <div className="mt-4"><EmptyState title="No upcoming appointments" message="New bookings will appear here." /></div>
      ) : (
        <div className="mt-4 grid gap-3">
          {recent.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{a.service_name} — {a.customer_name ?? 'Customer'}</p>
                <p className="text-sm text-ink-soft">{formatDate(a.date)} · {formatTime(a.start_time)} · {a.staff_name ?? 'No preference'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatPrice(a.price ?? 0)}</span>
                <StatusBadge status={a.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
