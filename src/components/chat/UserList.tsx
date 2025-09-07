import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, LogOut, MessageCirclePlus, MoreVertical, User as UserIcon } from 'lucide-react'
import { Profile, Conversation } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { useProfiles } from '@/hooks/useProfiles'
import { NewChatDialog } from './NewChatDialog'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface UserListProps {
  onSelectConversation: (conversationId: string, otherUser: Profile) => void
}

export const UserList = ({ onSelectConversation }: UserListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const { conversations, loading: conversationsLoading, createConversation } = useConversations()
  const { profiles, loading: profilesLoading } = useProfiles()

  const getOtherUser = (conversation: Conversation): Profile | undefined => {
    const direct = conversation.profiles?.[0]
    if (direct) return direct
    if (!user) return undefined
    const otherId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id
    return profiles.find(p => p.id === otherId)
  }
  const handleSignOut = async () => {
    await signOut()
  }

  const handleNewChat = async (profile: Profile) => {
    const conversationId = await createConversation(profile.id)
    if (conversationId) {
      onSelectConversation(conversationId, profile)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    const otherUserProfile = getOtherUser(conversation)
    if (otherUserProfile) {
      onSelectConversation(conversation.id, otherUserProfile)
    }
  }

  const filteredConversations = conversations.filter(conversation => {
    const otherUserProfile = getOtherUser(conversation)
    return otherUserProfile?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <>
      <div className="flex flex-col h-full bg-background border-r">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">C</span>
            </div>
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
          
          {/* Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setNewChatOpen(true)}>
                <MessageCirclePlus className="h-4 w-4 mr-2" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b">
          <Button 
            onClick={() => setNewChatOpen(true)}
            className="w-full"
            variant="outline"
          >
            <MessageCirclePlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCirclePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchTerm && (
                  <p className="text-xs mt-1">
                    Start a new chat to begin messaging
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherUser = getOtherUser(conversation)
                if (!otherUser) return null

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.avatar_url} />
                        <AvatarFallback>
                          {otherUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser.is_online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{otherUser.username}</p>
                        {conversation.last_message && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onSelectUser={handleNewChat}
      />
    </>
  )
}