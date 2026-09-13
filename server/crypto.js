import crypto from 'node:crypto'

const SECRET = process.env.ADMIN_SECRET || 'zero-portfolio-aes-default-change-me'
const keyMain = () => crypto.createHash('sha256').update(SECRET).digest()

const b64uEncode = (buf) => Buffer.from(buf).toString('base64url')
const b64uDecode = (s) => Buffer.from(String(s || ''), 'base64url')

// challenge stateless: AES-256-GCM seal { r, exp } — server bisa verifikasi tanpa simpan state (aman untuk serverless)
export function sealChallenge() {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', keyMain(), iv)
  const payload = JSON.stringify({ r: crypto.randomBytes(8).toString('hex'), exp: Date.now() + 5 * 60 * 1000 })
  const ct = Buffer.concat([c.update(payload, 'utf8'), c.final()])
  return `${b64uEncode(iv)}.${b64uEncode(ct)}.${b64uEncode(c.getAuthTag())}`
}

export function openChallenge(tok) {
  try {
    const [ivB, ctB, tagB] = String(tok || '').split('.')
    const d = crypto.createDecipheriv('aes-256-gcm', keyMain(), b64uDecode(ivB))
    d.setAuthTag(b64uDecode(tagB))
    const pt = Buffer.concat([d.update(b64uDecode(ctB)), d.final()]).toString('utf8')
    const o = JSON.parse(pt)
    if (!o.exp || o.exp < Date.now()) return null
    return o
  } catch { return null }
}

// key login = sha256(challenge + username) — dihitung identik di client & server
export const loginKey = (challenge, username) =>
  crypto.createHash('sha256').update(`${challenge}:${String(username || '').toLowerCase().trim()}`).digest()

export function decryptLogin(ivB64, ctB64, key) {
  const pt = (() => {
    const d = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(String(ivB64 || ''), 'base64'))
    return Buffer.concat([d.update(Buffer.from(String(ctB64 || ''), 'base64')), d.final()]).toString('utf8')
  })()
  return JSON.parse(pt) // { password, ts }
}

export const newToken = () => crypto.randomBytes(32).toString('hex')

export function safeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b))
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}
