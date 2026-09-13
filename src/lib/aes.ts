// AES-CBC murni JS (crypto-js) untuk enkripsi kredensial login di browser.
// WebCrypto (crypto.subtle.digest) TIDAK tersedia di HTTP via IP karena bukan
// secure context — itu penyebab error "Cannot read properties of undefined
// (reading 'digest')". crypto-js jalan di semua konteks.
// key = SHA-256(challenge + ':' + username) — identik dengan server (server/crypto.js).
import CryptoJS from 'crypto-js'

export async function encryptLogin(password: string, challenge: string, username: string): Promise<{ iv: string; ct: string }> {
  const key = CryptoJS.SHA256(`${challenge}:${username.toLowerCase().trim()}`)
  const iv = CryptoJS.lib.WordArray.random(16)
  const ct = CryptoJS.AES.encrypt(JSON.stringify({ password, ts: Date.now() }), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return {
    iv: iv.toString(CryptoJS.enc.Base64),
    ct: ct.ciphertext.toString(CryptoJS.enc.Base64),
  }
}
