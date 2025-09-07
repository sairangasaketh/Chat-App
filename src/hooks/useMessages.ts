import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Message, TypingIndicator } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!user || !conversationId || !content.trim()) return

    try {
      const trimmed = content.trim()
      const timestamp = new Date().toISOString()

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: trimmed
        })

      if (error) {
        console.error('Error sending message:', error)
        return false
      }

      // Update conversation metadata
      await supabase
        .from('conversations')
        .update({ 
          updated_at: timestamp,
          last_message: trimmed,
          last_message_time: timestamp
        })
        .eq('id', conversationId)

      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!user) return

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .neq('sender_id', user.id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const setTyping = async (isTyping: boolean) => {
    if (!user || !conversationId) return

    try {
      await supabase
        .from('typing_indicators')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: isTyping
          },
          { onConflict: 'conversation_id,user_id' }
        )
    } catch (error) {
      console.error('Error updating typing status:', error)
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchMessages()

      // Listen for new messages
      const messagesSubscription = supabase
        .channel(`messages_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          () => {
            fetchMessages()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          () => {
            fetchMessages()
          }
        )
        .subscribe()

      // Listen for typing indicators
      const typingSubscription = supabase
        .channel(`typing_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setTypingIndicators(prev => {
                const filtered = prev.filter(t => t.user_id !== payload.new.user_id)
                if (payload.new.is_typing) {
                  return [...filtered, payload.new as TypingIndicator]
                }
                return filtered
              })
            }
          }
        )
        .subscribe()

      return () => {
        messagesSubscription.unsubscribe()
        typingSubscription.unsubscribe()
      }
    }
  }, [conversationId])

  return {
    messages,
    typingIndicators: typingIndicators.filter(t => t.user_id !== user?.id),
    loading,
    sendMessage,
    markAsRead,
    setTyping,
    refetch: fetchMessages
  }
}