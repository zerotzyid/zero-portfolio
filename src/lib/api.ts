import { authHeader } from './auth'

const BASE = ''

async function req(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { ...authHeader(), ...(opts.headers as any) }
  if (opts.body && typeof opts.body === 'string' && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const r = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (r.status === 401 && path.startsWith('/api/') && !path.startsWith('/api/auth')) {
    localStorage.removeItem('zp_session')
    if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') location.href = '/admin/login'
  }
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
  return j.data !== undefined ? j.data : j
}

export const api = {
  get: (p: string) => req(p),
  post: (p: string, body: any) => req(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p: string, body: any) => req(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p: string) => req(p, { method: 'DELETE' }),
  upload: async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/upload', { method: 'POST', headers: authHeader(), body: fd })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j?.success) throw new Error(j?.error || 'Upload gagal')
    return j.data as { url: string; fileName: string }
  },
}
