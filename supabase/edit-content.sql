-- Applied remotely as allow_owner_edit_note_content.
-- Existing UPDATE policy enforces auth.uid() ownership and quicknote_owner app_metadata.
GRANT UPDATE (content) ON public.quicknote_notes TO authenticated;
