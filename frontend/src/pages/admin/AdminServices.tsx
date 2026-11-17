import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { serviceService } from '../../services/serviceService'
import { formatDuration, formatPrice } from '../../data/demoData'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import { useToast } from '../../hooks/useToast'
import { ToastList } from '../../components/common/Toast'
import type { Service } from '../../types'

const emptyForm = { name: '', description: '', category: 'Hair', price: 30, duration_minutes: 45, is_active: true }

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleting, setDeleting] = useState<Service | null>(null)
  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    serviceService.listAllAdmin().then(setServices).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  function openCreate() { setForm(emptyForm); setCreating(true) }
  function openEdit(s: Service) {
    setForm({ name: s.name, description: s.description, category: s.category, price: s.price, duration_minutes: s.duration_minutes, is_active: s.is_active ?? true })
    setEditing(s)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    try {
      if (editing) await serviceService.update(editing.id, form)
      else await serviceService.create(form)
      push(editing ? 'Service updated.' : 'Service created.')
      setEditing(null); setCreating(false); load()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not save service.', 'error')
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try { await serviceService.remove(deleting.id); push('Service deleted.') } catch { push('Could not delete service.', 'error') }
    setDeleting(null); load()
  }

  if (loading) return <Spinner label="Loading services…" />
  return (
    <div>
      <div className="flex justify-end"><Button onClick={openCreate}>+ Add service</Button></div>
      {services.length === 0 ? (
        <div className="mt-6"><EmptyState title="No services yet" message="Add your first service to start taking bookings." /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{s.name}</h3>
                <span className="font-display text-lg font-bold text-blush-600">{formatPrice(s.price)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{s.description}</p>
              <p className="mt-2 text-xs text-ink-light">{s.category} · {formatDuration(s.duration_minutes)}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={s.is_active ? '' : 'bg-gray-200 text-gray-600'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                <div className="ml-auto flex gap-2">
                  <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => openEdit(s)}>Edit</Button>
                  <Button variant="danger" className="!px-3 !py-1.5" onClick={() => setDeleting(s)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <Modal title={editing ? 'Edit service' : 'Add service'} onClose={() => { setEditing(null); setCreating(false) }}>
          <form onSubmit={save} className="space-y-4">
            <Input id="svc-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div>
              <label htmlFor="svc-desc" className="label">Description</label>
              <textarea id="svc-desc" className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="svc-cat" className="label">Category</label>
                <select id="svc-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Hair</option><option>Nails</option><option>Beauty</option>
                </select>
              </div>
              <Input id="svc-price" label="Price ($)" type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            </div>
            <Input id="svc-duration" label="Duration (minutes)" type="number" min={15} step={15} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} required />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (visible to customers)</label>
            <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => { setEditing(null); setCreating(false) }}>Cancel</Button><Button type="submit">Save service</Button></div>
          </form>
        </Modal>
      )}
      {deleting && <ConfirmDialog title="Delete this service?" message={`“${deleting.name}” will be removed. Existing appointments for it are not affected.`} confirmLabel="Delete service" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
