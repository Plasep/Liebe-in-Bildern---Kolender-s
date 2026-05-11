import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isAdminName } from '../lib/supabase'

const ADMIN_SESSION_KEY = 'kolender_admin'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  displayName: string
  signOut: () => Promise<void>
  unlockAdmin: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  displayName: '',
  signOut: async () => {},
  unlockAdmin: () => {},
})

function getDisplayName(user: User | null): string {
  if (!user) return ''
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    ''
  )
}

function readAdminSession(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminSession, setAdminSession] = useState<boolean>(readAdminSession)

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
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY) } catch { /* ignore */ }
    setAdminSession(false)
    await supabase.auth.signOut()
  }

  const unlockAdmin = () => {
    try { sessionStorage.setItem(ADMIN_SESSION_KEY, '1') } catch { /* ignore */ }
    setAdminSession(true)
  }

  const displayName = getDisplayName(user)
  const isAdmin = adminSession || isAdminName(displayName)

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, displayName, signOut, unlockAdmin }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
