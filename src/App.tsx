import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { ChatPage } from '@/pages/ChatPage'
import { AuthPage } from '@/pages/AuthPage'
import { ProfilePage } from '@/pages/ProfilePage'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient()

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Authentication Route */}
              <Route 
                path="/auth" 
                element={user ? <Navigate to="/chat" replace /> : <AuthPage />} 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/chat" 
                element={user ? <ChatPage /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/profile" 
                element={user ? <ProfilePage /> : <Navigate to="/auth" replace />} 
              />
              
              {/* Default Route */}
              <Route 
                path="/" 
                element={
                  user ? <Navigate to="/chat" replace /> : <Navigate to="/auth" replace />
                } 
              />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Toaster />
            <Sonner />
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App