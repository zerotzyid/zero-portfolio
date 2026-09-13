import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { SectionHead, Card, Field } from '../components/ui'
import { Reveal } from '../components/motion'
import { Spinner, Dots } from '../components/Loader'
import { useResource } from '../lib/useResource'
import { useLang } from '../lib/i18n'
import { Seo } from '../lib/seo'
import { enterUp, popIn, shakeX } from '../lib/anim'

export default function Contact() {
  const { s } = useLang()
  const profile = useResource<any>('/api/profile', {})
  const links = useResource<any[]>('/api/links', [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const headRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const p = profile.data

  useEffect(() => { enterUp(headRef.current) }, [])

  const send = async () => {
    if (!name.trim() || !message.trim()) {
      setDone(s.contact.needName); setOk(false); shakeX(formRef.current); return
    }
    setBusy(true); setDone(''); setOk(false)
    try {
      await api.post('/api/messages', { name: name.trim(), email: email.trim(), message: message.trim() })
      setDone(s.contact.sent); setOk(true); setName(''); setEmail(''); setMessage('')
      popIn(formRef.current)
    } catch (e: any) { setDone(s.contact.fail(e.message)); setOk(false); shakeX(formRef.current) }
    setBusy(false)
  }

  return (
    <div>
      <Seo path="/contact" title={`${s.contact.title} — ZeroTzy.ID`} description={s.contact.desc} />
      <div ref={headRef}>
        <SectionHead kicker={s.contact.kicker} title={s.contact.title} desc={s.contact.desc} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal className="space-y-4">
          <Card className="card-pad card-lift">
            <p className="field-label">{s.contact.email}</p>
            <a href={`mailto:${p.email || 'hello@zeroindonesia.eu.org'}`} className="break-all font-medium text-accent hover:underline">{p.email || 'hello@zeroindonesia.eu.org'}</a>
          </Card>
          {links.data.length > 0 && (
            <Card className="card-pad card-lift">
              <p className="field-label">{s.contact.links}</p>
              <div className="flex flex-col gap-2">
                {links.data.map((l: any) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">{l.label} →</a>
                ))}
              </div>
            </Card>
          )}
          <p className="meta">{s.contact.status(p.status || s.contact.statusDefault)}</p>
        </Reveal>
        <Reveal delay={120}>
          <Card className="card-pad">
            <div ref={formRef}>
              <p className="field-label">{s.contact.sendMsg}</p>
              <div className="space-y-3">
                <Field label={s.contact.name}><input className="input" placeholder={s.contact.namePh} value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label={s.contact.email}><input className="input" placeholder={s.contact.emailPh} inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label={s.contact.message}><textarea className="input min-h-[120px] resize-y" placeholder={s.contact.messagePh} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} /></Field>
                <button className="btn w-full sm:w-auto" disabled={busy} onClick={send}>
                  {busy ? <span className="flex items-center gap-2"><Spinner size={16} /> {s.contact.sending}<Dots /></span> : s.contact.send}
                </button>
                {done ? <p className={`text-xs font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>{done}</p> : null}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
