-- Add foreign key relationship between posts and profiles
ALTER TABLE public.posts 
ADD CONSTRAINT fk_posts_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key relationship for comments
ALTER TABLE public.comments 
ADD CONSTRAINT fk_comments_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key relationship for comments to posts
ALTER TABLE public.comments 
ADD CONSTRAINT fk_comments_posts 
FOREIGN KEY (post_id) REFERENCES public.posts(id) 
ON DELETE CASCADE;

-- Add foreign key relationship for likes
ALTER TABLE public.likes 
ADD CONSTRAINT fk_likes_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT fk_likes_posts 
FOREIGN KEY (post_id) REFERENCES public.posts(id) 
ON DELETE CASCADE;