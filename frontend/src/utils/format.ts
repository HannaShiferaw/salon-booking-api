export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function nextDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(i))
}

export function isPast(dateStr: string): boolean {
  return dateStr < todayISO()
}

export function isWithin24h(dateStr: string, time: string): boolean {
  const when = new Date(`${dateStr}T${time}:00`).getTime()
  return when - Date.now() < 24 * 60 * 60 * 1000
}
