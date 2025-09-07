import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Conversation, Message } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch conversations with user profiles
      const { data, error } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id, created_at, updated_at, last_message, last_message_time')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      // Process conversations to include the other user's profile (fallback to empty if join missing)
      const processedConversations = (data || []).map((conv: any) => {
        const otherProfile = conv.user1_id === user.id 
          ? conv.user2_profile 
          : conv.user1_profile

        return {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message: conv.last_message ? {
            content: conv.last_message,
            created_at: conv.last_message_time
          } : undefined,
          profiles: otherProfile ? [otherProfile] : []
        } as Conversation
      })

      setConversations(processedConversations as Conversation[])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (otherUserId: string) => {
    if (!user) return null

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .single()

      if (existing) {
        return existing.id
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      await fetchConversations()
      return data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  useEffect(() => {
    if (user) {
      fetchConversations()

      // Subscribe to conversations changes for real-time updates
      const conversationsChannel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          () => {
            console.log('Conversations changed, refetching...')
            fetchConversations()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('New message received, refetching conversations...')
            // Refetch conversations when new messages are added
            fetchConversations()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(conversationsChannel)
      }
    }
  }, [user])

  return {
    conversations,
    loading,
    createConversation,
    refetch: fetchConversations
  }
}