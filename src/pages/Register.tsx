import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1. Prüfen ob E-Mail auf der Gästeliste steht
    const { data: allowed, error: rpcError } = await supabase.rpc('check_guest_allowed', {
      guest_email: email.toLowerCase().trim(),
    })

    if (rpcError || !allowed) {
      setError('Diese E-Mail-Adresse ist nicht auf der Gästeliste.')
      setLoading(false)
      return
    }

    // 2. Konto anlegen
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name.trim() },
      },
    })

    if (signUpError) {
      setError('Fehler: ' + signUpError.message)
      setLoading(false)
      return
    }

    navigate('/upload')
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-4 font-light">
          Einmalig
        </p>
        <h1 className="font-serif text-4xl text-center mb-2">Registrieren</h1>
        <p className="text-center text-charcoal/55 font-light text-sm mb-10">
          Nutze die E-Mail-Adresse, mit der du eingeladen wurdest
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
              placeholder="Maria Mustermann"
              required
              autoFocus
              className="w-full px-4 py-3 bg-white border border-cream-dark outline-none
                         focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2 text-charcoal/55">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="maria@beispiel.de"
              required
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
            to="/login"
            className="underline underline-offset-2 hover:text-gold transition-colors"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
