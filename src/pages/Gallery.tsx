import { useState, useEffect } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import PasswordGate from '../components/PasswordGate'
import { fetchAllPhotos, type Photo } from '../lib/supabase'

export default function Gallery() {
  const [unlocked, setUnlocked] = useState(false)
  const pw = import.meta.env.VITE_GALLERY_PASSWORD as string | undefined

  if (!pw) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-charcoal/40 font-light text-sm">
        Galerie ist noch nicht konfiguriert.
      </div>
    )
  }

  if (!unlocked) {
    return <PasswordGate title="Galerie" password={pw} onUnlock={() => setUnlocked(true)} />
  }

  return <GalleryContent />
}

function GalleryContent() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGuest, setActiveGuest] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    fetchAllPhotos().then(data => {
      setPhotos(data)
      setLoading(false)
    })
  }, [])

  const guests = [...new Set(photos.map(p => p.guestName))].sort()
  const filtered = activeGuest ? photos.filter(p => p.guestName === activeGuest) : photos
  const slides = filtered.map(p => ({ src: p.url }))

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-light text-charcoal/50 text-sm animate-pulse">Fotos werden geladen …</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-14">
      <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-3 font-light">
        Eure Momente
      </p>
      <h1 className="font-serif text-5xl text-center mb-2">Galerie</h1>
      <p className="text-center text-charcoal/50 font-light text-sm mb-10">
        {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'} von{' '}
        {guests.length} {guests.length === 1 ? 'Gast' : 'Gästen'}
      </p>

      {/* Guest filter */}
      {guests.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {(['Alle', ...guests] as const).map(g => {
            const key = g === 'Alle' ? null : g
            const active = activeGuest === key
            return (
              <button
                key={g}
                onClick={() => setActiveGuest(key)}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors
                            ${active
                              ? 'border-charcoal bg-charcoal text-cream'
                              : 'border-cream-dark hover:border-charcoal'}`}
              >
                {g}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-charcoal/35 font-light">Noch keine Fotos hochgeladen.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 max-w-7xl mx-auto">
          {filtered.map((photo, i) => (
            <div
              key={photo.path}
              className="break-inside-avoid mb-3 group cursor-pointer relative overflow-hidden"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={photo.url}
                alt={`Foto von ${photo.guestName}`}
                className="w-full block transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2
                           bg-gradient-to-t from-black/50 to-transparent
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <p className="text-white text-xs font-light">{photo.guestName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        on={{ view: ({ index: i }) => setLightboxIndex(i) }}
      />
    </div>
  )
}
