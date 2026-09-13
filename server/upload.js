import multer from 'multer'

export const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})

const CDN_BASE = (process.env.CDNZERO_BASE || 'https://api-cdnzero.vercel.app').replace(/\/$/, '')

async function proxyOne(file) {
  const form = new FormData()
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname)
  const r = await fetch(`${CDN_BASE}/api/upload`, { method: 'POST', body: form })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, body: j }
}

export async function uploadSingleHandler(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Kirim file di field "file"' })
    const { status, body } = await proxyOne(req.file)
    if (!body?.success) return res.status(status || 502).json({ success: false, error: body?.error || 'Upload CDN gagal', raw: body })
    const { insert } = await import('./db.js')
    const rec = await insert('uploads', { fileName: body.data?.fileName, url: body.data?.url, size: body.data?.fileSize, at: body.data?.uploadedAt || new Date().toISOString() })
    return res.json({ success: true, ...body, saved: rec })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}

export async function uploadMultipleHandler(req, res) {
  try {
    const files = req.files || []
    if (!files.length) return res.status(400).json({ success: false, error: 'Kirim file di field "files"' })
    const form = new FormData()
    for (const f of files) form.append('files', new Blob([f.buffer], { type: f.mimetype }), f.originalname)
    const r = await fetch(`${CDN_BASE}/api/upload-multiple`, { method: 'POST', body: form })
    const j = await r.json().catch(() => ({}))
    if (!j?.success) return res.status(r.status || 502).json({ success: false, error: j?.error || 'Upload CDN gagal', raw: j })
    const { insert } = await import('./db.js')
    const saved = []
    for (const item of j.data || []) {
      if (item?.success && item?.data?.url) {
        saved.push(await insert('uploads', { fileName: item.data.fileName, url: item.data.url, size: item.data.fileSize, at: item.data.uploadedAt || new Date().toISOString() }))
      }
    }
    return res.json({ success: true, ...j, saved })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}

export async function fileDetailHandler(req, res) {
  try {
    const url = req.query.url
    if (!url) return res.status(400).json({ success: false, error: 'Query ?url= wajib' })
    const r = await fetch(`${CDN_BASE}/api/file-detail?url=${encodeURIComponent(url)}`)
    const j = await r.json().catch(() => ({}))
    return res.status(r.status).json(j)
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}
