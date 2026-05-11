import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import PasswordGate from '../components/PasswordGate'
import { fetchAllPhotos, type Photo } from '../lib/supabase'

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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const uploadUrl = `${window.location.href.split('#')[0]}#/upload`

  useEffect(() => {
    fetchAllPhotos().then(data => {
      setPhotos(data)
      setLoading(false)
    })
  }, [])

  const guests = [...new Set(photos.map(p => p.guestName))]

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
    saveAs(content, 'kolenders-hochzeit.zip')
    setDownloading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-3 font-light">
        Brautpaar
      </p>
      <h1 className="font-serif text-5xl text-center mb-12">Admin</h1>

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
            onClick={handleDownload}
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
          Drucke diesen Code für die Hochzeit aus – Gäste scannen und laden direkt hoch.
        </p>
        <div className="inline-block p-8 bg-white border border-cream-dark">
          <QRCodeSVG
            value={uploadUrl}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-xs text-charcoal/35 mt-4 break-all font-light">{uploadUrl}</p>
      </div>
    </div>
  )
}
