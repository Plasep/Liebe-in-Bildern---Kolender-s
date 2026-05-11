import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const BUCKET = 'wedding-photos'

export type Photo = {
  guestName: string
  path: string
  url: string
  createdAt: string
}

export async function fetchAllPhotos(): Promise<Photo[]> {
  const { data: rootItems, error } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } })

  if (error || !rootItems) return []

  // Folders have metadata === null; files have a metadata object
  const folders = rootItems.filter(item => item.metadata === null)
  const allPhotos: Photo[] = []

  for (const folder of folders) {
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(folder.name, {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    files?.forEach(file => {
      const {
        data: { publicUrl },
      } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${folder.name}/${file.name}`)

      allPhotos.push({
        guestName: folder.name,
        path: `${folder.name}/${file.name}`,
        url: publicUrl,
        createdAt: file.created_at ?? '',
      })
    })
  }

  return allPhotos
}
