import { BookingWizard } from '../components/booking/BookingWizard'

export function Booking() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="section-title">Book an appointment</h1>
        <p className="section-sub mx-auto">Six simple steps — service, stylist, date, time, review, done.</p>
      </div>
      <BookingWizard />
    </div>
  )
}
