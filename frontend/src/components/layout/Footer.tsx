import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import { config } from '../../config'

export function Footer() {
  return (
    <footer className="bg-blush-50 text-sm text-ink-soft">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-500 text-white"><Sparkles size={18} /></span>
            <span className="font-display text-lg font-bold text-ink">{config.salonName}</span>
          </div>
          <p className="mt-3 max-w-xs">A calm, elegant space for hair, nails and beauty — where every visit leaves you feeling your best.</p>
        </div>
        <div>
          <h4 className="font-semibold text-ink">Visit us</h4>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2"><MapPin size={16} className="text-blush-500" />{config.salonAddress}</li>
            <li className="flex items-center gap-2"><Phone size={16} className="text-blush-500" />{config.salonPhone}</li>
            <li className="flex items-center gap-2"><Mail size={16} className="text-blush-500" />{config.salonEmail}</li>
            <li className="flex items-center gap-2"><Clock size={16} className="text-blush-500" />{config.openingHours}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-ink">Quick links</h4>
          <ul className="mt-3 space-y-2">
            <li><Link to="/services" className="hover:text-blush-600">Services &amp; prices</Link></li>
            <li><Link to="/booking" className="hover:text-blush-600">Book an appointment</Link></li>
            <li><Link to="/login" className="hover:text-blush-600">Log in</Link></li>
            <li><Link to="/register" className="hover:text-blush-600">Create an account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-blush-200 py-4 text-center text-xs">© {new Date().getFullYear()} {config.salonName}. All rights reserved.</div>
    </footer>
  )
}
