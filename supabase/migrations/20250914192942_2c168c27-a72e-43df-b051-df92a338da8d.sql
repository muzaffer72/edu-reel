-- Create AI user profile if it doesn't exist
INSERT INTO public.profiles (user_id, display_name, bio, avatar_url, exam_categories)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as user_id,
  'AI Asistan' as display_name,
  'Sınav sorularınıza AI destekli yanıtlar veren asistan.' as bio,
  null as avatar_url,
  '{}' as exam_categories
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Add AI response flag to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS ai_response_enabled boolean DEFAULT false;