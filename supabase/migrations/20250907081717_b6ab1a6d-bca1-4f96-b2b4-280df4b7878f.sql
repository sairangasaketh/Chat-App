-- Add missing fields to conversations table for proper chat functionality
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create foreign key constraints for better relationships
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT conversations_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create function to update conversation metadata when messages are sent
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message = NEW.content,
    last_message_time = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation metadata
DROP TRIGGER IF EXISTS update_conversation_on_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_on_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- Enable realtime for conversations table
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Enable realtime for messages table  
ALTER TABLE public.messages REPLICA IDENTITY FULL;