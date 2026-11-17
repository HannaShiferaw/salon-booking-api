import type { ReactNode } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { AdminLayout } from './components/layout/AdminLayout'
import { Home } from './pages/Home'
import { Services } from './pages/Services'
import { Booking } from './pages/Booking'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { Profile } from './pages/Profile'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminAppointments } from './pages/admin/AdminAppointments'
import { AdminCalendar } from './pages/admin/AdminCalendar'
import { AdminCustomers } from './pages/admin/AdminCustomers'
import { AdminServices } from './pages/admin/AdminServices'
import { AdminStaff } from './pages/admin/AdminStaff'
import { AdminAvailability } from './pages/admin/AdminAvailability'
import { AdminSettings } from './pages/admin/AdminSettings'

function Protected({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-soft">That page does not exist — but a relaxing visit does.</p>
      <a href="#/" className="btn-primary mt-6 inline-flex">Back to home</a>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Protected><CustomerDashboard /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/admin" element={<Protected adminOnly><AdminLayout /></Protected>}>
              <Route index element={<AdminDashboard />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="availability" element={<AdminAvailability />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
