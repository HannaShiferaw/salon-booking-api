import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { setStoredUser } from '../services/api'
import { Alert } from '../components/common/Spinner'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { useToast } from '../hooks/useToast'
import { ToastList } from '../components/common/Toast'

export function Profile() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState('')
  const { toasts, push, dismiss } = useToast()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (fullName.trim().length < 2) return setError('Please enter your full name.')
    if (phone.trim().length < 7) return setError('Please enter a valid phone number.')
    if (!user) return
    const updated = { ...user, full_name: fullName.trim(), phone: phone.trim() }
    setStoredUser(updated)
    updateUser(updated)
    push('Profile updated.')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-ink-soft">Update your name and phone number. Your email cannot be changed here — please contact the salon.</p>
        {error && <div className="mt-4"><Alert kind="error" message={error} /></div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input id="full_name" label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input id="email" label="Email" type="email" value={user?.email ?? ''} disabled />
          <Input id="phone" label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Card>
      <ToastList toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
