import { useState } from 'react'
import { UserList } from '@/components/chat/UserList'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Profile } from '@/lib/supabase'

export const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<{
    conversationId: string
    otherUser: Profile
  } | null>(null)

  const handleSelectConversation = (conversationId: string, otherUser: Profile) => {
    setSelectedConversation({ conversationId, otherUser })
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="flex h-full">
        {/* User List - Hidden on mobile when chat is selected */}
        <div
          className={`w-full md:w-80 flex-shrink-0 ${
            selectedConversation ? 'hidden md:block' : 'block'
          }`}
        >
          <UserList onSelectConversation={handleSelectConversation} />
        </div>

        {/* Chat Interface */}
        {selectedConversation ? (
          <div className="flex-1">
            <ChatInterface
              conversationId={selectedConversation.conversationId}
              otherUser={selectedConversation.otherUser}
              onBack={() => setSelectedConversation(null)}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}