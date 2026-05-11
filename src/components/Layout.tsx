import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { pathname } = useLocation()
  const { user, loading, displayName, signOut } = useAuth()

  const isDayContext = pathname === '/gallery-day' || pathname === '/upload-day'
  const uploadTarget = isDayContext ? '/upload-day' : '/upload'

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-xs tracking-widest uppercase transition-colors hover:text-gold ${
        pathname === to ? 'text-gold' : 'text-charcoal/60'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <header
        className="px-5 sm:px-6 py-4 sm:py-5 border-b border-cream-dark
                   flex flex-col items-center gap-3
                   sm:flex-row sm:justify-between sm:gap-6"
      >
        <Link to="/" className="font-serif text-xl tracking-wide">
          Kolender's
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-6">
          {navLink('/gallery', 'Galerie')}
          {navLink('/gallery-day', 'Hochzeitstag')}

          {!loading && (
            user ? (
              <>
                {navLink(uploadTarget, 'Hochladen')}
                <span className="text-xs text-charcoal/40 font-light hidden md:inline">
                  {displayName}
                </span>
                <button
                  onClick={() => void signOut()}
                  className="text-xs tracking-widest uppercase text-charcoal/60 hover:text-gold transition-colors"
                >
                  Abmelden
                </button>
              </>
            ) : (
              navLink('/login', 'Anmelden')
            )
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-6 py-6 text-center text-xs tracking-wider text-charcoal/40 border-t border-cream-dark">
        Liebe in Bildern &ndash; Kolender's 2026
      </footer>
    </div>
  )
}
