'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { signIn as supabaseSignIn, getCurrentUser, setOnlineStatus, setOfflineStatus, signOut as supabaseSignOut } from '@/lib/auth'

interface AuthContextType {
  authUser: SupabaseUser | null
  appUser: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [appUser, setAppUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { authUser: currentAuthUser, appUser: currentAppUser } = await getCurrentUser()
        setAuthUser(currentAuthUser)
        setAppUser(currentAppUser)

        if (currentAppUser) {
          await setOnlineStatus(currentAppUser.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
        if (session?.user) {
          const { appUser: currentAppUser } = await getCurrentUser()
          setAuthUser(session.user)
          setAppUser(currentAppUser)

          if (currentAppUser) {
            await setOnlineStatus(currentAppUser.id)
          }
        } else {
          if (appUser) {
            await setOfflineStatus(appUser.id)
          }
          setAuthUser(null)
          setAppUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { authUser: newAuthUser, appUser: newAppUser } = await supabaseSignIn(email, password)
    setAuthUser(newAuthUser)
    setAppUser(newAppUser)

    if (newAppUser) {
      await setOnlineStatus(newAppUser.id)
    }
  }

  const signOut = async () => {
    if (appUser) {
      await setOfflineStatus(appUser.id)
    }
    await supabaseSignOut()
    setAuthUser(null)
    setAppUser(null)
  }

  return (
    <AuthContext.Provider value={{ authUser, appUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
