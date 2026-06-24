-- Create auscultation_sessions table for tracking clinical simulation progression
CREATE TABLE IF NOT EXISTS auscultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  focus_id TEXT NOT NULL,
  layer TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE auscultation_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own sessions
CREATE POLICY "Users can read their own auscultation sessions"
  ON auscultation_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated and anonymous users to insert sessions (for guest/offline mode sync)
CREATE POLICY "Anyone can insert auscultation sessions"
  ON auscultation_sessions
  FOR INSERT
  WITH CHECK (true);
