import { useEffect, useRef } from 'react'
import { SectionHead, Card, Tags, StatusBadge } from '../components/ui'
import { CardSkeleton, Skeleton } from '../components/Loader'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { Seo } from '../lib/seo'
import { animate } from 'animejs'
import { enterUp, staggerIn, reduced } from '../lib/anim'
import { Tilt } from '../components/motion'

const fallback = [
  { id: 'tunnel', title: 'Self-hosted tunnel', description: 'Cloudflare tunnel + Docker untuk expose service lokal dengan aman.', tech: ['Linux', 'Docker'], status: 'completed' },
  { id: 'llm', title: 'Local LLM', description: 'Ollama + Llama.cpp untuk inference lokal hemat resource.', tech: ['Python', 'Ollama'], status: 'in-progress' },
  { id: 'wasm', title: 'WebAssembly test', description: 'Prototipe komputasi berat di browser tanpa server.', tech: ['Rust', 'WASM'], status: 'planned' },
]

export default function Experiments() {
  const { s } = useLang()
  const { data, loading } = useResource<any[]>('/api/experiments', fallback)
  const rows = data.length ? data : (loading ? [] : fallback)
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => { enterUp(headRef.current) }, [])
  useEffect(() => { if (!loading) staggerIn(gridRef.current, '[data-item]', 80) }, [loading, rows.length])

  return (
    <div>
      <Seo path="/experiments" title={`${s.experiments.title} — ZeroTzy.ID`} description={s.experiments.desc} />
      <div ref={headRef}>
        <SectionHead kicker={s.experiments.kicker} title={s.experiments.title} desc={s.experiments.desc} />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((e: any) => (
            <Tilt key={e.id} max={6}>
            <Card data-item className="card-lift h-full overflow-hidden">
              {e.image ? <img src={e.image} alt={e.title} className="thumb" loading="lazy" /> : null}
              <div className="card-pad">
                <StatusBadge status={e.status || 'planned'} />
                <h3 className="mt-2 font-bold leading-snug">{e.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{e.description}</p>
                <Tags items={e.tech || []} />
              </div>
            </Card>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  )
}

/* animasi skill bars global: dipakai About via data-bar */
export function animateBars(root: HTMLElement | null) {
  if (!root || reduced()) {
    root?.querySelectorAll('[data-bar]').forEach((b) => { (b as HTMLElement).style.width = `${(b as HTMLElement).dataset.bar}%` })
    return
  }
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target as HTMLElement
        animate(el, { width: [`0%`, `${el.dataset.bar}%`], duration: 900, ease: 'outExpo' })
        io.unobserve(el)
      }
    })
  }, { threshold: 0.3 })
  root.querySelectorAll('[data-bar]').forEach((b) => io.observe(b))
  return () => io.disconnect()
}

export function AboutSkeleton() {
  return <div className="space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
}
