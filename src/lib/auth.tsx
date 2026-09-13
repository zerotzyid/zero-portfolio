import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { encryptLogin } from './aes'

const KEY = 'zp_session'

type AuthCtx = {
  user: string | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, ready: false, login: async () => {}, logout: async () => {} })
export const useAuth = () => useContext(Ctx)
export const getToken = () => localStorage.getItem(KEY) || ''

async function jget(path: string) {
  const r = await fetch(path, { headers: authHeader() })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
  return j.data
}

export function authHeader(): Record<string, string> {
  const t = getToken()
  const legacy = localStorage.getItem('zp_admin_token')
  const h: Record<string, string> = {}
  if (t) h['Authorization'] = `Bearer ${t}`
  else if (legacy) h['x-admin-token'] = legacy
  return h
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    jget('/api/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem(KEY)).finally(() => setReady(true))
  }, [])

  const login = async (username: string, password: string) => {
    // 1. ambil challenge, 2. enkripsi AES di browser, 3. kirim ciphertext saja
    const c = await (await fetch('/api/auth/challenge')).json()
    const challenge = c?.data?.challenge
    if (!challenge) throw new Error('Gagal ambil challenge')
    const { iv, ct } = await encryptLogin(password, challenge, username)
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, iv, ct, challenge }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || 'Login gagal')
    localStorage.setItem(KEY, j.data.token)
    setUser(j.data.user)
  }

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: authHeader() }) } catch {}
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>
}
