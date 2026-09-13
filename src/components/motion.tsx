import { useEffect, useRef, type ReactNode } from 'react'
import { animate, stagger } from 'animejs'
import { reduced, staggerIn, pageIn } from '../lib/anim'

/** Bungkus konten agar muncul saat di-scroll (sekali saja) */
export function Reveal({ children, delay = 0, y = 26, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced()) return
    el.style.opacity = '0'
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          animate(el, { opacity: [0, 1], y: [y, 0], duration: 750, delay, ease: 'outExpo' })
          io.disconnect()
        }
      })
    }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}

/** Transisi tiap ganti route: main di-animate ulang saat pathname berubah */
export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { pageIn(ref.current) }, [routeKey])
  return <div ref={ref}>{children}</div>
}

/** Teks dipecah per huruf, muncul berurutan */
export function SplitChars({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current || reduced()) return
    animate(ref.current.querySelectorAll('[data-ch]'), {
      opacity: [0, 1], y: [18, 0], rotate: [6, 0],
      duration: 550, delay: stagger(16, { start: delay }), ease: 'outExpo',
    })
  }, [text])
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split('').map((c, i) => (
        <span key={i} data-ch className="inline-block" style={{ opacity: reduced() ? 1 : 0 }} aria-hidden>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}

/** Hook: tiap dep berubah, anak [data-item] masuk berurutan */
export function useStagger<T>(dep: T) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { staggerIn(ref.current) }, [dep])
  return ref
}

/** Kartu tilt 3D mengikuti kursor (desktop), kembali elastis saat lepas */
export function Tilt({ children, className = '', max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || !matchMedia('(pointer: fine)').matches) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      animate(el, { rotateY: px * max * 2, rotateX: -py * max * 2, duration: 350, ease: 'outCubic' })
    }
    const leave = () => animate(el, { rotateX: 0, rotateY: 0, duration: 700, ease: 'outElastic' })
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [max])
  return <div ref={ref} className={`tilt ${className}`}>{children}</div>
}

/** Ripple: gelombang membesar dari titik klik di dalam tombol/kartu */
export function Ripple({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const host = ref.current?.parentElement
    const dot = ref.current
    if (!host || !dot || reduced()) return
    const click = (e: MouseEvent) => {
      const r = host.getBoundingClientRect()
      const size = Math.max(r.width, r.height) * 2.2
      dot.style.width = dot.style.height = `${size}px`
      dot.style.left = `${e.clientX - r.left - size / 2}px`
      dot.style.top = `${e.clientY - r.top - size / 2}px`
      animate(dot, { scale: [0, 1], opacity: [0.35, 0], duration: 650, ease: 'outExpo' })
    }
    host.addEventListener('click', click)
    return () => host.removeEventListener('click', click)
  }, [])
  return <span ref={ref} aria-hidden className={`ripple-dot ${className}`} />
}

/** Angka menghitung naik (dashboard) */
export function CountUp({ to, className = '' }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced()) { el.textContent = String(to); return }
    const o = { v: 0 }
    animate(o, {
      v: [0, to], duration: 900, ease: 'outExpo',
      onUpdate: () => { el.textContent = String(Math.round(o.v)) },
    })
  }, [to])
  return <span ref={ref} className={className}>0</span>
}

/** Tombol/element yang tertarik sedikit ke kursor (desktop saja) */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || !matchMedia('(pointer: fine)').matches) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      animate(el, { x: x * strength, y: y * strength, duration: 300, ease: 'outCubic' })
    }
    const leave = () => animate(el, { x: 0, y: 0, duration: 500, ease: 'outElastic' })
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [])
  return <div ref={ref} className="inline-block">{children}</div>
}

/** Splash boot: brand muncul per huruf + progress line, lalu fade out */
export function Splash({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reduced()) { onDone(); return }
    const chars = root.current?.querySelectorAll('[data-ch]')
    if (chars) animate(chars, { opacity: [0, 1], y: [20, 0], duration: 500, delay: stagger(45), ease: 'outExpo' })
    if (bar.current) animate(bar.current, { scaleX: [0, 1], duration: 950, ease: 'inOutQuad' })
    const t1 = setTimeout(() => {
      if (!root.current) { onDone(); return }
      animate(root.current, {
        opacity: [1, 0], duration: 350, ease: 'inQuad',
        onComplete: onDone,
      })
    }, 1050)
    return () => clearTimeout(t1)
  }, [])
  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400">portfolio</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" aria-label="ZeroTzy.ID">
        {'ZeroTzy.ID'.split('').map((c, i) => (
          <span key={i} data-ch className="inline-block" style={{ opacity: 0 }} aria-hidden>{c}</span>
        ))}
      </h1>
      <div className="mt-5 h-0.5 w-40 overflow-hidden bg-neutral-200">
        <div ref={bar} className="h-full w-full origin-left bg-ink" style={{ transform: 'scaleX(0)' }} />
      </div>
    </div>
  )
}
