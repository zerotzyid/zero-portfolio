import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'

export function Meta({ children }: { children: ReactNode }) {
  return <p className="meta">{children}</p>
}

export function SectionHead({ kicker, title, desc, action }: { kicker: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      <Meta>{kicker}</Meta>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        {action}
      </div>
      {desc ? <p className="mt-2 max-w-2xl text-sm sm:text-base text-neutral-600">{desc}</p> : null}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function Tags({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((t) => <span key={t} className="tag">{t}</span>)}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    production: 'bg-green-50 text-green-800 border-green-200',
    'in-progress': 'bg-amber-50 text-amber-800 border-amber-200',
    completed: 'bg-green-50 text-green-800 border-green-200',
    planned: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }
  const cls = map[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
  return <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${cls}`}>{status}</span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="card card-pad text-center">
      <p className="text-sm text-neutral-500">{text}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function BackHome() {
  const { s } = useLang()
  return <div className="py-16 text-center"><h1 className="text-4xl font-extrabold">{s.common.notFoundTitle}</h1><p className="mt-2 text-neutral-500">{s.common.notFoundText}</p><Link to="/" className="btn mt-6">{s.common.back}</Link></div>
}
