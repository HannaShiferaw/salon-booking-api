export type Role = 'customer' | 'admin'

export interface User {
  id: number | string
  full_name: string
  name?: string
  email: string
  phone?: string
  role: Role
}

export interface Service {
  id: number | string
  name: string
  description: string
  category: 'Hair' | 'Nails' | 'Beauty' | string
  price: number
  duration_minutes: number
  duration?: number
  is_active?: boolean
  active?: boolean
}

export interface Staff {
  id: number | string
  full_name: string
  name?: string
  role: string
  title?: string
  bio?: string
  image_url?: string
  service_ids?: Array<number | string>
  services?: Service[]
  is_active?: boolean
  active?: boolean
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: number | string
  customer_id?: number | string
  customer_name?: string
  customer?: User
  service_id: number | string
  service?: Service
  service_name?: string
  staff_id?: number | string | null
  staff?: Staff | null
  staff_name?: string | null
  date: string
  start_time: string
  time?: string
  end_time?: string
  duration_minutes?: number
  price?: number
  status: AppointmentStatus
  notes?: string
  created_at?: string
}

export interface BlockedDate {
  id: number | string
  date: string
  reason: string
  staff_id?: number | string | null
  staff_name?: string | null
  all_day?: boolean
}

export interface SalonSettings {
  name: string
  phone: string
  email: string
  address: string
  opening_hours: string
  open_time: string
  close_time: string
}

export interface AdminStats {
  today_appointments: number
  upcoming_appointments: number
  total_customers: number
  pending_appointments: number
  confirmed_appointments: number
  total_revenue?: number
}

export interface CustomerSummary {
  id: number | string
  full_name: string
  email: string
  phone?: string
  total_appointments?: number
  created_at?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  phone: string
  password: string
}

export interface BookingPayload {
  service_id: number | string
  staff_id?: number | string | null
  date: string
  start_time: string
  notes?: string
}
