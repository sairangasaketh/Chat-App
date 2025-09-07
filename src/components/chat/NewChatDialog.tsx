import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MessageCircle, Loader2 } from 'lucide-react'
import { Profile, Conversation } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { findUserByEmailOrUsername, startConversation } from '@/lib/chat'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUser: (profile: Profile) => void
}

export const NewChatDialog = ({ open, onOpenChange, onSelectUser }: NewChatDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundUser, setFoundUser] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { conversations, loading: conversationsLoading } = useConversations()

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm.trim())
      } else {
        setFoundUser(null)
        setError('')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Perform search function
  const performSearch = async (term: string) => {
    if (term.length < 2) {
      setError('Please enter at least 2 characters')
      return
    }

    setLoading(true)
    setError('')
    setFoundUser(null)

    try {
      const profile = await findUserByEmailOrUsername(term)
      
      if (!profile) {
        setError('No user found with that email or username')
      } else if (profile.id === user?.id) {
        setError('You cannot start a chat with yourself')
      } else {
        setFoundUser(profile)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  // Handle starting a new conversation
  const handleStartChat = async () => {
    if (!foundUser || !user) return

    setLoading(true)
    try {
      const conversationId = await startConversation(user.id, foundUser.id)
      
      if (conversationId) {
        onSelectUser(foundUser)
        onOpenChange(false)
        setSearchTerm('')
        setFoundUser(null)
        setError('')
        toast.success('Chat started successfully!')
      } else {
        setError('Failed to start conversation')
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError('An error occurred while starting the chat')
    } finally {
      setLoading(false)
    }
  }

  // Handle selecting a recent conversation
  const handleSelectConversation = (conversation: Conversation) => {
    const otherUser = conversation.profiles?.[0]
    if (otherUser) {
      onSelectUser(otherUser)
      onOpenChange(false)
      setSearchTerm('')
      setFoundUser(null)
      setError('')
    }
  }

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setSearchTerm('')
      setFoundUser(null)
      setError('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 text-center py-2">
              {error}
            </div>
          )}

          {/* Found User */}
          {foundUser && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={foundUser.avatar_url} />
                  <AvatarFallback>
                    {foundUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{foundUser.username}</p>
                  <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Starting Chat...
                  </>
                ) : (
                  'Start Chat'
                )}
              </Button>
            </div>
          )}

          {/* Recent Chats */}
          {!searchTerm && !foundUser && (
            <div className="flex-1 overflow-hidden">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Recent Chats</h3>
              <ScrollArea className="h-[300px]">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No recent conversations</p>
                    <p className="text-xs mt-1">Search for users to start chatting</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => {
                      const otherUser = conversation.profiles?.[0]
                      if (!otherUser) return null

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
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
                              <p className="font-medium truncate">{otherUser.username || otherUser.email}</p>
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
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Instructions */}
          {!searchTerm && !foundUser && !error && conversations.length === 0 && !conversationsLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Enter a username or email to find users</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}