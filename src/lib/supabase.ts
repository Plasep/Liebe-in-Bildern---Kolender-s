import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type GalleryKey = 'pre' | 'day'

export const BUCKETS: Record<GalleryKey, string> = {
  pre: 'wedding-photos',
  day: 'wedding-day-photos',
}

// Backwards-compatible export (used by Upload before refactor)
export const BUCKET = BUCKETS.pre

const SETTINGS_KEY: Record<GalleryKey, string> = {
  pre: 'pre_gallery_released',
  day: 'day_gallery_released',
}

export const GALLERY_LABEL: Record<GalleryKey, string> = {
  pre: 'Vor der Hochzeit',
  day: 'Hochzeitstag',
}

// Converts a guest name to a stable internal email (never shown to user)
export function nameToEmail(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // ä→a, ö→o, ü→u etc.
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
  return `${normalized}@kolenders-hochzeit.de`
}

// Same sanitisation as the Upload page applies before creating the folder name.
// Used to filter photos back to the current user.
export function nameToFolder(name: string): string {
  return name.replace(/[^\w\säöüÄÖÜß-]/g, '').trim() || 'Gast'
}

export function getAdminNames(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_NAMES as string | undefined) ?? ''
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export function isAdminName(displayName: string | undefined | null): boolean {
  if (!displayName) return false
  const admins = getAdminNames().map(n => n.toLowerCase())
  return admins.includes(displayName.trim().toLowerCase())
}

export type Photo = {
  guestName: string
  path: string
  url: string
  createdAt: string
}

/**
 * Fetch photos from a bucket. When `guestFolder` is provided, only that
 * subfolder is listed — used to show a guest only their own uploads.
 */
export async function fetchPhotos(
  bucketKey: GalleryKey,
  guestFolder?: string,
): Promise<Photo[]> {
  const bucket = BUCKETS[bucketKey]

  if (guestFolder) {
    return listFolder(bucket, guestFolder)
  }

  const { data: rootItems, error } = await supabase.storage
    .from(bucket)
    .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } })

  if (error || !rootItems) return []

  const folders = rootItems.filter(item => item.metadata === null)
  const allPhotos: Photo[] = []

  for (const folder of folders) {
    const photos = await listFolder(bucket, folder.name)
    allPhotos.push(...photos)
  }

  return allPhotos
}

async function listFolder(bucket: string, folderName: string): Promise<Photo[]> {
  const { data: files } = await supabase.storage.from(bucket).list(folderName, {
    limit: 500,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (!files) return []

  return files.map(file => {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(`${folderName}/${file.name}`)
    return {
      guestName: folderName,
      path: `${folderName}/${file.name}`,
      url: publicUrl,
      createdAt: file.created_at ?? '',
    }
  })
}

// Kept for compatibility with existing imports
export const fetchAllPhotos = () => fetchPhotos('pre')

/**
 * Reads the release flag for a gallery from the `settings` table.
 * Returns false (locked) if the table doesn't exist yet or the row is missing.
 */
export async function getReleaseState(bucketKey: GalleryKey): Promise<boolean> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY[bucketKey])
    .maybeSingle()

  if (error || !data) return false
  return Boolean(data.value)
}

/** Admin action — writes the release flag. */
export async function setReleaseState(
  bucketKey: GalleryKey,
  value: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: SETTINGS_KEY[bucketKey], value }, { onConflict: 'key' })

  return { error: error?.message ?? null }
}

/**
 * Deletes a single photo from a bucket.
 * The server still needs a storage delete policy — see README.
 */
export async function deletePhoto(
  bucketKey: GalleryKey,
  path: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKETS[bucketKey]).remove([path])
  return { error: error?.message ?? null }
}
