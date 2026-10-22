-- Existing ownership and quicknote_owner RLS policies apply to this column.
alter table public.quicknote_notes add column is_hidden boolean not null default false;
grant update(is_hidden) on public.quicknote_notes to authenticated;
