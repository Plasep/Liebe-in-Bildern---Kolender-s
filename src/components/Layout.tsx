import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { pathname } = useLocation()
  const { user, loading, signOut } = useAuth()

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    ?? user?.email
    ?? ''

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
      <header className="px-6 py-5 flex items-center justify-between border-b border-cream-dark">
        <Link to="/" className="font-serif text-xl tracking-wide">
          Kolender's
        </Link>

        <nav className="flex items-center gap-6">
          {navLink('/gallery', 'Galerie')}

          {!loading && (
            user ? (
              <>
                {navLink('/upload', 'Hochladen')}
                <span className="text-xs text-charcoal/40 font-light hidden sm:inline">
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
