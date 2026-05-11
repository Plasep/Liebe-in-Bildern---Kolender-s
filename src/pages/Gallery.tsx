import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { fetchAllPhotos, type Photo } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Gallery() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-light text-charcoal/50 text-sm animate-pulse">Lädt …</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="font-serif text-5xl text-gold/30 mb-6">♡</div>
        <h1 className="font-serif text-4xl mb-3">Anmelden erforderlich</h1>
        <p className="text-charcoal/55 font-light max-w-xs mb-10 leading-relaxed">
          Bitte melde dich an, um die Galerie zu sehen.
        </p>
        <Link
          to="/login"
          className="px-8 py-3 bg-charcoal text-cream text-xs tracking-widest uppercase
                     hover:bg-charcoal/80 transition-colors"
        >
          Anmelden
        </Link>
      </div>
    )
  }

  return <GalleryContent />
}

function GalleryContent() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    fetchAllPhotos().then(data => {
      setPhotos(data)
      setLoading(false)
    })
  }, [])

  const slides = photos.map(p => ({ src: p.url }))

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
        {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'}
      </p>


      {photos.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-charcoal/35 font-light">Noch keine Fotos hochgeladen.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 max-w-7xl mx-auto">
          {photos.map((photo, i) => (
            <div
              key={photo.path}
              className="break-inside-avoid mb-3 group cursor-pointer relative overflow-hidden"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={photo.url}
                alt="Hochzeitsfoto"
                className="w-full block transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
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
