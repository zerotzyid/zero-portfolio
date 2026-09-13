import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { Card, Tags } from './ui'
import { useLang } from '../lib/i18n'
import { reduced, popIn } from '../lib/anim'

/** Satu part engine ↔ satu project (siklis by index). */
const PARTS = [
  { key: 'intake', label: 'Intake', dx: -84, dy: 0 },
  { key: 'casing-top', label: 'Casing ▲', dx: 0, dy: -66 },
  { key: 'fan', label: 'Fan', dx: -38, dy: 0 },
  { key: 'core', label: 'Core', dx: 8, dy: 0 },
  { key: 'casing-bottom', label: 'Casing ▼', dx: 0, dy: 66 },
  { key: 'exhaust', label: 'Exhaust', dx: 88, dy: 0 },
] as const

/** Dot-grid ala homepage animejs — ripple mengikuti pointer. */
const DOTS_COLS = 26
const DOTS_ROWS = 10

type S = {
  t: number // waktu animasi (detik)
  exp: number // 0 rakit … 1 meledak (nilai aktual per frame)
  expTarget: number // target ledak (slider / tombol / auto)
  vel: number // inertia scrub (per detik)
  fan: number // sudut bilah (deg)
  flow: number // offset garis udara
  tiltX: number; tiltY: number; tiltR: number // kemiringan aktual
  tiltTX: number; tiltTY: number; tiltTR: number // target kemiringan dari pointer
  dragging: boolean
  lastTouch: number // timestamp interaksi terakhir (auto jeda 8 dtk)
}

export default function EngineExplorer({ projects }: { projects: any[] }) {
  const { s } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const expSliderRef = useRef<HTMLInputElement>(null)
  const st = useRef<S>({ t: 0, exp: 0, expTarget: 0, vel: 0, fan: 0, flow: 0, tiltX: 0, tiltY: 0, tiltR: 0, tiltTX: 0, tiltTY: 0, tiltTR: 0, dragging: false, lastTouch: 0 })
  const drag = useRef<{ x: number; p0: number; moves: { x: number; t: number }[] } | null>(null)
  const lastRipple = useRef(0)
  const firstCard = useRef(true)
  const [playing, setPlaying] = useState(true)
  const [auto, setAuto] = useState(true)
  const [speed, setSpeed] = useState(1)
  const playingRef = useRef(true)
  const autoRef = useRef(true)
  const speedRef = useRef(1)
  const [exploded, setExploded] = useState(false)
  const explodedRef = useRef(false)
  const [active, setActive] = useState(0)
  const T = (s.home as any).engine as {
    title: string; hint: string; assemble: string; explode: string; dragHint: string
    play: string; pause: string; auto: string; speed: string; boom: string; reset: string
  }

  playingRef.current = playing
  autoRef.current = auto
  speedRef.current = speed

  const items = useMemo(
    () => PARTS.map((pt, i) => ({ ...pt, project: projects.length ? projects[i % projects.length] : null })),
    [projects]
  )
  const current = items.length ? items[active % items.length] : null

  const dots = useMemo(() => {
    const arr: { cx: number; cy: number }[] = []
    for (let r = 0; r < DOTS_ROWS; r++)
      for (let c = 0; c < DOTS_COLS; c++) arr.push({ cx: 14 + c * 24, cy: 18 + r * 34 })
    return arr
  }, [])

  const touch = () => { st.current.lastTouch = performance.now() }

  const setTarget = (v: number) => {
    touch()
    st.current.vel = 0
    st.current.expTarget = Math.min(1, Math.max(0, v))
  }

  // ---------- MASTER LOOP per frame ----------
  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced()) {
      // reduced-motion: tampil rakit statis
      PARTS.forEach((pt) => {
        const g = root?.querySelector<SVGGElement>(`[data-part="${pt.key}"]`)
        if (g) g.style.transform = 'translate(0px, 0px)'
      })
      return
    }
    const q = <T,>(sel: string): T[] => Array.from(root.querySelectorAll(sel)) as unknown as T[]
    const partEls = PARTS.map((pt) => root.querySelector<SVGGElement>(`[data-part="${pt.key}"]`))
    const floatEls = q<SVGGElement>('[data-float]')
    const blades = root.querySelector<SVGGElement>('[data-blades]')
    const dashes = q<SVGLineElement>('[data-dash]')
    const flame = root.querySelector<SVGPathElement>('[data-flame]')
    const engRoot = root.querySelector<SVGGElement>('[data-engine-root]')
    const labels = q<SVGTextElement>('[data-explabel]')
    const flowG = root.querySelector('[data-flow]')
    const expSlider = expSliderRef.current
    let raf = 0
    let last = performance.now()
    let first = true

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) { last = now; return }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const S = st.current
      const playing = playingRef.current
      const spd = speedRef.current

      // waktu + auto-ledak (loop sinus 9 dtk, aktif bila idle 8 dtk)
      if (playing) S.t += dt * spd
      if (autoRef.current && playing && !S.dragging && now - S.lastTouch > 8000) {
        S.expTarget = (Math.sin((S.t * 2 * Math.PI) / 9 - Math.PI / 2) + 1) / 2
      }

      // ledak: inertia saat lepas-scrub, else ease ke target
      if (!S.dragging) {
        if (Math.abs(S.vel) > 0.05) {
          S.exp += S.vel * dt
          S.vel *= Math.pow(0.02, dt)
          if (S.exp <= 0 || S.exp >= 1) { S.exp = Math.min(1, Math.max(0, S.exp)); S.vel = 0 }
          if (Math.abs(S.vel) <= 0.05) { S.vel = 0; S.expTarget = S.exp > 0.5 ? 1 : 0 }
        } else {
          S.exp += (S.expTarget - S.exp) * Math.min(1, dt * 6)
          if (Math.abs(S.expTarget - S.exp) < 0.0005) S.exp = S.expTarget
        }
      }
      const ex = S.dragging ? S.exp : S.exp

      // tilt mengikuti pointer (eased)
      const k = Math.min(1, dt * 5)
      S.tiltX += (S.tiltTX - S.tiltX) * k
      S.tiltY += (S.tiltTY - S.tiltY) * k
      S.tiltR += (S.tiltTR - S.tiltR) * k

      // --- tulis DOM (transform-only, murah) ---
      const t = S.t
      for (let i = 0; i < partEls.length; i++) {
        const g = partEls[i]
        if (!g) continue
        const bob = playing ? Math.sin(t * 1.6 + i * 0.7) * 5 : 0
        g.style.transform = `translate(${(PARTS[i].dx * ex).toFixed(2)}px, ${(PARTS[i].dy * ex + bob).toFixed(2)}px)`
      }
      if (playing) {
        S.fan = (S.fan + dt * 300 * spd) % 360
        S.flow = (S.flow - dt * 30 * spd) % 24
      }
      if (blades) blades.style.transform = `rotate(${S.fan.toFixed(1)}deg)`
      for (const d of dashes) d.style.strokeDashoffset = `${S.flow.toFixed(1)}`
      if (flame) {
        const fl = playing ? 0.6 + 0.3 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23) : 0.6
        flame.setAttribute('opacity', fl.toFixed(2))
        flame.style.transform = `scaleX(${(1 + (playing ? 0.1 * Math.sin(t * 11) : 0)).toFixed(3)})`
      }
      for (const f of floatEls) f.style.transform = ''
      if (engRoot) engRoot.style.transform = `translate(${S.tiltX.toFixed(2)}px, ${S.tiltY.toFixed(2)}px) rotate(${S.tiltR.toFixed(2)}deg)`
      for (const l of labels) (l as SVGTextElement).style.opacity = ex.toFixed(2)
      if (flowG) flowG.setAttribute('opacity', (0.55 + 0.45 * ex).toFixed(2))

      // sinkron ringan ke React (hanya saat berubah / slider tidak disentuh)
      const isExp = ex > 0.5
      if (isExp !== explodedRef.current) { explodedRef.current = isExp; setExploded(isExp) }
      if (expSlider && document.activeElement !== expSlider) expSlider.value = String(Math.round(ex * 100))
      if (first) { first = false }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Entrance: engine masuk dari kiri saat pertama terlihat
  useEffect(() => {
    if (reduced()) return
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          const svg = root.querySelector('[data-engine-svg]')
          if (svg) animate(svg, { opacity: [0, 1], x: [-40, 0], duration: 800, ease: 'outExpo' })
          io.disconnect()
        }
      })
    }, { threshold: 0.25 })
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // Pop kartu kanan tiap ganti part
  useEffect(() => {
    if (firstCard.current) { firstCard.current = false; return }
    popIn(cardRef.current)
  }, [active])

  /** Ripple dot-grid dari posisi pointer — stagger grid khas animejs. */
  const ripple = (e: React.PointerEvent) => {
    if (reduced()) return
    const now = performance.now()
    if (now - lastRipple.current < 500) return
    lastRipple.current = now
    const root = rootRef.current
    const svg = root?.querySelector('[data-engine-svg]')
    if (!root || !svg) return
    const rect = (svg as SVGSVGElement).getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * 640
    const vy = ((e.clientY - rect.top) / rect.height) * 360
    const col = Math.min(DOTS_COLS - 1, Math.max(0, Math.round((vx - 14) / 24)))
    const row = Math.min(DOTS_ROWS - 1, Math.max(0, Math.round((vy - 18) / 34)))
    const from = row * DOTS_COLS + col
    animate(root.querySelectorAll('[data-dot]'), {
      scale: [{ to: 2.2, duration: 200 }, { to: 1, duration: 900 }],
      delay: stagger(70, { grid: [DOTS_COLS, DOTS_ROWS], from }),
      ease: 'outExpo',
    })
  }

  // Tilt: pointer menggerakkan seluruh engine (eased per frame di loop)
  const onTilt = (e: React.PointerEvent) => {
    const svg = rootRef.current?.querySelector('[data-engine-svg]')
    if (!svg) return
    const rect = (svg as SVGSVGElement).getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    const S = st.current
    S.tiltTX = nx * 14
    S.tiltTY = ny * 9
    S.tiltTR = nx * 3
  }
  const onTiltLeave = () => {
    const S = st.current
    S.tiltTX = S.tiltTY = S.tiltTR = 0
  }

  // Scrub: drag horizontal = ledak per frame + inertia saat dilepas
  const onPointerDown = (e: React.PointerEvent) => {
    touch()
    st.current.dragging = true
    st.current.vel = 0
    drag.current = { x: e.clientX, p0: st.current.exp, moves: [{ x: e.clientX, t: performance.now() }] }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    ripple(e)
    onTilt(e)
    const d = drag.current
    if (!d) return
    const p = Math.min(1, Math.max(0, d.p0 + (e.clientX - d.x) / 220))
    st.current.exp = p
    st.current.expTarget = p
    d.moves.push({ x: e.clientX, t: performance.now() })
    if (d.moves.length > 5) d.moves.shift()
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    st.current.dragging = false
    const moved = Math.abs(e.clientX - d.x)
    if (moved < 6) { touch(); return } // klik biasa
    // inertia dari 3 gerakan terakhir
    const m = d.moves
    if (m.length >= 2) {
      const a = m[0], b = m[m.length - 1]
      const dt = Math.max(16, b.t - a.t) / 1000
      st.current.vel = ((b.x - a.x) / 220 / dt) * 0.6
      if (Math.abs(st.current.vel) < 0.3) { st.current.vel = 0; st.current.expTarget = st.current.exp > 0.5 ? 1 : 0 }
    } else {
      st.current.expTarget = st.current.exp > 0.5 ? 1 : 0
    }
    touch()
  }

  const pick = (i: number) => {
    setActive(i)
    if (st.current.exp < 0.5) setTarget(1)
    else touch()
  }

  const reset = () => {
    const S = st.current
    S.tiltTX = S.tiltTY = S.tiltTR = 0
    setTarget(0)
  }

  if (!projects.length) return null

  return (
    <section aria-label={T.title} className="card mt-10 overflow-hidden sm:mt-14">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200 px-4 py-3 sm:px-6">
        <div>
          <p className="meta">{T.title}</p>
          <p className="text-xs text-neutral-500">{T.dragHint}</p>
        </div>
        <button onClick={() => setTarget(exploded ? 0 : 1)} className="btn-outline px-4 py-2 text-xs">
          {exploded ? T.assemble : T.explode}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Engine SVG — drag = scrub ledak, gerak pointer = tilt */}
        <div
          className="cursor-ew-resize touch-pan-y select-none bg-neutral-50/60 lg:col-span-3"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onTiltLeave}
          role="slider"
          aria-label={T.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(st.current.exp * 100)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setTarget(st.current.expTarget + 0.1)
            if (e.key === 'ArrowLeft') setTarget(st.current.expTarget - 0.1)
          }}
        >
          <svg data-engine-svg viewBox="0 0 640 360" className="block h-auto w-full" role="img">
            {/* dot-grid ripple */}
            <g fill="#d4d4d4">
              {dots.map((d, i) => (
                <circle key={i} data-dot cx={d.cx} cy={d.cy} r="2.2" className="eng-dot" />
              ))}
            </g>
            <g data-engine-root>
              {/* aliran udara */}
              <g data-flow opacity="0.55" stroke="#0a0a0a" strokeWidth="2" strokeDasharray="12 12">
                <line data-dash x1="10" y1="150" x2="630" y2="150" />
                <line data-dash x1="10" y1="180" x2="630" y2="180" />
                <line data-dash x1="10" y1="210" x2="630" y2="210" />
              </g>
              {/* intake */}
              <g data-part="intake"><g data-float>
                <path d="M70,120 L110,140 L110,220 L70,240 Z" fill="none" stroke="#0a0a0a" strokeWidth="5" strokeLinejoin="round" />
                <text data-explabel x="30" y="110" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">INTAKE</text>
              </g></g>
              {/* casing atas & bawah */}
              <g data-part="casing-top"><g data-float>
                <path d="M110,140 L420,140 L470,110 L560,110" fill="none" stroke="#0a0a0a" strokeWidth="5" strokeLinecap="round" />
                <text data-explabel x="300" y="70" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">CASING</text>
              </g></g>
              <g data-part="casing-bottom"><g data-float>
                <path d="M110,220 L420,220 L470,250 L560,250" fill="none" stroke="#0a0a0a" strokeWidth="5" strokeLinecap="round" />
                <text data-explabel x="300" y="300" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">CASING</text>
              </g></g>
              {/* fan — bilah diputar per frame */}
              <g data-part="fan"><g data-float>
                <g transform="translate(185,180)">
                  <g data-blades style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <ellipse rx="8" ry="40" fill="#0a0a0a" opacity="0.85" />
                    <ellipse rx="8" ry="40" fill="#0a0a0a" opacity="0.85" transform="rotate(60)" />
                    <ellipse rx="8" ry="40" fill="#0a0a0a" opacity="0.85" transform="rotate(120)" />
                  </g>
                  <circle r="10" fill="#0a0a0a" />
                  <circle r="4" fill="#fefefe" />
                </g>
                <text data-explabel x="140" y="270" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">FAN</text>
              </g></g>
              {/* core */}
              <g data-part="core"><g data-float>
                <rect x="230" y="150" width="170" height="60" rx="10" fill="none" stroke="#0a0a0a" strokeWidth="5" />
                <line x1="260" y1="150" x2="260" y2="210" stroke="#0a0a0a" strokeWidth="3" />
                <line x1="290" y1="150" x2="290" y2="210" stroke="#0a0a0a" strokeWidth="3" />
                <line x1="320" y1="150" x2="320" y2="210" stroke="#0a0a0a" strokeWidth="3" />
                <line x1="350" y1="150" x2="350" y2="210" stroke="#0a0a0a" strokeWidth="3" />
                <text data-explabel x="255" y="135" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">CORE</text>
              </g></g>
              {/* exhaust + api */}
              <g data-part="exhaust"><g data-float>
                <path d="M400,150 L480,165 L480,195 L400,210 Z" fill="none" stroke="#0a0a0a" strokeWidth="5" strokeLinejoin="round" />
                <path data-flame d="M480,165 L540,180 L480,195 Z" fill="#e11d48" opacity="0.6" style={{ transformBox: 'fill-box', transformOrigin: 'left center' }} />
                <text data-explabel x="470" y="235" fontSize="13" fontFamily="monospace" fill="#8b0000" opacity="0">EXHAUST</text>
              </g></g>
            </g>
          </svg>
          {/* titik part — klik untuk pilih project */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 sm:px-6">
            <button onClick={() => pick((active + items.length - 1) % items.length)} className="btn-outline px-3 py-1.5 text-xs" aria-label="prev">‹</button>
            {items.map((it, i) => (
              <button
                key={it.key}
                onClick={() => pick(i)}
                aria-pressed={i === active}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${i === active ? 'border-ink bg-ink text-paper' : 'border-neutral-300 text-neutral-500 hover:border-ink hover:text-ink'}`}
              >
                {it.label}
              </button>
            ))}
            <button onClick={() => pick((active + 1) % items.length)} className="btn-outline px-3 py-1.5 text-xs" aria-label="next">›</button>
          </div>
        </div>

        {/* Kartu project aktif + kontrol animasi */}
        <div className="border-t border-neutral-200 p-4 sm:p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          <div ref={cardRef}>
            <p className="meta">{T.hint} — {current?.label}</p>
            {current?.project && (
              <div key={current.project.id + active}>
                {current.project.image ? <img src={current.project.image} alt={current.project.title} className="thumb mt-3 rounded-xl" loading="lazy" /> : null}
                <h3 className="mt-3 text-lg font-bold leading-snug">{current.project.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{current.project.description}</p>
                <Tags items={current.project.tech || []} />
                <Link to={`/work/${encodeURIComponent(current.project.id)}`} className="btn mt-4 w-full sm:w-auto">
                  {s.work.detail}
                </Link>
              </div>
            )}
          </div>

          {/* Kontrol per-frame */}
          <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={() => { touch(); setPlaying(!playing) }} className="btn-outline px-3 py-1.5 text-xs" aria-pressed={playing}>
                {playing ? T.pause : T.play}
              </button>
              <button onClick={() => { touch(); setAuto(!auto) }} className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${auto ? 'border-ink bg-ink text-paper' : 'border-neutral-300 text-neutral-500'}`} aria-pressed={auto}>
                {T.auto}
              </button>
              <button onClick={reset} className="btn-outline px-3 py-1.5 text-xs">{T.reset}</button>
            </div>
            <label className="block">
              <span className="field-label">{T.boom}</span>
              <input
                ref={expSliderRef}
                type="range" min={0} max={100} defaultValue={0}
                className="w-full accent-black"
                onChange={(e) => setTarget(Number(e.target.value) / 100)}
              />
            </label>
            <label className="block">
              <span className="field-label">{T.speed} — {speed.toFixed(1)}×</span>
              <input
                type="range" min={0} max={2} step={0.1} value={speed}
                className="w-full accent-black"
                onChange={(e) => { touch(); setSpeed(Number(e.target.value)) }}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
