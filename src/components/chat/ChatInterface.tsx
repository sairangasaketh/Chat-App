import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Send } from 'lucide-react'
import { Profile, Message } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { format } from 'date-fns'

interface ChatInterfaceProps {
  conversationId: string
  otherUser: Profile
  onBack: () => void
}

export const ChatInterface = ({ conversationId, otherUser, onBack }: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { user } = useAuth()
  const { messages, typingIndicators, loading, sendMessage, setTyping } = useMessages(conversationId)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const success = await sendMessage(newMessage)
    if (success) {
      setNewMessage('')
      // Stop typing indicator when message is sent
      setTyping(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      setTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTyping(false)
    }, 1000)
  }

  const isMyMessage = (message: Message) => {
    return message.sender_id === user?.id
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
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
        
        <div className="flex-1">
          <h2 className="font-semibold">{otherUser.username}</h2>
          <div className="text-sm text-muted-foreground">
            {typingIndicators.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>typing...</span>
              </div>
            ) : (
              <span>
                {otherUser.is_online ? 'Online' : `Last seen ${format(new Date(otherUser.last_seen), 'MMM d, HH:mm')}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback>
                    {otherUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-medium mb-2">Start a conversation with {otherUser.username}</h3>
              <p className="text-sm text-muted-foreground">Send a message to begin your chat</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                    {date}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-2">
                  {dateMessages.map((message, index) => {
                    const isFromMe = isMyMessage(message)
                    const showAvatar = index === 0 || dateMessages[index - 1].sender_id !== message.sender_id
                    const showReadStatus = isFromMe && message.read_at

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isFromMe && showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherUser.avatar_url} />
                            <AvatarFallback>
                              {otherUser.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!isFromMe && !showAvatar && <div className="w-8" />}
                        
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isFromMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`text-xs mt-1 flex items-center gap-1 ${
                            isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            <span>{formatTime(message.created_at)}</span>
                            {showReadStatus && (
                              <span className="ml-1">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}