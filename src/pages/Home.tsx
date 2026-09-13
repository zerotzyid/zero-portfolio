import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Meta, Card, Tags } from '../components/ui'
import { CardSkeleton } from '../components/Loader'
import { Reveal, SplitChars, Magnetic, Tilt, Ripple } from '../components/motion'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { lineIn, staggerIn } from '../lib/anim'
import { projects as fallback } from '../data/projects'
import { Seo } from '../lib/seo'

export default function Home() {
  const { s } = useLang()
  const profile = useResource<any>('/api/profile', {})
  const feat = useResource<any[]>('/api/projects?featured=true', [])
  const items = feat.data.length ? feat.data : (feat.loading ? [] : fallback.filter((p) => p.featured))
  const p = profile.data
  const lineRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => { lineIn(lineRef.current) }, [])
  useEffect(() => { if (!feat.loading) staggerIn(gridRef.current) }, [feat.loading, items.length])

  return (
    <div>
      <Seo
        path="/"
        title={`${p.handle || 'ZeroTzy.ID'} — ${p.role || 'Developer / Builder'}`}
        description={p.bio || p.tagline || undefined}
      />
      <section className="py-6 sm:py-10">
        <Meta>{s.home.meta(p.handle || 'ZERO', p.role || 'DEVELOPER / BUILDER')}</Meta>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile.loading ? (
            <div className="skeleton h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
          ) : p.avatar ? (
            <img src={p.avatar} alt={p.name || 'avatar'} className="h-20 w-20 shrink-0 rounded-full border border-neutral-200 object-cover sm:h-24 sm:w-24" />
          ) : null}
          <div>
            <h1 className="h-display">
              <SplitChars text={s.home.hello(profile.loading ? '...' : (p.name || 'Zero'))} />
              <br />
              <SplitChars text={p.tagline || s.home.taglineDefault} delay={350} />
            </h1>
            <div ref={lineRef} className="mt-4 h-0.5 w-24 origin-left bg-accent" />
          </div>
        </div>
        <Reveal delay={150}>
          {p.bio ? <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">{p.bio}</p> : null}
          {(p.stack?.length) ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.stack.map((s: string) => <span key={s} className="tag font-mono">{s}</span>)}
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Magnetic><Link to="/work" className="btn relative overflow-hidden">{s.home.viewWork}<Ripple /></Link></Magnetic>
            <Magnetic><Link to="/contact" className="btn-outline relative overflow-hidden">{s.home.contactMe}<Ripple /></Link></Magnetic>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section className="mt-10 sm:mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="h-section">{s.home.featured}</h2>
            <Link to="/work" className="text-sm font-medium text-accent hover:underline">{s.home.viewAll}</Link>
          </div>
          {feat.loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it: any) => (
                <Tilt key={it.id} max={6}>
                <Card data-item className="card-lift h-full overflow-hidden">
                  {it.image ? <img src={it.image} alt={it.title} className="thumb" loading="lazy" /> : null}
                  <div className="card-pad">
                    <h3 className="font-bold leading-snug">
                      <Link to={`/work/${encodeURIComponent(it.id)}`} className="hover:text-accent hover:underline">{it.title}</Link>
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">{it.description}</p>
                    <Tags items={it.tech || []} />
                    <Link to={`/work/${encodeURIComponent(it.id)}`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">{s.work.detail}</Link>
                  </div>
                </Card>
                </Tilt>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  )
}
