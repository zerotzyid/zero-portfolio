import { useState } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { useAuth } from '../lib/auth'
import Upload from '../components/Upload'
import { Field } from '../components/ui'
import { Spinner, Skeleton } from '../components/Loader'

type FieldDef = { key: string; label: string; type: 'text' | 'textarea' | 'select' | 'upload' | 'bool' | 'csv'; options?: string[]; placeholder?: string }
type CollDef = { key: string; label: string; schema: FieldDef[]; titleOf: (d: any) => string }

const STATUS = ['production', 'in-progress', 'completed', 'planned']

const COLLS: CollDef[] = [
  { key: 'projects', label: 'Projects', titleOf: (d) => d.title || d.id,
    schema: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'tech', label: 'Tech (koma)', type: 'csv', placeholder: 'React, TypeScript, Docker' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS },
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' },
      { key: 'image', label: 'Gambar', type: 'upload' },
      { key: 'featured', label: 'Featured', type: 'bool' },
    ] },
  { key: 'experiments', label: 'Experiments', titleOf: (d) => d.title || d.id,
    schema: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'tech', label: 'Tech (koma)', type: 'csv' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS },
      { key: 'image', label: 'Gambar', type: 'upload' },
    ] },
  { key: 'skills', label: 'Skills', titleOf: (d) => d.name || d.id,
    schema: [
      { key: 'name', label: 'Nama', type: 'text' },
      { key: 'level', label: 'Level', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
      { key: 'group', label: 'Grup', type: 'text', placeholder: 'web / infra' },
    ] },
  { key: 'experience', label: 'Experience', titleOf: (d) => `${d.role || ''} — ${d.org || ''}`,
    schema: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'org', label: 'Organisasi', type: 'text' },
      { key: 'period', label: 'Periode', type: 'text', placeholder: '2024 — now' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
    ] },
  { key: 'links', label: 'Links', titleOf: (d) => d.label || d.id,
    schema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'url', label: 'URL', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'text', placeholder: 'github / mail / ...' },
    ] },
]

const TABS = ['dashboard', 'site', 'profile', ...COLLS.map((c) => c.key), 'pesan', 'uploads', 'backup']
const TAB_LABEL: Record<string, string> = { dashboard: 'Dashboard', site: 'Site', profile: 'Profile', pesan: 'Pesan', uploads: 'Uploads', backup: 'Backup' }
for (const c of COLLS) TAB_LABEL[c.key] = c.label

function toForm(schema: FieldDef[], doc: any) {
  const f: Record<string, any> = {}
  for (const s of schema) {
    const v = doc?.[s.key]
    f[s.key] = s.type === 'csv' ? (Array.isArray(v) ? v.join(', ') : (v || '')) : (v ?? (s.type === 'bool' ? false : ''))
  }
  return f
}
function fromForm(schema: FieldDef[], form: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const s of schema) {
    const v = form[s.key]
    out[s.key] = s.type === 'csv' ? String(v || '').split(',').map((x) => x.trim()).filter(Boolean) : v
  }
  return out
}

export default function Admin() {
  const { user, logout } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const active = loc.pathname.split('/admin/')[1] || 'dashboard'
  const go = (t: string) => nav(t === 'dashboard' ? '/admin' : `/admin/${t}`)

  const projects = useResource<any[]>('/api/projects', [])
  const unread = useResource<any[]>('/api/messages', [])

  return (
    <div>
      {/* admin header tetap: topbar + tab bar nempel di atas, tidak ikut scroll */}
      <div className="sticky top-0 z-30 -mx-4 -mt-8 border-b border-neutral-200 bg-paper/95 px-4 pb-2 pt-4 backdrop-blur sm:-mt-12 sm:pt-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="meta">ADMIN</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Kelola Konten</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag font-mono">● {user}</span>
            <Link to="/" className="btn-outline px-4">Lihat Web</Link>
            <button className="btn-danger" onClick={async () => { await logout(); nav('/admin/login') }}>Keluar</button>
          </div>
        </div>

        {/* tab bar — horizontal scroll di HP, wrap di desktop */}
        <div className="flex gap-1 overflow-x-auto py-1 sm:flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => go(t)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm transition-colors ${active === t ? 'bg-ink font-semibold text-paper' : 'text-neutral-500 hover:text-ink'}`}>
              {TAB_LABEL[t]}
              {t === 'pesan' && unread.data.length > 0 && (
                <span className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${active === t ? 'bg-paper text-ink' : 'bg-accent text-paper'}`}>{unread.data.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="site" element={<SiteTab />} />
          <Route path="profile" element={<ProfileTab />} />
          {COLLS.map((c) => <Route key={c.key} path={c.key} element={<CollTab def={c} />} />)}
          <Route path="pesan" element={<MessagesTab />} />
          <Route path="uploads" element={<UploadsTab />} />
          <Route path="backup" element={<BackupTab />} />
        </Routes>
      </div>
    </div>
  )
}

/* ---------- dashboard ---------- */
function Dashboard() {
  const projects = useResource<any[]>('/api/projects', [])
  const exps = useResource<any[]>('/api/experiments', [])
  const msgs = useResource<any[]>('/api/messages', [])
  const ups = useResource<any[]>('/api/uploads', [])
  const stats: [string, number, string][] = [
    ['Projects', projects.data.length, '/admin/projects'],
    ['Experiments', exps.data.length, '/admin/experiments'],
    ['Pesan masuk', msgs.data.length, '/admin/pesan'],
    ['Uploads', ups.data.length, '/admin/uploads'],
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(([label, n, to]) => (
        <Link key={label} to={to} className="card card-pad transition-colors hover:border-ink">
          <p className="text-3xl font-extrabold">{n}</p>
          <p className="meta mt-1">{label}</p>
        </Link>
      ))}
    </div>
  )
}

/* ---------- site ---------- */
const SITE_SCHEMA: FieldDef[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Deskripsi', type: 'textarea' },
  { key: 'footer', label: 'Footer', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'busy', 'hidden'] },
  { key: 'siteUrl', label: 'Site URL (canonical, cth. https://zerowebsite.eu.org)', type: 'text', placeholder: 'https://zerowebsite.eu.org' },
  { key: 'keywords', label: 'Keywords (koma)', type: 'textarea', placeholder: 'portfolio, react developer, ...' },
  { key: 'gsc', label: 'Google Search Console code', type: 'text', placeholder: 'google-site-verification=...' },
  { key: 'ogImage', label: 'OG Image (share preview)', type: 'upload' },
  { key: 'twitter', label: 'Twitter handle', type: 'text', placeholder: '@...' },
  { key: 'noindex', label: 'Sembunyikan dari Google (noindex)', type: 'bool' },
]
function SiteTab() {
  const { data, reload } = useResource<any>('/api/site', {})
  return <SingleTab path="/api/site" schema={SITE_SCHEMA} data={data} reload={reload} />
}

const PROFILE_SCHEMA: FieldDef[] = [
  { key: 'name', label: 'Nama', type: 'text' },
  { key: 'handle', label: 'Handle', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
  { key: 'tagline', label: 'Tagline', type: 'text' },
  { key: 'bio', label: 'Bio', type: 'textarea' },
  { key: 'location', label: 'Lokasi', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'avatar', label: 'Avatar (foto)', type: 'upload' },
  { key: 'stack', label: 'Stack (koma)', type: 'csv' },
  { key: 'status', label: 'Status', type: 'text' },
]
function ProfileTab() {
  const { data, reload } = useResource<any>('/api/profile', {})
  return <SingleTab path="/api/profile" schema={PROFILE_SCHEMA} data={data} reload={reload} />
}

function SingleTab({ path, schema, data, reload }: { path: string; schema: FieldDef[]; data: any; reload: () => void }) {
  const [form, setForm] = useState<Record<string, any> | null>(null)
  const cur = form ?? toForm(schema, data)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: string, v: any) => setForm({ ...cur, [k]: v })
  const empty = !form && (!data || Object.keys(data).length === 0)
  if (empty) return <div className="card card-pad space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div>
  return (
    <div className="card card-pad">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {schema.map((s) => <div key={s.key} className={s.type === 'textarea' || s.type === 'upload' ? 'md:col-span-2' : ''}>
          <Field label={s.label}><FieldInput def={s} value={cur[s.key]} onChange={(v) => set(s.key, v)} /></Field>
        </div>)}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button className="btn" disabled={busy} onClick={async () => {
          setBusy(true)
          try { await api.put(path, fromForm(schema, cur)); setMsg('Tersimpan.'); setForm(null); reload() }
          catch (e: any) { setMsg(`Gagal: ${e.message}`) }
          setBusy(false)
        }}>{busy ? <span className="flex items-center gap-2"><Spinner size={16} /> Menyimpan...</span> : 'Simpan'}</button>
        {msg ? <p className="meta">{msg}</p> : null}
      </div>
    </div>
  )
}

/* ---------- generic collection ---------- */
function CollTab({ def }: { def: CollDef }) {
  const { data, loading, reload } = useResource<any[]>(`/api/${def.key}`, [])
  const [editing, setEditing] = useState<string | null>(null) // id atau '__new__'
  const [form, setForm] = useState<Record<string, any>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const startNew = () => { setEditing('__new__'); setForm(toForm(def.schema, {})) }
  const startEdit = (d: any) => { setEditing(d.id); setForm(toForm(def.schema, d)) }

  const save = async () => {
    setBusy(true)
    try {
      const body = fromForm(def.schema, form)
      if (editing === '__new__') await api.post(`/api/${def.key}`, body)
      else await api.put(`/api/${def.key}/${editing}`, body)
      setEditing(null); setMsg('Tersimpan.'); reload()
    } catch (e: any) { setMsg(`Gagal: ${e.message}`) }
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta">{data.length} item</p>
        <button className="btn" onClick={startNew}>+ Tambah</button>
      </div>

      {editing && (
        <div className="card card-pad mb-4 border-ink">
          <p className="meta mb-3">{editing === '__new__' ? 'BARU' : `EDIT — ${editing}`}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {def.schema.map((s) => (
              <div key={s.key} className={s.type === 'textarea' || s.type === 'upload' ? 'md:col-span-2' : ''}>
                <Field label={s.label}><FieldInput def={s} value={form[s.key]} onChange={(v) => setForm({ ...form, [s.key]: v })} /></Field>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button className="btn" disabled={busy} onClick={save}>{busy ? <span className="flex items-center gap-2"><Spinner size={16} /> Menyimpan...</span> : 'Simpan'}</button>
            <button className="btn-outline" onClick={() => setEditing(null)}>Batal</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading && data.length === 0 ? (
          <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
        ) : null}
        {data.map((d: any) => (
          <div key={d.id} className="card card-pad">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {d.image ? <img src={d.image} alt="" className="h-14 w-14 shrink-0 border border-neutral-200 object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{def.titleOf(d)}</strong>
                <p className="meta mt-0.5 truncate">{d.id}{d.status ? ` / ${d.status}` : ''}</p>
                {d.description ? <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{d.description}</p> : null}
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button className="btn-outline flex-1 px-4 sm:flex-none" onClick={() => startEdit(d)}>Edit</button>
                <button className="btn-danger flex-1 sm:flex-none" onClick={async () => {
                  if (!confirm(`Hapus "${def.titleOf(d)}"?`)) return
                  try { await api.del(`/api/${def.key}/${d.id}`); reload() } catch (e: any) { setMsg(`Gagal: ${e.message}`) }
                }}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && !loading && <p className="meta">Belum ada data.</p>}
      </div>
      {msg ? <p className="meta mt-3">{msg}</p> : null}
    </div>
  )
}

/* ---------- messages ---------- */
function MessagesTab() {
  const { data, loading, reload } = useResource<any[]>('/api/messages', [])
  const [msg, setMsg] = useState('')
  if (loading && data.length === 0) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
  return (
    <div className="space-y-3">
      {data.map((m: any) => (
        <div key={m.id} className="card card-pad">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <strong className="text-sm">{m.name}</strong>
              <p className="meta mt-0.5 break-all">{m.email} / {m.createdAt}</p>
              <p className="mt-2 text-sm text-neutral-700">{m.message}</p>
            </div>
            <button className="btn-danger shrink-0" onClick={async () => {
              if (!confirm('Hapus pesan ini?')) return
              try { await api.del(`/api/messages/${m.id}`); reload() } catch (e: any) { setMsg(`Gagal: ${e.message}`) }
            }}>Hapus</button>
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="meta">Belum ada pesan.</p>}
      {msg ? <p className="meta">{msg}</p> : null}
    </div>
  )
}

/* ---------- uploads ---------- */
function UploadsTab() {
  const { data, loading, reload } = useResource<any[]>('/api/uploads', [])
  const [img, setImg] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <div>
      <div className="card card-pad mb-4">
        <Field label="Upload foto baru (via CDNZero)">
          <Upload value={img} onDone={(url) => { setImg(''); setMsg(`Terupload: ${url}`); reload() }} label="foto" />
        </Field>
        {msg ? <p className="meta mt-2 break-all">{msg}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((u: any) => (
          <div key={u.id} className="card overflow-hidden">
            <a href={u.url} target="_blank" rel="noreferrer"><img src={u.url} alt={u.fileName} className="aspect-square w-full object-cover" loading="lazy" /></a>
            <div className="p-2">
              <p className="truncate font-mono text-[11px] text-neutral-500">{u.fileName}</p>
              <div className="mt-1 flex gap-1">
                <button className="flex-1 border border-neutral-200 px-2 py-1.5 text-xs hover:bg-neutral-100" onClick={() => { navigator.clipboard?.writeText(u.url); setMsg('URL disalin') }}>Salin</button>
                <button className="flex-1 border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700" onClick={async () => {
                  if (!confirm('Hapus record ini?')) return
                  try { await api.del(`/api/uploads/${u.id}`); reload() } catch (e: any) { setMsg(`Gagal: ${e.message}`) }
                }}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {loading && data.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      ) : null}
      {data.length === 0 && !loading && <p className="meta">Belum ada upload.</p>}
    </div>
  )
}

/* ---------- backup ---------- */
function BackupTab() {
  const [msg, setMsg] = useState('')
  return (
    <div className="card card-pad">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="btn-outline" onClick={async () => {
          try {
            const d = await api.get('/api/admin/export')
            const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob); a.download = 'zero-portfolio-backup.json'; a.click()
            setMsg('Backup diunduh.')
          } catch (e: any) { setMsg(`Gagal: ${e.message}`) }
        }}>Download Backup JSON</button>
        <label className="btn cursor-pointer">
          Restore dari file
          <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              const j = JSON.parse(await f.text())
              if (!confirm('Restore akan MENIMPA semua data. Lanjut?')) return
              await api.post('/api/admin/import', j)
              setMsg('Restore sukses. Refresh halaman.')
            } catch (ex: any) { setMsg(`Gagal: ${ex.message}`) }
          }} />
        </label>
      </div>
      {msg ? <p className="meta mt-2">{msg}</p> : null}
    </div>
  )
}

/* ---------- field renderer ---------- */
function FieldInput({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  if (def.type === 'textarea')
    return <textarea className="input min-h-[100px] resize-y" value={value || ''} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} rows={4} />
  if (def.type === 'select')
    return <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— pilih —</option>
      {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  if (def.type === 'bool')
    return (
      <button type="button" onClick={() => onChange(!value)}
        className={`flex min-h-[44px] items-center gap-2 border px-3 text-sm ${value ? 'border-ink bg-ink text-paper' : 'border-neutral-300 text-neutral-500'}`}>
        <span className={`inline-block h-4 w-7 rounded-full p-0.5 ${value ? 'bg-paper' : 'bg-neutral-200'}`}>
          <span className={`block h-3 w-3 rounded-full bg-current ${value ? 'ml-auto text-ink' : 'text-neutral-400'}`} />
        </span>
        {value ? 'Ya' : 'Tidak'}
      </button>
    )
  if (def.type === 'upload') return <Upload value={value} onDone={onChange} label={def.label} />
  return <input className="input" value={value || ''} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />
}
