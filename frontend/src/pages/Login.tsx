import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/common/Spinner'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setSubmitting(true)
    try {
      const user = await login({ email, password })
      const next = params.get('next')
      if (next) navigate(next)
      else navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-soft">Log in to view and manage your appointments.</p>
        {error && <div className="mt-4"><Alert kind="error" message={error} /></div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Logging in…' : 'Log in'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          New here? <Link to="/register" className="font-semibold text-blush-600 hover:underline">Create an account</Link>
        </p>
        <div className="mt-6 rounded-xl bg-blush-50 p-4 text-xs text-ink-soft">
          <p className="font-semibold text-ink">Demo accounts (work without a backend)</p>
          <p className="mt-1">Admin: admin@blushsalon.com / Admin123!</p>
          <p>Customer: demo@blushsalon.com / Demo123!</p>
        </div>
      </Card>
    </div>
  )
}
