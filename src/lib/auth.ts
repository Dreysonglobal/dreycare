import { supabase } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please refresh the page.')
  }
}

export async function signIn(email: string, password: string) {
  checkSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // Get user role from users table
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      throw userError
    }

    return { authUser: data.user, appUser: userData as User }
  }

  return { authUser: data.user, appUser: null }
}

export async function signOut() {
  checkSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  checkSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting current user:', error)
    return { authUser: null, appUser: null }
  }

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    return { authUser: user, appUser: userData as User }
  }

  return { authUser: null, appUser: null }
}

export async function setOnlineStatus(userId: string) {
  checkSupabase()
  try {
    await supabase.from('online_users').upsert({
      user_id: userId,
      last_seen: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    await supabase.from('users').update({ is_online: true }).eq('id', userId)
  } catch (error) {
    console.error('Error setting online status:', error)
  }
}

export async function setOfflineStatus(userId: string) {
  checkSupabase()
  try {
    await supabase.from('online_users').delete().eq('user_id', userId)
    await supabase.from('users').update({ is_online: false }).eq('id', userId)
  } catch (error) {
    console.error('Error setting offline status:', error)
  }
}

export function subscribeToAuthStateChange(callback: (event: string, session: any) => void) {
  checkSupabase()
  return supabase.auth.onAuthStateChange(callback)
}
