import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, nameToEmail } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: nameToEmail(name.trim()),
      password,
    })

    if (signInError) {
      setError('Name oder Passwort falsch.')
      setLoading(false)
      return
    }

    navigate('/upload')
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-4 font-light">
          Willkommen
        </p>
        <h1 className="font-serif text-4xl text-center mb-2">Anmelden</h1>
        <p className="text-center text-charcoal/55 font-light text-sm mb-10">
          Melde dich an, um Fotos hochzuladen und die Galerie zu sehen
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
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Dein Passwort"
              required
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
            {loading ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm font-light mt-6 text-charcoal/55">
          Noch kein Konto?{' '}
          <Link
            to="/register"
            className="underline underline-offset-2 hover:text-gold transition-colors"
          >
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
