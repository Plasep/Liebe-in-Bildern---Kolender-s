import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, nameToEmail } from '../lib/supabase'

const SAFE_NEXT = /^\/[a-z0-9/_-]*$/i

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextRaw = params.get('next')
  const next = nextRaw && SAFE_NEXT.test(nextRaw) ? nextRaw : '/upload'
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedName = name.trim()

    // 1. Prüfen ob Name auf der Gästeliste steht
    const { data: allowed, error: rpcError } = await supabase.rpc('check_guest_allowed', {
      guest_name: trimmedName,
    })

    if (rpcError || !allowed) {
      setError('Dieser Name ist nicht auf der Gästeliste.')
      setLoading(false)
      return
    }

    // 2. Konto anlegen (interne Email, für Gast unsichtbar)
    const { error: signUpError } = await supabase.auth.signUp({
      email: nameToEmail(trimmedName),
      password,
      options: {
        data: { display_name: trimmedName },
      },
    })

    if (signUpError) {
      setError('Fehler: ' + signUpError.message)
      setLoading(false)
      return
    }

    navigate(next)
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-4 font-light">
          Einmalig
        </p>
        <h1 className="font-serif text-4xl text-center mb-2">Registrieren</h1>
        <p className="text-center text-charcoal/55 font-light text-sm mb-10">
          Gib deinen Namen ein, genau wie du eingeladen wurdest
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2 text-charcoal/55">
              Dein Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z. B. Maria Mustermann"
              required
              autoFocus
              className="w-full px-4 py-3 bg-white border border-cream-dark outline-none
                         focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2 text-charcoal/55">
              Passwort wählen
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white border border-cream-dark outline-none
                         focus:border-gold transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-charcoal text-cream text-xs tracking-widest uppercase
                       hover:bg-charcoal/80 transition-colors disabled:opacity-40"
          >
            {loading ? 'Wird geprüft …' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-sm font-light mt-6 text-charcoal/55">
          Bereits registriert?{' '}
          <Link
            to={`/login${nextRaw ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="underline underline-offset-2 hover:text-gold transition-colors"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
