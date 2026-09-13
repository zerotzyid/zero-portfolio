import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { loopFloat, loopDrift, loopDriftXY, reduced } from '../lib/anim'

/**
 * Latar global: grid + wave + orbs, semuanya smooth & ringan.
 * - Grid: drift diagonal + pulse opacity (transform/opacity-only, alternate loop).
 * - Wave: 2 lapis drift horizontal bolak-balik (transform-only, alternate loop).
 * - Orbs: 2 blob radial float vertikal lambat.
 * Semua fixed ke viewport, pointer-events-none, hormati reduced-motion.
 */
export function Backdrop() {
  const grid = useRef<HTMLDivElement>(null)
  const w1 = useRef<HTMLDivElement>(null)
  const w2 = useRef<HTMLDivElement>(null)
  const o1 = useRef<HTMLDivElement>(null)
  const o2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced()) return
    const cleanups = [
      // grid: geser diagonal pelan 1 sel (44px) + napas opacity
      loopDriftXY(grid.current, 22, 14000),
      ...(grid.current ? [animate(grid.current, { opacity: [0.55, 1], duration: 6000, ease: 'inOutSine', loop: true, alternate: true })] : []),
      loopDrift(w1.current, 60, 11000),
      loopDrift(w2.current, 90, 15000, 1200),
      loopFloat(o1.current, 36, 7000),
      loopFloat(o2.current, 48, 9000, 1500),
    ].filter(Boolean) as { revert: () => void }[]
    return () => cleanups.forEach((c) => c?.revert?.())
  }, [])

  return (
    <>
      {/* Grid faint — drift + pulse halus, di-fade radial agar tidak mengganggu teks */}
      <div ref={grid} aria-hidden className="bg-grid-anim pointer-events-none fixed inset-[-60px] -z-10" />
      {/* Orbs lembut — blob radial blur */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div ref={o1} className="orb orb-a" />
        <div ref={o2} className="orb orb-b" />
      </div>
      {/* Wave bawah — drift horizontal halus, fixed ke bawah viewport */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-40 overflow-hidden sm:h-56">
        <div ref={w1} className="absolute bottom-0 left-[-5%] w-[110%]">
          <svg className="block h-40 w-full sm:h-56" viewBox="0 0 2880 160" preserveAspectRatio="none">
            <path
              d="M0,96 C240,128 480,64 720,88 C960,112 1200,128 1440,96 C1680,64 1920,64 2160,88 C2400,112 2640,112 2880,88 L2880,160 L0,160 Z"
              fill="#0a0a0a"
              fillOpacity="0.05"
            />
          </svg>
        </div>
        <div ref={w2} className="absolute bottom-0 left-[-5%] w-[110%]">
          <svg className="block h-40 w-full sm:h-56" viewBox="0 0 2880 160" preserveAspectRatio="none">
            <path
              d="M0,112 C260,80 520,128 780,104 C1040,80 1300,64 1560,88 C1820,112 2080,128 2340,104 C2520,88 2700,88 2880,100 L2880,160 L0,160 Z"
              fill="#8b0000"
              fillOpacity="0.07"
            />
          </svg>
        </div>
      </div>
    </>
  )
}
