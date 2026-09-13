import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'id' | 'en'

const KEY = 'zp_lang'

const STR = {
  id: {
    nav: { home: 'Home', work: 'Work', about: 'Tentang', experiments: 'Eksperimen', contact: 'Kontak', menu: 'Menu', admin: '/admin', logout: 'logout' },
    common: { loading: 'Memuat', back: 'Kembali', notFoundTitle: '404', notFoundText: 'Halaman tidak ditemukan.' },
    home: {
      meta: (handle: string, role: string) => `${handle} — ${role.toUpperCase()}`,
      hello: (name: string) => `Halo, saya ${name}.`,
      taglineDefault: 'Saya membangun sistem web yang cepat & rapi.',
      viewWork: 'Lihat Work', contactMe: 'Hubungi Saya',
      featured: 'Featured', viewAll: 'Semua →',
      engine: { title: 'ENGINE / PROJECTS', hint: 'Part terpilih', assemble: 'Rakit', explode: 'Ledakkan', dragHint: 'Geser engine untuk membongkar · gerakkan pointer untuk tilt · klik part untuk lihat project', play: 'Jeda', pause: 'Putar', auto: 'Otomatis', speed: 'Kecepatan', boom: 'Ledakan', reset: 'Atur ulang' },
    },
    work: {
      kicker: 'WORK / 01', title: 'Work', desc: 'Project production dan in-progress.',
      searchPh: 'Cari project / tech...', allStatus: 'Semua status',
      empty: 'Tidak ada project yang cocok.', visit: 'Kunjungi →', detail: 'Detail →',
    },
    workDetail: {
      back: '← Semua Work', notFound: 'Project tidak ditemukan.',
      visit: 'Kunjungi situs →', tech: 'Tech', status: 'Status',
    },
    about: {
      kicker: 'ABOUT / 02', title: 'Tentang Saya',
      bioDefault: 'Developer yang fokus ke infrastruktur + frontend.',
      stack: 'Stack', skills: 'Skills', experience: 'Pengalaman',
    },
    experiments: {
      kicker: 'EXPERIMENTS / 03', title: 'Eksperimen', desc: 'Eksperimen teknis dan side project.',
    },
    contact: {
      kicker: 'CONTACT / 04', title: 'Kontak', desc: 'Punya project atau butuh maintenance server? Hubungi saya.',
      email: 'Email', links: 'Links', sendMsg: 'Kirim Pesan',
      name: 'Nama', namePh: 'Nama kamu', emailPh: 'email@contoh.com', message: 'Pesan', messagePh: 'Ceritakan kebutuhanmu...',
      send: 'Kirim Pesan', sending: 'Mengirim', sent: 'Pesan terkirim. Terima kasih!',
      needName: 'Isi nama dan pesan dulu.', fail: (m: string) => `Gagal: ${m}`,
      status: (s: string) => `Status: ${s}`, statusDefault: 'available untuk freelance',
    },
  },
  en: {
    nav: { home: 'Home', work: 'Work', about: 'About', experiments: 'Experiments', contact: 'Contact', menu: 'Menu', admin: '/admin', logout: 'logout' },
    common: { loading: 'Loading', back: 'Back', notFoundTitle: '404', notFoundText: 'Page not found.' },
    home: {
      meta: (handle: string, role: string) => `${handle} — ${role.toUpperCase()}`,
      hello: (name: string) => `Hi, I'm ${name}.`,
      taglineDefault: 'I build fast & tidy web systems.',
      viewWork: 'View Work', contactMe: 'Contact Me',
      featured: 'Featured', viewAll: 'View all →',
      engine: { title: 'ENGINE / PROJECTS', hint: 'Selected part', assemble: 'Assemble', explode: 'Explode', dragHint: 'Drag the engine to explode · move pointer to tilt · click a part to view its project', play: 'Pause', pause: 'Play', auto: 'Auto', speed: 'Speed', boom: 'Explosion', reset: 'Reset' },
    },
    work: {
      kicker: 'WORK / 01', title: 'Work', desc: 'Production and in-progress projects.',
      searchPh: 'Search projects / tech...', allStatus: 'All statuses',
      empty: 'No matching projects.', visit: 'Visit →', detail: 'Details →',
    },
    workDetail: {
      back: '← All Work', notFound: 'Project not found.',
      visit: 'Visit site →', tech: 'Tech', status: 'Status',
    },
    about: {
      kicker: 'ABOUT / 02', title: 'About Me',
      bioDefault: 'Developer focused on infrastructure + frontend.',
      stack: 'Stack', skills: 'Skills', experience: 'Experience',
    },
    experiments: {
      kicker: 'EXPERIMENTS / 03', title: 'Experiments', desc: 'Technical experiments and side projects.',
    },
    contact: {
      kicker: 'CONTACT / 04', title: 'Contact', desc: 'Have a project or need server maintenance? Get in touch.',
      email: 'Email', links: 'Links', sendMsg: 'Send a Message',
      name: 'Name', namePh: 'Your name', emailPh: 'email@example.com', message: 'Message', messagePh: 'Tell me about your needs...',
      send: 'Send Message', sending: 'Sending', sent: 'Message sent. Thank you!',
      needName: 'Please fill in name and message first.', fail: (m: string) => `Failed: ${m}`,
      status: (s: string) => `Status: ${s}`, statusDefault: 'available for freelance',
    },
  },
} as const

type Strings = typeof STR.id

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; s: Strings }>({ lang: 'id', setLang: () => {}, s: STR.id })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(KEY) === 'en' ? 'en' : 'id'))
  useEffect(() => {
    localStorage.setItem(KEY, lang)
    document.documentElement.lang = lang
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, s: STR[lang] as unknown as Strings }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200 text-xs font-semibold" role="group" aria-label="Language">
      {(['id', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-[36px] px-2.5 uppercase transition-colors ${lang === l ? 'bg-ink text-paper' : 'text-neutral-500 hover:text-ink'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
