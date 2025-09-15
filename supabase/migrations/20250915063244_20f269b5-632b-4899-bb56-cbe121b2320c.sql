-- Fix the relationship issue and add proper foreign keys
-- First, let's check if there are any existing foreign keys to remove
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the getAllUsers query to work with the current structure
-- We'll update the hook to use a different approach for joining data