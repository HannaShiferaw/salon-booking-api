import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { serviceService } from '../services/serviceService'
import { formatDuration, formatPrice } from '../data/demoData'
import { EmptyState, Spinner } from '../components/common/Spinner'
import type { Service } from '../types'

const categories = ['All', 'Hair', 'Nails', 'Beauty']

export function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    serviceService.list().then(setServices).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (category === 'All' ? services : services.filter((s) => s.category === category)),
    [services, category],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="section-title">Services &amp; prices</h1>
      <p className="section-sub">Clear prices, honest durations, no surprises. Tap “Book Now” on any service to reserve your time.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${category === c ? 'bg-blush-500 text-white shadow-soft' : 'border border-blush-200 bg-white text-ink-soft hover:border-blush-400'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading services…" />
      ) : filtered.length === 0 ? (
        <div className="mt-8"><EmptyState title="No services in this category" message="Try another category, or check back soon." /></div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <article key={s.id} className="card flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{s.name}</h2>
                <span className="font-display text-xl font-bold text-blush-600">{formatPrice(s.price)}</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{s.description}</p>
              <p className="mt-3 text-xs font-medium text-ink-light">{s.category} · {formatDuration(s.duration_minutes)}</p>
              <Link to={`/booking?serviceId=${s.id}`} className="btn-primary mt-5 w-full !py-2.5">Book Now</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
