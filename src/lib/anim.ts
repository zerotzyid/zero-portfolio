import { animate, stagger } from 'animejs'

export const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** entrance standar: fade + naik */
export function enterUp(targets: any, delay: any = 0) {
  if (reduced()) return
  animate(targets, { opacity: [0, 1], y: [16, 0], duration: 600, delay, ease: 'outExpo' })
}

/** stagger untuk anak-anak container */
export function staggerIn(container: HTMLElement | null, itemSel = '[data-item]', base = 60) {
  if (!container || reduced()) return
  const items = container.querySelectorAll(itemSel)
  if (!items.length) return
  animate(items, { opacity: [0, 1], y: [22, 0], duration: 650, delay: stagger(base), ease: 'outExpo' })
}

/** pop untuk kartu/modal */
export function popIn(target: any) {
  if (reduced()) return
  animate(target, { opacity: [0, 1], scale: [0.96, 1], y: [10, 0], duration: 450, ease: 'outBack' })
}

/** shake untuk error */
export function shakeX(target: any) {
  if (reduced()) return
  animate(target, { x: [0, -8, 8, -5, 5, 0], duration: 450, ease: 'inOutQuad' })
}

/** garis hero: scaleX 0 -> 1 */
export function lineIn(target: any, delay = 250) {
  if (reduced()) return
  animate(target, { scaleX: [0, 1], duration: 800, delay, ease: 'outExpo' })
}

/** transisi antar halaman: fade + naik, dipicu tiap pathname berubah */
export function pageIn(target: any) {
  if (!target || reduced()) return
  animate(target, { opacity: [0, 1], y: [14, 0], duration: 550, ease: 'outExpo' })
}

/** loop mengambang halus (bolak-balik, inOutSine) — ornamen, avatar, orbs */
export function loopFloat(target: any, dy = 12, duration = 3200, delay = 0) {
  if (!target || reduced()) return
  return animate(target, { y: [-dy / 2, dy / 2], duration, delay, ease: 'inOutSine', loop: true, alternate: true })
}

/** loop geser horizontal halus — wave background */
export function loopDrift(target: any, dx = 40, duration = 9000, delay = 0) {
  if (!target || reduced()) return
  return animate(target, { x: [-dx, dx], duration, delay, ease: 'inOutSine', loop: true, alternate: true })
}
