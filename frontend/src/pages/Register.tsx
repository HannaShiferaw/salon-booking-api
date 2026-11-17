import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/common/Spinner'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (fullName.trim().length < 2) return setError('Please enter your full name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.')
    if (phone.trim().length < 7) return setError('Please enter a valid phone number.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      await register({ full_name: fullName.trim(), email, phone, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. This email may already be registered — try logging in instead.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-ink-soft">Book faster, see your appointments and reschedule in seconds.</p>
        {error && <div className="mt-4"><Alert kind="error" message={error} /></div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input id="full_name" label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Hana Tesfaye" required />
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input id="phone" label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 911 234 567" required />
          <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
          <Input id="confirm" label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" required />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account? <Link to="/login" className="font-semibold text-blush-600 hover:underline">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
