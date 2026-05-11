import { Link } from 'react-router-dom'

const steps = [
  { step: '01', title: 'QR-Code scannen', desc: 'Scanne den QR-Code mit deinem Smartphone' },
  { step: '02', title: 'Fotos auswählen', desc: 'Wähle deine schönsten Aufnahmen aus der Galerie' },
  { step: '03', title: 'Hochladen & fertig', desc: 'Deine Fotos erscheinen in unserer Galerie' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="min-h-[82vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-gold mb-5 font-light">
          Liebe in Bildern
        </p>
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl mb-6 leading-none">
          Kolender's
        </h1>
        <p className="text-charcoal/55 text-base font-light max-w-sm mb-12 leading-relaxed">
          Teile deine schönsten Momente von unserem großen Tag – für uns und alle, die dabei waren.
        </p>
        <Link
          to="/upload"
          className="inline-block px-12 py-4 bg-charcoal text-cream text-xs tracking-widest uppercase
                     hover:bg-charcoal/80 transition-colors"
        >
          Fotos hochladen
        </Link>
      </section>

      <div className="h-px bg-cream-dark mx-8" />

      {/* How it works */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-4 font-light">
          Anleitung
        </p>
        <h2 className="font-serif text-4xl md:text-5xl text-center mb-20">So funktioniert es</h2>
        <div className="grid md:grid-cols-3 gap-14 text-center">
          {steps.map(({ step, title, desc }) => (
            <div key={step}>
              <p className="font-serif text-6xl text-gold/25 mb-4 leading-none">{step}</p>
              <h3 className="font-serif text-xl mb-3">{title}</h3>
              <p className="text-charcoal/55 font-light text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
