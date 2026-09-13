import { useState } from 'react'
import { api } from '../lib/api'

export default function Upload({ value, onDone, label = 'Upload foto' }: { value?: string; onDone: (url: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)

  const send = async (f: File) => {
    if (!f.type.startsWith('image/')) { setErr('File harus gambar'); return }
    setBusy(true); setErr('')
    try { const d = await api.upload(f); onDone(d.url) }
    catch (ex: any) { setErr(ex.message) }
    setBusy(false)
  }

  return (
    <div>
      {value ? (
        <div className="mb-2">
          <img src={value} alt="preview" className="h-24 w-24 rounded-full border border-neutral-200 object-cover sm:h-28 sm:w-28" />
          <p className="meta mt-1 break-all">{value}</p>
        </div>
      ) : null}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) send(f) }}
        className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-4 text-center transition-colors ${drag ? 'border-ink bg-neutral-100' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'}`}
        onClick={() => document.getElementById(`up-${label}`)?.click()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-neutral-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
        <p className="mt-1 text-xs text-neutral-500">{busy ? 'Mengupload ke CDNZero...' : `${label} — klik / drop di sini`}</p>
        <input id={`up-${label}`} type="file" accept="image/*" className="hidden" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = '' }} />
      </div>
      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
    </div>
  )
}
