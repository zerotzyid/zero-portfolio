import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Spinner } from '../components/Loader'
import { popIn, shakeX } from '../lib/anim'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const submit = async (e?: any) => {
    e?.preventDefault()
    if (!username.trim() || !password) { setErr('Isi username dan password.'); shakeX(cardRef.current); return }
    setBusy(true); setErr('')
    try {
      await login(username.trim(), password)
      nav('/admin')
    } catch (ex: any) { setErr(ex.message); shakeX(cardRef.current) }
    setBusy(false)
  }

  return (
    <div className="mx-auto w-full max-w-sm py-10 sm:py-16">
      <div ref={cardRef} className="card card-pad" onLoad={() => popIn(cardRef.current)}>
        <p className="meta">ADMIN LOGIN</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ZeroTzy.ID</h1>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Kredensial terenkripsi AES di browser
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <span className="field-label">Username</span>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Username" />
          </div>
          <div>
            <span className="field-label">Password</span>
            <div className="relative">
              <input className="input pr-12" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Password" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1 flex min-h-[36px] min-w-[36px] items-center justify-center text-neutral-400 hover:text-ink" aria-label="Tampil/password">
                {show ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>
          {err ? <p className="shake text-xs font-medium text-red-600">{err}</p> : null}
          <button className="btn w-full" disabled={busy}>
            {busy ? <span className="flex items-center gap-2"><Spinner size={16} /> Mengenkripsi & masuk...</span> : 'Masuk'}
          </button>
        </form>
        <Link to="/" className="mt-4 block text-center text-xs text-neutral-400 hover:text-ink">← Kembali ke portfolio</Link>
      </div>
    </div>
  )
}
