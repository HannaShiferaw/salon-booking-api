import { NavLink, Outlet } from 'react-router-dom'
import { Calendar, Clock, Home, LayoutDashboard, Settings, Users, Scissors, UserCog } from 'lucide-react'

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { to: '/admin/calendar', label: 'Calendar', icon: Clock },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
  { to: '/admin/availability', label: 'Availability', icon: Clock },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title text-2xl sm:text-3xl">Admin Dashboard</h1>
        <NavLink to="/" className="btn-ghost text-sm"><Home size={16} /> Back to website</NavLink>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <nav className="card flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blush-500 text-white' : 'text-ink-soft hover:bg-blush-50'}`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
