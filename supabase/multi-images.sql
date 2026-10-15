alter table public.quicknote_notes add column images jsonb, add column revision bigint not null default 0;
create function public.quicknote_valid_images(value jsonb, owner_id uuid, note_id uuid) returns boolean language plpgsql immutable set search_path='' as $$
declare item jsonb; path text; prefix text := owner_id::text || '/' || note_id::text;
begin
 if value is null then return true; end if;
 if jsonb_typeof(value) <> 'array' then return false; end if;
 if jsonb_array_length(value)>20 then return false; end if;
 for item in select jsonb_array_elements(value) loop
  path:=item->>'image_path';
  if jsonb_typeof(item)<>'object' or path is null then return false; end if;
  if path<>prefix and path !~ ('^'||prefix||'/[0-9a-f-]{36}$') then return false; end if;
  if item->>'thumbnail_path' is not null and item->>'thumbnail_path'<>path||'-preview' then return false; end if;
 end loop;
 return true;
end $$;
alter table public.quicknote_notes add constraint quicknote_images_owner check(public.quicknote_valid_images(images,user_id,id));
alter table public.quicknote_notes drop constraint quicknote_nonempty;
alter table public.quicknote_notes add constraint quicknote_nonempty check(length(trim(content))>0 or file_path is not null or case when images is null then image_path is not null else jsonb_array_length(images)>0 end);
create function public.quicknote_bump_revision() returns trigger language plpgsql set search_path='' as $$ begin new.revision=old.revision+1; return new; end $$;
create trigger quicknote_revision before update on public.quicknote_notes for each row execute function public.quicknote_bump_revision();
grant update(images) on public.quicknote_notes to authenticated;
