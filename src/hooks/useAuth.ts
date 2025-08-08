import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, UserProfile } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user data
      const { data: userData } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .single()

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      setUser(userData)
      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
  }
}