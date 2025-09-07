<<<<<<< HEAD
# Real-Time Chat App

A modern, responsive real-time chat application built with React, TypeScript, Tailwind CSS, and Supabase. Features include user authentication, real-time messaging, online status indicators, and a clean mobile-first design.

## 🚀 Features

- **JWT Authentication** - Secure user registration and login
- **Real-time Messaging** - Instant message delivery using Supabase Realtime
- **User Management** - Browse and search registered users
- **Online Status** - See who's currently online
- **Typing Indicators** - Know when someone is typing
- **Message Status** - Delivery and read receipts with checkmarks
- **Responsive Design** - Works perfectly on desktop and mobile
- **Clean UI** - Modern, intuitive interface with smooth animations

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd chat-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** in your Supabase dashboard
3. Copy your **Project URL** and **anon public key**

### 3. Configure Environment

Update the Supabase configuration in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
```

### 4. Set Up Database Schema

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
```

### 5. Enable Realtime

In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable realtime for the `messages` table

### 6. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📱 Usage

### Registration & Login
1. Open the app in your browser
2. Click "Sign up" to create a new account
3. Fill in your username, email, and password
4. Verify your email (check spam folder)
5. Login with your credentials

### Starting a Chat
1. After login, you'll see the user list
2. Click on any user to start a conversation
3. Type your message and press Enter or click Send
4. Messages appear in real-time

### Demo Users
For testing purposes, the app includes some demo users in the interface. In a production setup, these would be real registered users.

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── auth/          # Login and registration components
│   ├── chat/          # Chat interface and user list
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
└── pages/             # Main page components
```

### Key Files
- `src/lib/supabase.ts` - Supabase configuration and types
- `src/hooks/useAuth.ts` - Authentication logic
- `src/components/chat/ChatInterface.tsx` - Main chat component
- `src/components/chat/UserList.tsx` - User listing component

### Adding Real-time Features

To implement full real-time functionality:

1. **Real-time Messages**: Subscribe to message changes in `ChatInterface.tsx`
```typescript
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new.receiver_id === user?.id) {
          setMessages(prev => [...prev, payload.new as Message])
        }
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user?.id])
```

2. **Online Status**: Update user presence
3. **Typing Indicators**: Broadcast typing events

## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables

## 🔒 Security Notes

- All API keys should be environment variables in production
- Row Level Security (RLS) is enabled on all tables
- JWT tokens are automatically handled by Supabase Auth
- Users can only see their own conversations and messages

## 📝 Todo / Future Enhancements

- [ ] File and image sharing
- [ ] Group chat functionality  
- [ ] Push notifications
- [ ] Message encryption
- [ ] Dark mode toggle
- [ ] Message search
- [ ] User blocking/reporting
- [ ] Voice/video calling integration

## 🐛 Troubleshooting

**Build Errors:**
- Make sure all dependencies are installed: `npm install`
- Check that Supabase configuration is correct

**Authentication Issues:**
- Verify Supabase project URL and API key
- Check that email confirmation is set up correctly

**Realtime Not Working:**
- Ensure realtime is enabled for your tables in Supabase
- Check browser network tab for WebSocket connections

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ using React, Supabase, and modern web technologies.
=======
# Chat-App
>>>>>>> 3411ff41e7fd584ec0eb93b2462f1f8b2f57d480
