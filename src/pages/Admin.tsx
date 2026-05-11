import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import PasswordGate from '../components/PasswordGate'
import {
  fetchPhotos,
  getReleaseState,
  setReleaseState,
  GALLERY_LABEL,
  type GalleryKey,
  type Photo,
} from '../lib/supabase'

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const pw = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined

  if (!pw) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-charcoal/40 font-light text-sm">
        Admin ist noch nicht konfiguriert.
      </div>
    )
  }

  if (!unlocked) {
    return <PasswordGate title="Admin" password={pw} onUnlock={() => setUnlocked(true)} />
  }

  return <AdminContent />
}

function AdminContent() {
  const [active, setActive] = useState<GalleryKey>('pre')

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-3 font-light">
        Brautpaar
      </p>
      <h1 className="font-serif text-5xl text-center mb-10">Admin</h1>

      <div className="flex justify-center gap-2 mb-12">
        <TabButton active={active === 'pre'} onClick={() => setActive('pre')}>
          {GALLERY_LABEL.pre}
        </TabButton>
        <TabButton active={active === 'day'} onClick={() => setActive('day')}>
          {GALLERY_LABEL.day}
        </TabButton>
      </div>

      <BucketSection key={active} bucketKey={active} />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-xs tracking-widest uppercase border transition-colors ${
        active
          ? 'bg-charcoal text-cream border-charcoal'
          : 'bg-transparent text-charcoal/60 border-cream-dark hover:border-gold hover:text-gold'
      }`}
    >
      {children}
    </button>
  )
}

function BucketSection({ bucketKey }: { bucketKey: GalleryKey }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [released, setReleased] = useState(false)
  const [releaseBusy, setReleaseBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const uploadPath = bucketKey === 'pre' ? '/upload' : '/upload-day'
  const uploadUrl = `${window.location.href.split('#')[0]}#/register?next=${encodeURIComponent(uploadPath)}`
  const zipName = bucketKey === 'pre' ? 'kolenders-hochzeit.zip' : 'kolenders-hochzeitstag.zip'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [data, rel] = await Promise.all([
        fetchPhotos(bucketKey),
        getReleaseState(bucketKey),
      ])
      if (cancelled) return
      setPhotos(data)
      setReleased(rel)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [bucketKey])

  const guests = [...new Set(photos.map(p => p.guestName))]

  const toggleRelease = async () => {
    setReleaseBusy(true)
    const target = !released
    const { error } = await setReleaseState(bucketKey, target)
    if (!error) setReleased(target)
    else alert('Konnte Status nicht ändern: ' + error)
    setReleaseBusy(false)
  }

  const handleDownload = async () => {
    if (photos.length === 0) return
    setDownloading(true)
    setDownloadProgress(0)

    const zip = new JSZip()
    for (let i = 0; i < photos.length; i++) {
      try {
        const res = await fetch(photos[i].url)
        const blob = await res.blob()
        zip.file(photos[i].path.replace('/', '_'), blob)
      } catch {
        // skip individual failed files
      }
      setDownloadProgress(Math.round(((i + 1) / photos.length) * 100))
    }

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, zipName)
    setDownloading(false)
  }

  return (
    <>
      {/* Release toggle */}
      <div className="border border-cream-dark bg-white p-6 mb-12">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-serif text-2xl mb-1">Galerie freigeben</h2>
            <p className="text-charcoal/50 font-light text-sm">
              {released
                ? 'Alle Gäste sehen aktuell alle Fotos.'
                : 'Gäste sehen aktuell nur ihre eigenen Fotos.'}
            </p>
          </div>
          <span
            className={`text-xs tracking-widest uppercase whitespace-nowrap ${
              released ? 'text-gold' : 'text-charcoal/40'
            }`}
          >
            {released ? 'Freigegeben' : 'Gesperrt'}
          </span>
        </div>
        <button
          onClick={() => void toggleRelease()}
          disabled={releaseBusy}
          className={`w-full py-3 text-xs tracking-widest uppercase transition-colors
                      ${released
                        ? 'border border-charcoal text-charcoal hover:bg-charcoal/5'
                        : 'bg-charcoal text-cream hover:bg-charcoal/80'}
                      disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {releaseBusy
            ? 'Wird gespeichert …'
            : released
            ? 'Freigabe zurücknehmen'
            : 'Galerie für alle freigeben'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-14">
        <div className="bg-white border border-cream-dark p-7 text-center">
          <p className="font-serif text-5xl mb-1">{loading ? '—' : photos.length}</p>
          <p className="text-xs tracking-widest uppercase text-charcoal/50">Fotos</p>
        </div>
        <div className="bg-white border border-cream-dark p-7 text-center">
          <p className="font-serif text-5xl mb-1">{loading ? '—' : guests.length}</p>
          <p className="text-xs tracking-widest uppercase text-charcoal/50">Gäste</p>
        </div>
      </div>

      {/* Download */}
      <div className="mb-14">
        <h2 className="font-serif text-2xl mb-1">Alle Fotos herunterladen</h2>
        <p className="text-charcoal/50 font-light text-sm mb-5">
          Alle Fotos werden als ZIP-Datei gespeichert.
        </p>

        {downloading ? (
          <div>
            <div className="h-0.5 bg-cream-dark mb-3 overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-sm text-charcoal/55 font-light">
              {downloadProgress}% – Bitte warten …
            </p>
          </div>
        ) : (
          <button
            onClick={() => void handleDownload()}
            disabled={photos.length === 0 || loading}
            className="w-full py-4 bg-charcoal text-cream text-xs tracking-widest uppercase
                       hover:bg-charcoal/80 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Lädt …' : `Als ZIP herunterladen (${photos.length} Fotos)`}
          </button>
        )}
      </div>

      {/* QR Code */}
      <div className="text-center">
        <h2 className="font-serif text-2xl mb-2">QR-Code</h2>
        <p className="text-charcoal/50 font-light text-sm mb-8 max-w-xs mx-auto">
          {bucketKey === 'pre'
            ? 'QR-Code für die Zeit bis zur Hochzeit.'
            : 'QR-Code für den Hochzeitstag – an den Tischen aufstellen.'}
        </p>
        <div className="inline-block p-8 bg-white border border-cream-dark">
          <QRCodeSVG value={uploadUrl} size={220} level="H" includeMargin={false} />
        </div>
        <p className="text-xs text-charcoal/35 mt-4 break-all font-light">{uploadUrl}</p>
      </div>
    </>
  )
}
