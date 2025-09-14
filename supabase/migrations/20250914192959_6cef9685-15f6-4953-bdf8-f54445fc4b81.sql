-- Just add the AI response flag to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS ai_response_enabled boolean DEFAULT false;