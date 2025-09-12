-- Create public buckets for avatars and attachments (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments','attachments', true)
on conflict (id) do nothing;

-- Storage policies for public read and user-scoped write access
-- Allow public read for avatars and attachments
create policy if not exists "Public read for avatars and attachments"
  on storage.objects for select
  using (bucket_id in ('avatars','attachments'));

-- Allow users to upload files to a folder matching their user id
create policy if not exists "Users can upload to their folder"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars','attachments')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update files in their folder
create policy if not exists "Users can update their own files"
  on storage.objects for update
  using (
    bucket_id in ('avatars','attachments')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete files in their folder
create policy if not exists "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id in ('avatars','attachments')
    and auth.uid()::text = (storage.foldername(name))[1]
  );