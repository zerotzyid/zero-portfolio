import { sealChallenge, openChallenge, loginKey, decryptLogin, newToken, safeEqual } from './crypto.js'
import { getById, insert, removeById } from './db.js'

const ADMIN_USER = process.env.ADMIN_USER || 'ZeroTzy'
const ADMIN_PASS = process.env.ADMIN_PASS || 'ZeeAjah'
const TTL = Number(process.env.SESSION_TTL_HOURS || 12) * 3600 * 1000

// rate limit login: 15x / menit per IP
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > 15
}

export async function getSession(token) {
  if (!token) return null
  try {
    const s = await getById('sessions', token)
    if (!s || !s.exp || s.exp < Date.now()) {
      if (s) await removeById('sessions', token).catch(() => {})
      return null
    }
    return s
  } catch { return null }
}

// Guard untuk semua route tulis + backup. Terima session Bearer ATAU legacy ADMIN_TOKEN.
export async function adminAuth(req, res, next) {
  const legacy = process.env.ADMIN_TOKEN || ''
  if (legacy && req.header('x-admin-token') === legacy) return next()
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '') || req.header('x-session') || ''
  const s = await getSession(bearer)
  if (s) { req.adminUser = s.user; return next() }
  return res.status(401).json({ success: false, error: 'Unauthorized: silakan login di /admin/login' })
}

export function challengeHandler(req, res) {
  res.json({ success: true, data: { challenge: sealChallenge(), expiresIn: 300 } })
}

export async function loginHandler(req, res) {
  try {
    if (limited(req.ip)) return res.status(429).json({ success: false, error: 'Terlalu banyak percobaan, tunggu sebentar' })
    const { username, iv, ct, challenge } = req.body || {}
    if (!openChallenge(challenge)) return res.status(400).json({ success: false, error: 'Challenge kedaluwarsa, ulangi login' })
    let cred
    try {
      cred = decryptLogin(iv, ct, loginKey(challenge, username))
    } catch { return res.status(400).json({ success: false, error: 'Payload terenkripsi tidak valid' })
    }
    if (!cred?.ts || Math.abs(Date.now() - cred.ts) > 5 * 60 * 1000)
      return res.status(400).json({ success: false, error: 'Timestamp tidak valid, ulangi login' })
    if (!safeEqual(String(username || ''), ADMIN_USER) || !safeEqual(String(cred.password || ''), ADMIN_PASS))
      return res.status(401).json({ success: false, error: 'Username / password salah' })
    const token = newToken()
    await insert('sessions', { id: token, user: ADMIN_USER, exp: Date.now() + TTL })
    res.json({ success: true, data: { token, user: ADMIN_USER, expiresIn: TTL / 1000 } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

export async function meHandler(req, res) {
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '') || req.header('x-session') || ''
  const s = await getSession(bearer)
  if (!s) return res.status(401).json({ success: false, error: 'Session habis' })
  res.json({ success: true, data: { user: s.user } })
}

export async function logoutHandler(req, res) {
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '') || req.header('x-session') || ''
  if (bearer) await removeById('sessions', bearer).catch(() => {})
  res.json({ success: true })
}
