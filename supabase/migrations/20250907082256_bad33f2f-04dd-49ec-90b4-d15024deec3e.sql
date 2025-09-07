-- Add conversation metadata columns and participants array
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message TEXT,
  ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE;

-- Participants as a generated array from user1_id and user2_id
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participants uuid[] GENERATED ALWAYS AS (ARRAY[user1_id, user2_id]) STORED;

-- Function + trigger to keep conversation metadata updated on new messages
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message = NEW.content,
      last_message_time = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_on_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();

-- Allow participants to update their own conversation rows (needed for trigger updates under RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can update their conversations metadata'
  ) THEN
    CREATE POLICY "Users can update their conversations metadata"
    ON public.conversations
    FOR UPDATE
    USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
  END IF;
END$$;

-- Ensure realtime sends full row data
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;