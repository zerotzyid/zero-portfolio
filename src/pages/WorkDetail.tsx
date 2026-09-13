import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Meta, Card, Tags, StatusBadge, Empty } from '../components/ui'
import { CardSkeleton } from '../components/Loader'
import { Reveal, SplitChars } from '../components/motion'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { enterUp } from '../lib/anim'
import { projects as fallback } from '../data/projects'
import { Seo } from '../lib/seo'

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>()
  const { s } = useLang()
  const headRef = useRef<HTMLDivElement>(null)
  const one = useResource<any>(`/api/projects/${encodeURIComponent(id || '__missing__')}`, null as any)
  const list = useResource<any[]>('/api/projects', [])
  useEffect(() => { enterUp(headRef.current) }, [])

  let item: any = one.data
  if (!item && !one.loading && list.data.length) item = list.data.find((p: any) => String(p.id) === String(id))
  if (!item && !one.loading && !list.loading) item = fallback.find((p: any) => String(p.id) === String(id))
  const busy = one.loading || (!item && list.loading)

  if (busy) {
    return (
      <div>
        <Link to="/work" className="text-sm font-medium text-accent hover:underline">{s.workDetail.back}</Link>
        <div className="mt-4 space-y-3"><CardSkeleton /></div>
      </div>
    )
  }
  if (!item) {
    return (
      <div className="py-10">
        <Link to="/work" className="text-sm font-medium text-accent hover:underline">{s.workDetail.back}</Link>
        <Empty text={s.workDetail.notFound} />
      </div>
    )
  }

  const others = (list.data.length ? list.data : fallback).filter((p: any) => String(p.id) !== String(id)).slice(0, 3)

  return (
    <div>
      <Seo
        path={`/work/${encodeURIComponent(String(id))}`}
        title={`${item.title} — ZeroTzy.ID`}
        description={item.description}
        image={item.image}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: item.title,
          description: item.description,
          image: item.image || undefined,
          keywords: (item.tech || []).join(', '),
        }}
      />
      <div ref={headRef}>
        <Meta>WORK / {item.title}</Meta>
        <h1 className="h-display mt-2">
          <SplitChars text={item.title} />
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status || 'production'} />
          {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">{s.workDetail.visit}</a> : null}
        </div>
      </div>
      <Reveal delay={120}>
        {item.image ? <img src={item.image} alt={item.title} className="card mt-6 max-h-[420px] w-full overflow-hidden rounded-xl object-cover" loading="lazy" /> : null}
        <Card className="card-pad mt-4">
          <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">{item.description}</p>
          <div className="mt-4">
            <p className="field-label">{s.workDetail.tech}</p>
            <Tags items={item.tech || []} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="field-label">{s.workDetail.status}:</span>
            <StatusBadge status={item.status || 'production'} />
          </div>
          <div className="mt-6">
            <Link to="/work" className="btn-outline">{s.workDetail.back}</Link>
          </div>
        </Card>
      </Reveal>
      {others.length > 0 && (
        <Reveal>
          <h2 className="h-section mb-3 mt-10">{s.home.featured}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o: any) => (
              <Card key={o.id} data-item className="card-lift overflow-hidden">
                {o.image ? <img src={o.image} alt={o.title} className="thumb" loading="lazy" /> : null}
                <div className="card-pad">
                  <h3 className="font-bold leading-snug">
                    <Link to={`/work/${encodeURIComponent(o.id)}`} className="hover:text-accent hover:underline">{o.title}</Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{o.description}</p>
                  <Link to={`/work/${encodeURIComponent(o.id)}`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">{s.work.detail}</Link>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}
