import { useEffect } from 'react'
import { useResource } from './useResource'

export const DEFAULT_BASE = 'https://zerowebsite.eu.org'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return
  const sel = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(sel)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  if (!href) return
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function absUrl(base: string, v: string) {
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return base + (v.startsWith('/') ? v : `/${v}`)
}

export function Seo({ title, description, path = '/', image, type = 'website', jsonLd }: {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}) {
  const site = useResource<any>('/api/site', {})
  useEffect(() => {
    const s = (site.data || {}) as any
    const base = String(s.siteUrl || s.canonical || DEFAULT_BASE).replace(/\/$/, '')
    const t = title || s.title || 'ZeroTzy.ID — Developer / Builder'
    const d = description || s.description || 'Portfolio Zero — Developer, Builder, Creative Technologist.'
    const url = base + path
    const img = absUrl(base, image || s.ogImage || `${base}/og-image.svg`)
    document.title = t
    document.documentElement.lang = document.documentElement.lang || 'id'
    upsertMeta('name', 'description', d)
    if (s.keywords) upsertMeta('name', 'keywords', s.keywords)
    upsertMeta('name', 'robots', s.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    if (s.gsc) upsertMeta('name', 'google-site-verification', s.gsc)
    upsertLink('canonical', url)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', s.brand || 'ZeroTzy.ID')
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:title', t)
    upsertMeta('property', 'og:description', d)
    upsertMeta('property', 'og:image', img)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', t)
    upsertMeta('name', 'twitter:description', d)
    upsertMeta('name', 'twitter:image', img)
    if (s.twitter) upsertMeta('name', 'twitter:site', s.twitter)
    // JSON-LD dinamis per halaman (ganti yang lama)
    document.head.querySelectorAll('script[data-zp-seo]').forEach((el) => el.remove())
    const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
    for (const b of blocks) {
      const el = document.createElement('script')
      el.type = 'application/ld+json'
      el.setAttribute('data-zp-seo', '1')
      el.textContent = JSON.stringify(b)
      document.head.appendChild(el)
    }
  }, [site.data, title, description, path, image, type, JSON.stringify(jsonLd ?? null)])
  return null
}
