-- Run through the Supabase migration workflow before the school launch.
-- The application reads and writes these tables through the backend service
-- role only. Browser clients should never have direct table access.

alter table public.listings_table enable row level security;
alter table public.roommates_table enable row level security;
alter table public.exchange enable row level security;

revoke all on table public.listings_table from anon, authenticated;
revoke all on table public.roommates_table from anon, authenticated;
revoke all on table public.exchange from anon, authenticated;

-- Keep user-generated uploads small and browser-safe. SVG and GIF are omitted
-- intentionally because they can carry active content or oversized animations.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('room-images', 'roommate-images');

drop policy if exists "users upload to own image folder" on storage.objects;
drop policy if exists "users update own image objects" on storage.objects;
drop policy if exists "users delete own image objects" on storage.objects;

create policy "users upload to own image folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('room-images', 'roommate-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "users update own image objects"
on storage.objects for update
to authenticated
using (
  bucket_id in ('room-images', 'roommate-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id in ('room-images', 'roommate-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "users delete own image objects"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('room-images', 'roommate-images')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
