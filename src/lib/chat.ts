import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/lib/supabase'

/**
 * Find a user by email OR username from the profiles table.
 * Falls back to partial match if exact match not found.
 */
export async function findUserByEmailOrUsername(input: string): Promise<Profile | null> {
  const term = input.trim()
  if (!term) return null

  // Try exact email match first
  const { data: byEmailExact } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', term)
    .maybeSingle()

  if (byEmailExact) return byEmailExact as Profile

  // Try exact username match
  const { data: byUsernameExact } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', term)
    .maybeSingle()

  if (byUsernameExact) return byUsernameExact as Profile

  // Fuzzy search (prefix/contains) for either field
  const { data: fuzzy } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(1)

  return (fuzzy && fuzzy[0]) ? (fuzzy[0] as Profile) : null
}

/**
 * Start (or fetch) a conversation between two users.
 * Returns the conversation id.
 */
export async function startConversation(currentUserId: string, recipientId: string): Promise<string | null> {
  if (!currentUserId || !recipientId || currentUserId === recipientId) return null

  // Check for existing conversation in either order
  const { data: existing, error: existingErr } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${currentUserId})`)
    .limit(1)

  if (existingErr) {
    console.error('Error checking conversation:', existingErr)
    return null
  }

  if (existing && existing[0]) return existing[0].id

  // Create if not exists
  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert({ user1_id: currentUserId, user2_id: recipientId })
    .select('id')
    .maybeSingle()

  if (createErr) {
    console.error('Error creating conversation:', createErr)
    return null
  }

  return created?.id ?? null
}

/**
 * Send a message in a conversation.
 * Returns the new message id on success.
 * The database trigger will automatically update conversation metadata.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<string | null> {
  const content = text.trim()
  if (!conversationId || !senderId || !content) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  // The trigger automatically updates conversation last_message and last_message_time
  return data?.id ?? null
}
