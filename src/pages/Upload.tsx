import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { supabase, BUCKET } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type State = 'idle' | 'uploading' | 'success' | 'error'

export default function Upload() {
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
          Bitte melde dich an oder registriere dich, um Fotos hochzuladen.
        </p>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-8 py-3 bg-charcoal text-cream text-xs tracking-widest uppercase
                       hover:bg-charcoal/80 transition-colors"
          >
            Anmelden
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 border border-charcoal text-xs tracking-widest uppercase
                       hover:bg-charcoal/5 transition-colors"
          >
            Registrieren
          </Link>
        </div>
      </div>
    )
  }

  return <UploadForm user={user} />
}

function UploadForm({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const guestName =
    (user.user_metadata?.display_name as string | undefined) || user.email || 'Gast'

  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [state, setState] = useState<State>('idle')
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (fileList: FileList) => {
    const images = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...images])
    images.forEach(f => setPreviews(prev => [...prev, URL.createObjectURL(f)]))
  }

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i])
    setFiles(prev => prev.filter((_, j) => j !== i))
    setPreviews(prev => prev.filter((_, j) => j !== i))
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
  }

  const reset = () => {
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles([])
    setPreviews([])
    setState('idle')
    setProgress(0)
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setState('uploading')
    setProgress(0)

    const safeName = guestName.replace(/[^\w\säöüÄÖÜß-]/g, '').trim() || 'Gast'

    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await imageCompression(files[i], {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2560,
          useWebWorker: true,
          fileType: 'image/jpeg',
        })

        const path = `${safeName}/${Date.now() + i}.jpg`
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { contentType: 'image/jpeg' })

        if (error) throw error
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-[72vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="font-serif text-5xl text-gold mb-6">♡</div>
        <h1 className="font-serif text-4xl mb-3">Vielen Dank!</h1>
        <p className="text-charcoal/55 font-light mb-10">
          {files.length === 1
            ? '1 Foto wurde erfolgreich hochgeladen.'
            : `${files.length} Fotos wurden erfolgreich hochgeladen.`}
        </p>
        <button
          onClick={reset}
          className="text-xs tracking-widest uppercase underline underline-offset-4
                     hover:text-gold transition-colors"
        >
          Weitere Fotos hochladen
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <p className="text-xs tracking-[0.4em] uppercase text-gold text-center mb-3 font-light">
        Eure Momente
      </p>
      <h1 className="font-serif text-5xl text-center mb-2">Fotos hochladen</h1>
      <p className="text-center text-charcoal/55 font-light mb-2 text-sm">
        Teile deine schönsten Aufnahmen mit uns
      </p>
      <p className="text-center text-charcoal/40 font-light mb-12 text-xs">
        Hochgeladen als: <span className="text-charcoal/60">{guestName}</span>
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed py-14 px-6 text-center cursor-pointer
                    transition-colors mb-5 select-none
                    ${isDragging
                      ? 'border-gold bg-gold/5'
                      : 'border-cream-dark hover:border-gold hover:bg-gold/5'}`}
      >
        <p className="text-4xl mb-3 text-charcoal/20 font-light">+</p>
        <p className="font-light text-charcoal/60 text-sm">
          Fotos hier ablegen oder{' '}
          <span className="underline underline-offset-2">auswählen</span>
        </p>
        <p className="text-xs text-charcoal/35 mt-2">JPG, PNG, HEIC – mehrere möglich</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-7">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-square group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeFile(i)}
                aria-label="Entfernen"
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white text-xs
                           opacity-0 group-hover:opacity-100 transition-opacity
                           flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {state === 'error' && (
        <p className="text-red-400 text-sm text-center mb-5">
          Fehler beim Hochladen. Bitte versuche es erneut.
        </p>
      )}

      {state === 'uploading' ? (
        <div className="text-center">
          <div className="h-0.5 bg-cream-dark mb-3 overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-charcoal/55 font-light">Hochladen … {progress}%</p>
        </div>
      ) : (
        <button
          onClick={() => void handleUpload()}
          disabled={files.length === 0}
          className="w-full py-4 bg-charcoal text-cream text-xs tracking-widest uppercase
                     hover:bg-charcoal/80 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {files.length > 0
            ? `${files.length} ${files.length === 1 ? 'Foto' : 'Fotos'} hochladen`
            : 'Fotos auswählen'}
        </button>
      )}
    </div>
  )
}
