-- Create live_stream_messages table
CREATE TABLE IF NOT EXISTS public.live_stream_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_stream_messages ENABLE ROW LEVEL SECURITY;

-- Policies for live_stream_messages
CREATE POLICY "Anyone can view messages from active streams"
  ON public.live_stream_messages
  FOR SELECT
  USING (
    live_stream_id IN (
      SELECT id FROM public.live_streams WHERE is_live = true
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON public.live_stream_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.live_stream_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for efficient message retrieval
CREATE INDEX idx_live_stream_messages_stream ON public.live_stream_messages(live_stream_id, created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_messages;