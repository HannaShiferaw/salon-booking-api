import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'primary', children, className = '', ...rest }: Props) {
  const cls =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : variant === 'danger'
          ? 'inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50'
          : 'btn-ghost'
  return (
    <button type="button" className={`${cls} ${className}`} {...rest}>
      {children}
    </button>
  )
}
