import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { serviceService } from '../services/serviceService'
import { demoTestimonials, formatDuration, formatPrice } from '../data/demoData'
import { Spinner } from '../components/common/Spinner'
import type { Service } from '../types'

export function Home() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    serviceService.list().then((s) => setServices(s.slice(0, 6))).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blush-50 via-white to-blush-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-blush-600 shadow-card">
              <Sparkles size={14} /> Hair · Nails · Beauty
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Feel beautiful, <span className="text-blush-500">every single day.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">
              Expert stylists, gentle products and a calm, elegant space — all in the heart of Addis Ababa. Book your moment of care in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/booking" className="btn-primary"><Calendar size={18} /> Book an Appointment</Link>
              <Link to="/services" className="btn-secondary">Browse Services</Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-ink-soft">
              <span className="flex text-amber-400">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}</span>
              Loved by 500+ happy clients
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
                alt="Stylist working in a bright, elegant beauty salon"
                className="h-80 w-full object-cover sm:h-96"
                loading="lazy"
              />
            </div>
            <div className="card absolute -bottom-5 left-4 flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-600"><Clock size={20} /></span>
              <div>
                <p className="text-sm font-semibold">Open today until 6 PM</p>
                <p className="text-xs text-ink-soft">Mon – Sat · Walk-ins welcome</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="section-title">Our most-loved services</h2>
        <p className="section-sub">Everything is priced clearly, with no surprises. Choose a service and book in minutes.</p>
        {loading ? (
          <Spinner />
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.id} className="card group p-6 transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <span className="font-display text-xl font-bold text-blush-600">{formatPrice(s.price)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{s.description}</p>
                <p className="mt-3 text-xs font-medium text-ink-light">{s.category} · {formatDuration(s.duration_minutes)}</p>
                <Link to={`/booking?serviceId=${s.id}`} className="btn-secondary mt-5 w-full !py-2.5">Book Now</Link>
              </article>
            ))}
          </div>
        )}
        <div className="mt-8 text-center"><Link to="/services" className="btn-primary">See all services</Link></div>
      </section>

      {/* Why choose us */}
      <section className="bg-blush-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="section-title">Why women choose Blush</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Heart, title: 'Gentle, expert care', text: 'Our stylists and estheticians are trained, experienced and kind — your comfort comes first.' },
              { icon: ShieldCheck, title: 'Clean & safe', text: 'Sterilised tools, premium products and a spotless salon, every single day.' },
              { icon: Clock, title: 'On time, every time', text: 'Book online, get a confirmation, and start on time. No long waits, no confusion.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-100 text-blush-600"><Icon size={24} /></span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] shadow-soft">
          <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80" alt="Woman enjoying a relaxing beauty treatment" className="h-80 w-full object-cover sm:h-96" loading="lazy" />
        </div>
        <div>
          <h2 className="section-title">A little time, just for you</h2>
          <p className="section-sub">Step out of the busy day and into a calm, beautiful space. Soft music, warm tea, and stylists who listen — that is the Blush experience.</p>
          <ul className="mt-6 space-y-3 text-sm text-ink-soft">
            <li>✓ Free consultation before every colour or treatment</li>
            <li>✓ Premium, gentle products for sensitive skin and hair</li>
            <li>✓ Easy online booking, reminders and rescheduling</li>
          </ul>
          <div className="mt-8"><Link to="/booking" className="btn-primary">Book your visit</Link></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blush-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="section-title">What our clients say</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {demoTestimonials.map((t) => (
              <figure key={t.name} className="card p-6">
                <span className="flex text-amber-400">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={15} fill="currentColor" />)}</span>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name} <span className="font-normal text-ink-soft">· {t.service}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="section-title">Ready to feel your best?</h2>
        <p className="section-sub mx-auto">Pick a service, choose a time that suits you, and we will take care of the rest.</p>
        <div className="mt-8"><Link to="/booking" className="btn-primary">Book an Appointment</Link></div>
      </section>
    </div>
  )
}
