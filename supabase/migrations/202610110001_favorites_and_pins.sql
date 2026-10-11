-- Run in the existing project's Supabase SQL editor before deploying the frontend.
begin;
alter table public.quicknote_notes
 add column if not exists is_favorite boolean not null default false,
 add column if not exists is_pinned boolean not null default false;
-- Only these flags can be updated by the browser.
grant update (is_favorite, is_pinned) on public.quicknote_notes to authenticated;
drop policy if exists quicknote_update_flags on public.quicknote_notes;
create policy quicknote_update_flags on public.quicknote_notes
 for update to authenticated
 using ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'quicknote_owner', 'false') = 'true')
 with check ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'quicknote_owner', 'false') = 'true');
create index if not exists quicknote_user_pinned_time
 on public.quicknote_notes (user_id, is_pinned desc, created_at desc, id desc);
create index if not exists quicknote_user_favorite_time
 on public.quicknote_notes (user_id, is_pinned desc, created_at desc, id desc) where is_favorite;
commit;
