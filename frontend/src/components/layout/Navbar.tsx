import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { config } from '../../config'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-blush-600' : 'text-ink-soft hover:text-blush-600'}`

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-blush-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-500 text-white">
            <Sparkles size={20} />
          </span>
          <span className="font-display text-xl font-bold text-ink">{config.salonName}</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={linkCls}>Home</NavLink>
          <NavLink to="/services" className={linkCls}>Services</NavLink>
          <NavLink to="/booking" className={linkCls}>Book Now</NavLink>
          {user && <NavLink to="/dashboard" className={linkCls}>My Appointments</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-ink-soft">Hi, {user.full_name.split(' ')[0]}</span>
              <button type="button" onClick={handleLogout} className="btn-ghost">Log out</button>
              <Link to="/booking" className="btn-primary !px-5 !py-2.5">Book an Appointment</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-secondary !px-5 !py-2.5">Sign up</Link>
              <Link to="/booking" className="btn-primary !px-5 !py-2.5">Book Now</Link>
            </>
          )}
        </div>
        <button type="button" className="rounded-lg p-2 text-ink md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-blush-100 px-4 py-3 md:hidden">
          <NavLink to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Home</NavLink>
          <NavLink to="/services" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Services</NavLink>
          <NavLink to="/booking" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Book Now</NavLink>
          {user && <NavLink to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">My Appointments</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Admin</NavLink>}
          {user ? (
            <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-blush-50">Log out</button>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Log in</NavLink>
              <NavLink to="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-blush-50">Sign up</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
