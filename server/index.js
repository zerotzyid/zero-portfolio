import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { getSingle, setSingle, list, getById, insert, updateById, removeById, exportAll, importAll, usingMongo } from './db.js'
import { adminAuth, challengeHandler, loginHandler, meHandler, logoutHandler } from './auth.js'
import { uploadMem, uploadSingleHandler, uploadMultipleHandler, fileDetailHandler } from './upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 3456)

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const ok = (res, data) => res.json({ success: true, data })
const needId = (v) => String(v || '').trim()

// ---------- auth (AES login) ----------
app.get('/api/auth/challenge', challengeHandler)
app.post('/api/auth/login', loginHandler)
app.get('/api/auth/me', meHandler)
app.post('/api/auth/logout', logoutHandler)

// ---------- health ----------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Zero Portfolio API running', storage: usingMongo() ? 'mongodb' : 'json', time: new Date().toISOString() })
})
app.get('/api/cdn/health', async (req, res) => {
  try {
    const base = (process.env.CDNZERO_BASE || 'https://api-cdnzero.vercel.app').replace(/\/$/, '')
    const r = await fetch(`${base}/api/health`)
    res.status(r.status).json(await r.json().catch(() => ({})))
  } catch (e) { res.status(502).json({ success: false, error: e.message }) }
})

// ---------- single docs: site, profile ----------
for (const coll of ['site', 'profile']) {
  app.get(`/api/${coll}`, async (req, res) => { try { ok(res, await getSingle(coll)) } catch (e) { res.status(500).json({ success: false, error: e.message }) } })
  app.put(`/api/${coll}`, adminAuth, async (req, res) => { try { ok(res, await setSingle(coll, req.body || {})) } catch (e) { res.status(500).json({ success: false, error: e.message }) } })
}

// ---------- CRUD collections ----------
const CR = ['projects', 'experiments', 'skills', 'experience', 'links', 'messages', 'uploads']
for (const coll of CR) {
  app.get(`/api/${coll}`, async (req, res) => {
    try { ok(res, await list(coll, req.query)) } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
  app.get(`/api/${coll}/:id`, async (req, res) => {
    try {
      const doc = await getById(coll, needId(req.params.id))
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
      ok(res, doc)
    } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
  const writeGuard = coll === 'messages' ? (req, res, next) => next() : adminAuth // contact form publik
  app.post(`/api/${coll}`, writeGuard, async (req, res) => {
    try { res.status(201).json({ success: true, data: await insert(coll, req.body || {}) }) } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
  app.put(`/api/${coll}/:id`, adminAuth, async (req, res) => {
    try {
      const doc = await updateById(coll, needId(req.params.id), req.body || {})
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
      ok(res, doc)
    } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
  app.patch(`/api/${coll}/:id`, adminAuth, async (req, res) => {
    try {
      const doc = await updateById(coll, needId(req.params.id), req.body || {})
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' })
      ok(res, doc)
    } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
  app.delete(`/api/${coll}/:id`, adminAuth, async (req, res) => {
    try {
      const gone = await removeById(coll, needId(req.params.id))
      if (!gone) return res.status(404).json({ success: false, error: 'Not found' })
      res.json({ success: true })
    } catch (e) { res.status(500).json({ success: false, error: e.message }) }
  })
}

// ---------- upload via CDNZero ----------
app.post('/api/upload', adminAuth, uploadMem.single('file'), uploadSingleHandler)
app.post('/api/upload-multiple', adminAuth, uploadMem.array('files', 10), uploadMultipleHandler)
app.get('/api/file-detail', async (req, res) => fileDetailHandler(req, res))

// ---------- export / import (backup) ----------
app.get('/api/admin/export', adminAuth, async (req, res) => { try { ok(res, await exportAll()) } catch (e) { res.status(500).json({ success: false, error: e.message }) } })
app.post('/api/admin/import', adminAuth, async (req, res) => { try { await importAll(req.body || {}); ok(res, { imported: true }) } catch (e) { res.status(500).json({ success: false, error: e.message }) } })

// ---------- SEO: sitemap.xml dinamis (daftar ke Search Console) ----------
const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/work', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/experiments', changefreq: 'weekly', priority: '0.7' },
  { path: '/contact', changefreq: 'yearly', priority: '0.6' },
]
async function siteBase() {
  try {
    const site = await getSingle('site')
    const raw = (site?.siteUrl || site?.canonical || 'https://zerowebsite.eu.org').trim()
    return raw.replace(/\/$/, '')
  } catch { return 'https://zerowebsite.eu.org' }
}
const escXml = (v) => String(v || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))
app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = await siteBase()
    const projects = await list('projects', {})
    const urls = [...STATIC_ROUTES.map((r) => ({ ...r, lastmod: new Date().toISOString().slice(0, 10) }))]
    for (const p of projects) {
      if (!p?.id) continue
      urls.push({
        path: `/work/${encodeURIComponent(p.id)}`,
        changefreq: 'monthly', priority: p.featured ? '0.8' : '0.6',
        lastmod: (p.updatedAt || p.createdAt || new Date().toISOString()).slice(0, 10),
      })
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${escXml(base + u.path)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
      `\n</urlset>`
    res.type('application/xml').send(xml)
  } catch (e) { res.status(500).type('application/xml').send(`<?xml version="1.0"?><error>${escXml(e.message)}</error>`) }
})

// ---------- SEO: ringkasan untuk AI (Gemini/LLM sitasi) ----------
app.get('/api/ai-summary', async (req, res) => {
  try {
    const [site, profile, projects, experiments, skills, links] = await Promise.all([
      getSingle('site'), getSingle('profile'), list('projects', {}),
      list('experiments', {}), list('skills', {}), list('links', {}),
    ])
    const base = await siteBase()
    ok(res, {
      site: { ...site, base },
      profile,
      projects: projects.map((p) => ({ ...p, url_abs: `${base}/work/${encodeURIComponent(p.id)}` })),
      experiments, skills, links,
      endpoints: { sitemap: `${base}/sitemap.xml`, llms: `${base}/llms.txt` },
    })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})
app.get('/llms.txt', async (req, res) => {
  try {
    const [site, profile, projects] = await Promise.all([getSingle('site'), getSingle('profile'), list('projects', {})])
    const base = await siteBase()
    const lines = [
      `# ${site?.brand || profile?.handle || 'ZeroTzy.ID'}`,
      ``,
      `> ${site?.description || profile?.bio || ''}`,
      ``,
      `- Home: ${base}/`,
      `- Work: ${base}/work`,
      `- About: ${base}/about`,
      `- Experiments: ${base}/experiments`,
      `- Contact: ${base}/contact`,
      ``,
      `## Projects`,
      ...projects.map((p) => `- [${p.title}](${base}/work/${encodeURIComponent(p.id)}) — ${p.description || ''} [${(p.tech || []).join(', ')}]`),
      ``,
      `## Machine-readable`,
      `- JSON: ${base}/api/ai-summary`,
      `- Sitemap: ${base}/sitemap.xml`,
    ]
    res.type('text/plain').send(lines.join('\n'))
  } catch (e) { res.status(500).type('text/plain').send(`# Error: ${e.message}`) }
})

// ---------- serve frontend (dist) ----------
const DIST = path.join(ROOT, 'dist')
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(DIST, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.json({ success: true, message: 'API only — frontend belum di-build (dist/)' }))
}

app.listen(PORT, '0.0.0.0', () => console.log(`zero-portfolio server :${PORT} storage=${usingMongo() ? 'mongodb' : 'json'}`))
