import { useState, FormEvent } from 'react'

interface Props {
  onUnlock: () => void
  password: string
  title?: string
}

export default function PasswordGate({ onUnlock, password, title = 'Zugang' }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input === password) {
      onUnlock()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xs text-center">
        <h1 className="font-serif text-4xl mb-2">{title}</h1>
        <p className="text-charcoal/50 font-light text-sm mb-10">
          Bitte gib das Passwort ein
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              setError(false)
            }}
            placeholder="Passwort"
            autoFocus
            className="w-full px-4 py-3 bg-white border border-cream-dark text-center
                       tracking-widest text-lg outline-none focus:border-gold transition-colors"
          />
          {error && (
            <p className="text-red-400 text-sm">Falsches Passwort – bitte erneut versuchen.</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-charcoal text-cream text-xs tracking-widest uppercase
                       hover:bg-charcoal/80 transition-colors"
          >
            Weiter
          </button>
        </form>
      </div>
    </div>
  )
}
