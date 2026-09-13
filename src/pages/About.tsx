import { useEffect, useRef } from 'react'
import { SectionHead, Card } from '../components/ui'
import { Reveal, SplitChars } from '../components/motion'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { Seo } from '../lib/seo'
import { enterUp, staggerIn } from '../lib/anim'
import { animateBars } from './Experiments'

const LEVEL_PCT: Record<string, number> = { beginner: 35, intermediate: 65, advanced: 90 }

export default function About() {
  const { s } = useLang()
  const profile = useResource<any>('/api/profile', {})
  const skills = useResource<any[]>('/api/skills', [])
  const exp = useResource<any[]>('/api/experience', [])
  const p = profile.data
  const headRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const skillRef = useRef<HTMLDivElement>(null)
  const expRef = useRef<HTMLDivElement>(null)

  const stack: string[] = p.stack || ['Linux', 'Nginx', 'Docker', 'TypeScript', 'React', 'Python', 'Bash']
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { enterUp(headRef.current) }, [])
  useEffect(() => { staggerIn(stackRef.current, '[data-item]', 40) }, [stack.length])
  useEffect(() => { if (!skills.loading) staggerIn(skillRef.current, '[data-item]', 70) }, [skills.loading, skills.data.length])
  useEffect(() => { if (!exp.loading) staggerIn(expRef.current, '[data-item]', 90) }, [exp.loading, exp.data.length])
  useEffect(() => animateBars(rootRef.current), [skills.loading, skills.data.length])

  return (
    <div ref={rootRef}>
      <Seo path="/about" title={`${s.about.title} — ZeroTzy.ID`} />
      <div ref={headRef}>
        <SectionHead kicker={s.about.kicker} title={s.about.title} />
      </div>
      <Reveal>
        <Card className="card-pad">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {p.avatar ? <img src={p.avatar} alt={p.name} className="h-20 w-20 shrink-0 rounded-full border border-neutral-200 object-cover" /> : null}
            <div>
              <h3 className="text-lg font-bold">
                <SplitChars text={`${p.name || 'Zero'} (${p.handle || 'ZeroTzy.ID'})`} />
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">{p.bio || s.about.bioDefault}</p>
              {p.location ? <p className="meta mt-2">{p.location}</p> : null}
            </div>
          </div>
        </Card>
      </Reveal>
      <Reveal>
        <h2 className="h-section mb-3 mt-8">{s.about.stack}</h2>
        <div ref={stackRef} className="flex flex-wrap gap-1.5">
          {stack.map((t) => <span key={t} data-item className="tag font-mono">{t}</span>)}
        </div>
      </Reveal>
      {skills.data.length > 0 && (
        <Reveal>
          <h2 className="h-section mb-3 mt-8">{s.about.skills}</h2>
          <div ref={skillRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {skills.data.map((sk: any) => (
              <Card key={sk.id} data-item className="card-pad card-lift">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{sk.name}</strong>
                  <span className="tag font-mono">{sk.level}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-neutral-100">
                  <div data-bar={LEVEL_PCT[sk.level] || 50} className="h-full w-0 bg-ink" />
                </div>
                {sk.group ? <p className="meta mt-1">{sk.group}</p> : null}
              </Card>
            ))}
          </div>
        </Reveal>
      )}
      {exp.data.length > 0 && (
        <Reveal>
          <h2 className="h-section mb-3 mt-8">{s.about.experience}</h2>
          <div ref={expRef} className="space-y-3">
            {exp.data.map((e: any) => (
              <Card key={e.id} data-item className="card-pad card-lift">
                <h3 className="font-bold">{e.role} <span className="font-normal text-neutral-500">— {e.org}</span></h3>
                <p className="meta mt-0.5">{e.period}</p>
                <p className="mt-1 text-sm text-neutral-600">{e.description}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}

/* animasi skill bars global: dipakai About via data-bar */
export function SkillBars() { return null }
