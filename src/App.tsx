import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Work from './pages/Work'
import WorkDetail from './pages/WorkDetail'
import About from './pages/About'
import Experiments from './pages/Experiments'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { BackHome } from './components/ui'
import { useLang, LangToggle } from './lib/i18n'
import { Splash, PageTransition } from './components/motion'
import { Backdrop } from './components/Backdrop'
import { useResource } from './lib/useResource'
import { useAuth } from './lib/auth'
import { Spinner } from './components/Loader'

const LINKS: [string, 'home' | 'work' | 'about' | 'experiments' | 'contact'][] = [
  ['/', 'home'], ['/work', 'work'], ['/about', 'about'],
  ['/experiments', 'experiments'], ['/contact', 'contact'],
]

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth()
  if (!ready) return <div className="flex items-center justify-center gap-2 py-20 text-neutral-500"><Spinner /> Memeriksa session...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

function Nav() {
  const loc = useLocation()
  const { s } = useLang()
  const site = useResource<any>('/api/site', { brand: 'ZeroTzy.ID' })
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (headRef.current) animate(headRef.current, { y: [-46, 0], opacity: [0, 1], duration: 650, ease: 'outExpo' })
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const hideNav = loc.pathname.startsWith('/admin')
  if (hideNav) return null
  return (
    <header ref={headRef} className={`nav-shell sticky top-0 z-40 border-b bg-paper/95 backdrop-blur ${scrolled ? 'nav-scrolled border-neutral-300' : 'border-neutral-200'}`}>
      <div className={`wrap flex items-center justify-between gap-2 transition-all duration-300 ${scrolled ? 'h-12' : 'h-14'}`}>
        <Link to="/" className={`font-extrabold tracking-tight transition-all duration-300 ${scrolled ? 'text-sm' : 'text-base'}`} onClick={() => setOpen(false)}>
          {site.data.brand || 'ZeroTzy.ID'}
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {LINKS.map(([to, key]) => (
            <Link key={to} to={to} className={`nav-link ${loc.pathname === to ? 'nav-link-active' : ''}`}>{s.nav[key]}</Link>
          ))}
          {user && <Link to="/admin" className="nav-link font-mono text-xs">{s.nav.admin}</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <button className="flex min-h-[44px] min-w-[44px] items-center justify-center md:hidden" aria-label={s.nav.menu} onClick={() => setOpen(!open)}>
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          )}
        </button>
        </div>
      </div>
      {open && (
        <nav className="drawer-enter border-t border-neutral-200 bg-paper md:hidden">
          {LINKS.map(([to, key]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`block border-b border-neutral-100 px-5 py-3.5 text-[15px] ${loc.pathname === to ? 'font-semibold text-ink' : 'text-neutral-600'}`}>
              {s.nav[key]}
            </Link>
          ))}
          {user && <button onClick={() => { logout(); setOpen(false) }} className="block w-full px-5 py-3.5 text-left font-mono text-xs text-neutral-400">{s.nav.logout} ({user})</button>}
        </nav>
      )}
    </header>
  )
}

export default function App() {
  const site = useResource<any>('/api/site', {})
  const loc = useLocation()
  const hideFooter = loc.pathname.startsWith('/admin')
  const [boot, setBoot] = useState(() => !sessionStorage.getItem('zp_boot'))
  const doneBoot = () => { sessionStorage.setItem('zp_boot', '1'); setBoot(false) }

  return (
    <div className="flex min-h-dvh flex-col">
      <Backdrop />
      {boot && <Splash onDone={doneBoot} />}
      <Nav />
      <main className="wrap flex-1 py-8 sm:py-12">
        <PageTransition routeKey={loc.pathname}>
          <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:id" element={<WorkDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/*" element={<RequireAuth><Admin /></RequireAuth>} />
          <Route path="*" element={<BackHome />} />
          </Routes>
        </PageTransition>
      </main>
      {!hideFooter && (
        <footer className="border-t border-neutral-200">
          <div className="wrap flex flex-col gap-1 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-neutral-500">{site.data.footer || '© 2026 ZeroTzy.ID'}</p>
          </div>
        </footer>
      )}
    </div>
  )
}
