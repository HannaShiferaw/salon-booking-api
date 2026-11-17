import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { staffService } from '../../services/staffService'
import { serviceService } from '../../services/serviceService'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { EmptyState, Spinner } from '../../components/common/Spinner'
import { useToast } from '../../hooks/useToast'
import { ToastList } from '../../components/common/Toast'
import type { Service, Staff } from '../../types'

export function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ full_name: '', role: '', bio: '', service_ids: [] as Array<number | string>, is_active: true })
  const [deleting, setDeleting] = useState<Staff | null>(null)
  const { toasts, push, dismiss } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([staffService.listAllAdmin(), serviceService.listAllAdmin()]).then(([s, svcs]) => { setStaff(s); setServices(svcs) }).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  function openCreate() { setForm({ full_name: '', role: '', bio: '', service_ids: [], is_active: true }); setCreating(true) }
  function openEdit(s: Staff) {
    setForm({ full_name: s.full_name, role: s.role, bio: s.bio ?? '', service_ids: s.service_ids ?? [], is_active: s.is_active ?? true })
    setEditing(s)
  }
  function toggleService(id: number | string) {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.map(String).includes(String(id))
        ? f.service_ids.filter((x) => String(x) !== String(id))
        : [...f.service_ids, id],
    }))
  }
  async function save(e: FormEvent) {
    e.preventDefault()
    try {
      if (editing) await staffService.update(editing.id, form)
      else await staffService.create(form)
      push(editing ? 'Staff member updated.' : 'Staff member added.')
      setEditing(null); setCreating(false); load()
    } catch (err) { push(err instanceof Error ? err.message : 'Could not save staff member.', 'error') }
  }
  async function confirmDelete() {
    if (!deleting) return
    try { await staffService.remove(deleting.id); push('Staff member removed.') } catch { push('Could not remove staff member.', 'error') }
    setDeleting(null); load()
  }

  if (loading) return <Spinner label="Loading staff…" />
  return (
    <div>
      <div className="flex justify-end"><Button onClick={openCreate}>+ Add staff member</Button></div>
      {staff.length === 0 ? (
        <div className="mt-6"><EmptyState title="No staff yet" message="Add your first stylist to start taking bookings." /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {staff.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-100 font-display text-lg font-bold text-blush-600">{s.full_name.charAt(0)}</span>
                <div>
                  <h3 className="font-semibold">{s.full_name}</h3>
                  <p className="text-sm text-blush-600">{s.role}</p>
                </div>
                <Badge className={`ml-auto ${s.is_active ? '' : 'bg-gray-200 text-gray-600'}`}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              {s.bio && <p className="mt-3 text-sm text-ink-soft">{s.bio}</p>}
              <p className="mt-2 text-xs text-ink-light">Services: {(s.service_ids ?? []).map((id) => services.find((sv) => String(sv.id) === String(id))?.name).filter(Boolean).join(', ') || 'All services'}</p>
              <p className="mt-1 text-xs text-ink-light">Working hours: Mon – Sat, 9:00 AM – 6:00 PM</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => openEdit(s)}>Edit</Button>
                <Button variant="danger" className="!px-3 !py-1.5" onClick={() => setDeleting(s)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <Modal title={editing ? 'Edit staff member' : 'Add staff member'} onClose={() => { setEditing(null); setCreating(false) }}>
          <form onSubmit={save} className="space-y-4">
            <Input id="staff-name" label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input id="staff-role" label="Role / title" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Hair Stylist" required />
            <div>
              <label htmlFor="staff-bio" className="label">Short bio</label>
              <textarea id="staff-bio" className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div>
              <span className="label">Services they can perform</span>
              <div className="flex flex-wrap gap-2">
                {services.map((sv) => (
                  <button key={sv.id} type="button" onClick={() => toggleService(sv.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${form.service_ids.map(String).includes(String(sv.id)) ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-200 hover:border-blush-400'}`}>
                    {sv.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (bookable)</label>
            <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => { setEditing(null); setCreating(false) }}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
      {deleting && <ConfirmDialog title="Remove this staff member?" message={`${deleting.full_name} will no longer be bookable. Existing appointments are not affected.`} confirmLabel="Remove" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
