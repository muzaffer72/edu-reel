-- Make current users admin (first user will be admin)
INSERT INTO public.user_roles (user_id, role) 
SELECT user_id, 'admin'::app_role 
FROM public.profiles 
WHERE created_at = (SELECT MIN(created_at) FROM public.profiles)
ON CONFLICT (user_id, role) DO NOTHING;