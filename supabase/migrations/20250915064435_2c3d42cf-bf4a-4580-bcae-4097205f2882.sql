-- Add function to send notifications for comment interactions
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
$$ LANGUAGE plpgsql;

-- Create trigger for post updates (when correct comment is selected)
CREATE TRIGGER notify_correct_answer_trigger
  AFTER UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_interaction();

-- Add settings for API keys
INSERT INTO admin_settings (key, value) VALUES 
  ('openai_api_key', '""'::jsonb),
  ('gemini_api_key', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;