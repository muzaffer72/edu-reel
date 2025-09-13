-- Add comment threading, attachments, proposals, and correct answer linking; and add count update triggers
BEGIN;

-- Add columns to comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS attachment_url text NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS proposed_as_correct boolean NOT NULL DEFAULT false;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Link accepted correct answer to a specific comment
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS correct_comment_id uuid NULL;

DO $$ BEGIN
  ALTER TABLE public.posts
    ADD CONSTRAINT posts_correct_comment_fk
    FOREIGN KEY (correct_comment_id)
    REFERENCES public.comments(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure triggers exist to maintain like/comment counters on posts
DO $$ BEGIN
  CREATE TRIGGER trg_update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_update_post_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;