-- Fix security issue: Restrict profile visibility to authenticated users only
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);