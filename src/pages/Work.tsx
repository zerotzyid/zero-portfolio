import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHead, Card, Tags, StatusBadge, Empty } from '../components/ui'
import { CardSkeleton, Dots } from '../components/Loader'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { enterUp, staggerIn } from '../lib/anim'
import { Tilt } from '../components/motion'
import { projects as fallback } from '../data/projects'
import { Seo } from '../lib/seo'

export default function Work() {
  const { s } = useLang()
  const { data, loading } = useResource<any[]>('/api/projects', fallback)
  const rows = data.length ? data : (loading ? [] : fallback)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => rows.filter((p: any) => {
    const hitQ = !q || `${p.title} ${p.description} ${(p.tech || []).join(' ')}`.toLowerCase().includes(q.toLowerCase())
    const hitS = status === 'all' || p.status === status
    return hitQ && hitS
  }), [rows, q, status])

  useEffect(() => { enterUp(headRef.current) }, [])
  useEffect(() => { if (!loading) staggerIn(gridRef.current, '[data-item]', 55) }, [loading, filtered.length])

  return (
    <div>
      <Seo path="/work" title={`${s.work.title} — ZeroTzy.ID`} description={s.work.desc} />
      <div ref={headRef}>
        <SectionHead kicker={s.work.kicker} title={s.work.title} desc={s.work.desc} />
      </div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.work.searchPh} className="input sm:max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-48">
          <option value="all">{s.work.allStatus}</option>
          <option value="production">production</option>
          <option value="in-progress">in-progress</option>
          <option value="completed">completed</option>
          <option value="planned">planned</option>
        </select>
      </div>
      {loading ? (
        <div><p className="meta mb-3 flex items-center gap-2">{s.common.loading} <Dots /></p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div></div>
      ) : filtered.length === 0 ? <Empty text={s.work.empty} /> : (
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => (
            <Tilt key={p.id} max={6}>
            <Card data-item className="card-lift h-full overflow-hidden">
              {p.image ? <img src={p.image} alt={p.title} className="thumb" loading="lazy" /> : null}
              <div className="card-pad">
                <StatusBadge status={p.status} />
                <h3 className="mt-2 font-bold leading-snug">
                  <Link to={`/work/${encodeURIComponent(p.id)}`} className="hover:text-accent hover:underline">{p.title}</Link>
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{p.description}</p>
                <Tags items={p.tech || []} />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link to={`/work/${encodeURIComponent(p.id)}`} className="text-sm font-medium text-accent hover:underline">{s.work.detail}</Link>
                  {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-neutral-500 hover:text-accent hover:underline">{s.work.visit}</a> : null}
                </div>
              </div>
            </Card>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  )
}
