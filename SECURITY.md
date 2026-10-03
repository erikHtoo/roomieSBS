# Security and student-safety baseline

Report security or privacy concerns privately to the UniMates maintainers. Do
not include access tokens, student contact details, or other personal data in a
public GitHub issue.

## Required production controls

1. Keep email confirmation enabled. UniMates intentionally accepts accounts
   from any email domain, so rate limits and abuse-reporting controls matter.
2. If Google sign-in is enabled, follow [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)
   and keep the Google client secret only in Supabase.
3. Set `ALLOWED_IMAGE_HOSTS` to the hostname of the project's Supabase URL.
4. Apply every SQL file in `supabase/migrations` to the production project.
5. Keep Supabase email confirmation enabled. Set the Site URL to
   `https://unimates.sbs` and allow only the exact recovery callback used by the
   app.
6. Rotate the Supabase service-role key if it has ever appeared in logs, chat,
   a commit, or a client-side environment variable.
7. Use `/health` for process liveness and `/ready` for deployment readiness.

## Privacy model

Public list endpoints return only the fields needed to render listing cards.
Contact details and full listing records require a valid, confirmed session.
Search-engine indexing is disabled because
profiles contain student-generated personal information.

Before a broad launch, add a privacy notice, acceptable-use rules, a reporting
and blocking workflow, moderator tooling, and a documented retention/deletion
process. These are product-safety controls, not optional polish.
