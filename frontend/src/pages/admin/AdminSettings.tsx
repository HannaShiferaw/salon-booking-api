import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { adminService } from '../../services/adminService'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Input } from '../../components/common/Input'
import { Spinner } from '../../components/common/Spinner'
import { useToast } from '../../hooks/useToast'
import { ToastList } from '../../components/common/Toast'
import type { SalonSettings } from '../../types'

const fallback: SalonSettings = { name: 'Blush Beauty Salon', phone: '+251 911 234 567', email: 'hello@blushsalon.com', address: 'Bole, Addis Ababa', opening_hours: 'Mon – Sat, 9:00 AM – 6:00 PM', open_time: '09:00', close_time: '18:00' }

export function AdminSettings() {
  const [settings, setSettings] = useState<SalonSettings>(fallback)
  const [loading, setLoading] = useState(true)
  const { toasts, push, dismiss } = useToast()

  useEffect(() => {
    adminService.settings().then(setSettings).finally(() => setLoading(false))
  }, [])

  async function save(e: FormEvent) {
    e.preventDefault()
    await adminService.saveSettings(settings)
    push('Settings saved.')
  }

  if (loading) return <Spinner label="Loading settings…" />
  return (
    <Card className="max-w-xl p-6">
      <h2 className="font-display text-xl font-semibold">Salon settings</h2>
      <form onSubmit={save} className="mt-4 space-y-4">
        <Input id="set-name" label="Salon name" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} required />
        <Input id="set-phone" label="Phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
        <Input id="set-email" label="Email" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
        <Input id="set-address" label="Address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="set-open" label="Opens at" type="time" value={settings.open_time} onChange={(e) => setSettings({ ...settings, open_time: e.target.value })} />
          <Input id="set-close" label="Closes at" type="time" value={settings.close_time} onChange={(e) => setSettings({ ...settings, close_time: e.target.value })} />
        </div>
        <Input id="set-hours" label="Opening hours text" value={settings.opening_hours} onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })} />
        <Button type="submit">Save settings</Button>
      </form>
      <ToastList toasts={toasts} dismiss={dismiss} />
    </Card>
  )
}
