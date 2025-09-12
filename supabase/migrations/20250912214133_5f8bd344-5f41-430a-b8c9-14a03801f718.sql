-- Create public buckets for avatars and attachments (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments','attachments', true)
on conflict (id) do nothing;

-- Policies with safe IF NOT EXISTS checks via DO blocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Public read for avatars and attachments'
  ) THEN
    CREATE POLICY "Public read for avatars and attachments"
      ON storage.objects FOR SELECT
      USING (bucket_id in ('avatars','attachments'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can upload to their folder'
  ) THEN
    CREATE POLICY "Users can upload to their folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id in ('avatars','attachments')
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can update their own files'
  ) THEN
    CREATE POLICY "Users can update their own files"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id in ('avatars','attachments')
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can delete their own files'
  ) THEN
    CREATE POLICY "Users can delete their own files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id in ('avatars','attachments')
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;