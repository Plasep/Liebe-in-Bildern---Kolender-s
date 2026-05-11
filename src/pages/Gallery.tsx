import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import {
  fetchPhotos,
  getReleaseState,
  deletePhoto,
  nameToFolder,
  GALLERY_LABEL,
  type GalleryKey,
  type Photo,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Props {
  bucketKey?: GalleryKey
}

export default function Gallery({ bucketKey = 'pre' }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-light text-charcoal/50 text-sm animate-pulse">Lädt …</p>
      </div>
    )
  }

  if (!user) {
    const nextParam = `?next=${encodeURIComponent(location.pathname)}`
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="font-serif text-5xl text-gold/30 mb-6">♡</div>
        <h1 className="font-serif text-4xl mb-3">Anmelden erforderlich</h1>
        <p className="text-charcoal/55 font-light max-w-xs mb-10 leading-relaxed">
          Bitte melde dich an, um die Galerie zu sehen.
        </p>
        <Link
          to={`/login${nextParam}`}
          className="px-8 py-3 bg-charcoal text-cream text-xs tracking-widest uppercase
                     hover:bg-charcoal/80 transition-colors"
        >
          Anmelden
        </Link>
      </div>
    )
  }

  return <GalleryContent bucketKey={bucketKey} />
}

function GalleryContent({ bucketKey }: { bucketKey: GalleryKey }) {
  const { displayName, isAdmin } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [released, setReleased] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const isDay = bucketKey === 'day'
  const canSeeAll = released || isAdmin
  const dayLocked = isDay && !canSeeAll

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const isReleased = await getReleaseState(bucketKey)
      if (cancelled) return
      setReleased(isReleased)

      const seeAll = isReleased || isAdmin

      // Day gallery is fully gated for non-admins until release
      if (bucketKey === 'day' && !seeAll) {
        setPhotos([])
        setLoading(false)
        return
      }

      const folder = seeAll ? undefined : nameToFolder(displayName)
      const data = await fetchPhotos(bucketKey, folder)
      if (cancelled) return
      setPhotos(data)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [bucketKey, displayName, isAdmin])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-light text-charcoal/50 text-sm animate-pulse">Fotos werden geladen …</p>
      </div>
    )
  }

  if (dayLocked) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-gold mb-4 font-light">
          {GALLERY_LABEL.day}
        </p>
        <div className="font-serif text-5xl text-gold/30 mb-6">♡</div>
        <h1 className="font-serif text-4xl mb-3">Galerie nicht freigegeben</h1>
        <p className="text-charcoal/55 font-light max-w-sm mb-10 leading-relaxed">
          Diese Galerie wird vom Brautpaar nach der Hochzeit freigegeben.
          Du kannst aber jetzt schon Fotos hochladen.
        </p>
        <Link
          to="/upload-day"
          className="px-8 py-3 bg-charcoal text-cream text-xs tracking-widest uppercase
                     hover:bg-charcoal/80 transition-colors"
        >
          Fotos hochladen
        </Link>
      </div>
    )
  }

  const slides = photos.map(p => ({ src: p.url }))
  const showingOwnOnly = !released && !isAdmin // pre bucket only
  const ownFolder = nameToFolder(displayName)
  const canDelete = (photo: Photo) => isAdmin || photo.guestName === ownFolder

  const handleDelete = async (photo: Photo) => {
    if (!window.confirm('Foto wirklich löschen?')) return
    const { error } = await deletePhoto(bucketKey, photo.path)
    if (error) {
      window.alert('Konnte nicht gelöscht werden: ' + error)
      return
    }
    setPhotos(prev => prev.filter(p => p.path !== photo.path))
  }

  return (
    <div className="px-4 py-14">
      <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-3 font-light">
        {GALLERY_LABEL[bucketKey]}
      </p>
      <h1 className="font-serif text-5xl text-center mb-2">Galerie</h1>
      <p className="text-center text-charcoal/50 font-light text-sm mb-3">
        {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'}
      </p>

      {showingOwnOnly ? (
        <p className="text-center text-charcoal/50 font-light text-xs max-w-sm mx-auto mb-10 leading-relaxed">
          Die Galerie ist noch nicht freigegeben &ndash; du siehst nur deine eigenen Fotos.
          Sobald das Brautpaar die Galerie öffnet, erscheinen hier alle Bilder.
        </p>
      ) : (
        <div className="mb-10" />
      )}

      {photos.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-charcoal/35 font-light">
            {showingOwnOnly
              ? 'Du hast noch keine Fotos hochgeladen.'
              : 'Noch keine Fotos hochgeladen.'}
          </p>
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
              {canDelete(photo) && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    void handleDelete(photo)
                  }}
                  aria-label="Foto löschen"
                  title="Foto löschen"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full
                             bg-black/55 text-white text-sm leading-none
                             flex items-center justify-center
                             opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                             hover:bg-red-600 transition-all"
                >
                  ✕
                </button>
              )}
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
