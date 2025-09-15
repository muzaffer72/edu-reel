-- Fix security issue by setting proper search_path for the function
CREATE OR REPLACE FUNCTION notify_comment_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when someone likes a comment (not implemented in current schema, but preparing)
  -- This would be triggered when a comment_like is inserted
  
  -- Notify when a comment is marked as correct answer
  IF TG_OP = 'UPDATE' AND OLD.correct_comment_id IS NULL AND NEW.correct_comment_id IS NOT NULL THEN
    -- Get the comment author's user_id
    INSERT INTO notifications (title, message, target_users, created_by)
    SELECT 
      'Tebrikler! Yorumunuz doğru cevap olarak işaretlendi',
      'Bir gönderideki yorumunuz doğru cevap olarak kabul edildi.',
      ARRAY[comments.user_id::text],
      NEW.user_id
    FROM comments 
    WHERE comments.id = NEW.correct_comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;