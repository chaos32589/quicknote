-- Run once in the chosen Supabase project's SQL editor.
-- All names are isolated from existing apps. No existing tables are altered.
begin;
create table public.quicknote_notes (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 content text not null default '' check (char_length(content) <= 20000),
 image_path text,
 image_name text,
 created_at timestamptz not null default now(),
 constraint quicknote_nonempty check (length(trim(content)) > 0 or image_path is not null),
 constraint quicknote_image_owner check (image_path is null or image_path = user_id::text || '/' || id::text)
);
create index quicknote_user_time on public.quicknote_notes(user_id,created_at desc,id desc);
alter table public.quicknote_notes enable row level security;
revoke all on public.quicknote_notes from anon,authenticated;
grant select,insert,delete on public.quicknote_notes to authenticated;
create policy quicknote_select on public.quicknote_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy quicknote_insert on public.quicknote_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy quicknote_delete on public.quicknote_notes for delete to authenticated using ((select auth.uid()) = user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('quicknote-images','quicknote-images',false,10485760,array['image/png','image/jpeg','image/webp','image/gif']);
create policy quicknote_image_read on storage.objects for select to authenticated
using (bucket_id='quicknote-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy quicknote_image_upload on storage.objects for insert to authenticated
with check (bucket_id='quicknote-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy quicknote_image_delete on storage.objects for delete to authenticated
using (bucket_id='quicknote-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
