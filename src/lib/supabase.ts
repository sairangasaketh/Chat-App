// Updated types for the chat application
export type Profile = {
  id: string
  username: string
  avatar_url?: string
  email?: string
  last_seen: string
  is_online: boolean
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  profiles?: Profile[]
  last_message?: Message
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at?: string
  created_at: string
  updated_at: string
  sender_profile?: Profile
}

export type TypingIndicator = {
  id: string
  conversation_id: string
  user_id: string
  is_typing: boolean
  updated_at: string
}