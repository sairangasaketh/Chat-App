import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/lib/supabase'

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username')

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOnlineStatus = async (isOnline: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  useEffect(() => {
    fetchProfiles()

    // Set user as online when component mounts
    updateOnlineStatus(true)

    // Listen for profile changes
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchProfiles()
        }
      )
      .subscribe()

    // Set user as offline when page is closed
    const handleBeforeUnload = () => updateOnlineStatus(false)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      profilesSubscription.unsubscribe()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updateOnlineStatus(false)
    }
  }, [])

  return {
    profiles,
    loading,
    refetch: fetchProfiles,
    updateOnlineStatus
  }
}