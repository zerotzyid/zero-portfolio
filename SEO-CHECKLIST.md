# SEO Checklist — zero-portfolio (zerowebsite.eu.org)

Setelah deploy, lakukan ini sekali agar terindex Google + terbaca Gemini/AI.

## 1. Verifikasi domain aktif
- [ ] `https://zerowebsite.eu.org/` mengarah ke VPS dan serve portfolio (reverse proxy ke 127.0.0.1:3456)
- [ ] HTTPS aktif (cert valid), HTTP redirect ke HTTPS
- [ ] Cek: `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/api/ai-summary`, `/og-image.svg` — semua 200

## 2. Isi pengaturan SEO via Admin (/admin → Site)
- [ ] Site URL = `https://zerowebsite.eu.org`
- [ ] Title, Description, Keywords terisi
- [ ] OG Image terisi (upload 1200×630, <300KB)
- [ ] Twitter handle (opsional)

## 3. Google Search Console
1. Buka https://search.google.com/search-console → Add property → URL prefix `https://zerowebsite.eu.org/`
2. Pilih verifikasi "HTML tag" → salin isi `content` (tanpa `google-site-verification=`)
3. Tempel ke Admin → Site → GSC code → Simpan → deploy ulang tidak perlu (meta dibaca runtime)
4. Klik Verify di Search Console
5. Menu Sitemaps → Add sitemap → `sitemap.xml` → Submit
6. URL Inspection → test `/`, `/work`, satu `/work/:id` → Request Indexing

## 4. Validasi teknis
- [ ] https://search.google.com/test/mobile-friendly — lolos
- [ ] https://pagespeed.web.dev — skor mobile ≥ 80
- [ ] Rich Results test untuk satu halaman `/work/:id` (CreativeWork schema)
- [ ] Share debugger (Telegram/WhatsApp/X) — preview OG image muncul

## 5. Gemini / AI discoverability
- [ ] `/llms.txt` dinamis dari DB (project ikut berubah otomatis)
- [ ] `/api/ai-summary` JSON valid (profil + projects + URL absolut)
- [ ] Prompt uji di Gemini: "ringkas portfolio di https://zerowebsite.eu.org/llms.txt"

## Catatan
- Sitemap baca `site.siteUrl` dari DB (JSON/Mongo) — ganti domain tanpa deploy ulang.
- `noindex` di Admin = darurat saja (menyembunyikan seluruh situs dari Google).
- Index Google butuh waktu 1–14 hari setelah submit; Request Indexing mempercepat per URL.
