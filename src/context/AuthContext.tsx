import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isAdminName } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  displayName: string
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  displayName: '',
  signOut: async () => {},
})

function getDisplayName(user: User | null): string {
  if (!user) return ''
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    ''
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const displayName = getDisplayName(user)
  const isAdmin = isAdminName(displayName)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
