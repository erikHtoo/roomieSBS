# UniMates release security audit

Date: 2026-10-19
Scope: public site, frontend source, Express API, dependency trees, repository
secret indicators, and documented Supabase access model.

This is a point-in-time review, not a guarantee that no vulnerability exists.
Repeat it after infrastructure, schema, authentication, or major dependency
changes.

## Production verification

Verified on October 19, 2026:

- `https://unimates.sbs/` returns HTTP 200 over HTTPS with CSP, HSTS,
  anti-framing, permissions, referrer, and MIME-sniffing protections.
- The Render API `/health` and dependency-aware `/ready` endpoints return HTTP
  200, and public room/profile feeds return data successfully.
- Frontend and backend production dependency audits report zero known
  vulnerabilities, and the frontend production build succeeds.
- The launch-poster QR code decodes to the canonical
  `https://unimates.sbs/` URL.
- A public Safety page, visible support contact, and contextual email-report
  links are available from the navigation, footer, room pages, and roommate
  pages.

Production RLS and Storage policy state must still be verified directly in
Supabase after any schema, bucket, or authentication change. Source and API
behavior alone cannot prove the remote policy matrix.

## Fixed in this branch

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | Bulk room/profile endpoints returned full rows, including owner IDs and contact details, without authentication. | Public endpoints now select summary fields only. Full room/profile records require a confirmed session; owned rooms use a separate authenticated endpoint. |
| High | Direct table access and storage ownership controls were not represented in versioned migrations. | Added RLS/revoke controls plus per-user upload/update/delete storage policies, MIME allowlists, and a 5 MB bucket limit. |
| High | The Create React App dependency tree reported 33 vulnerabilities (18 high). | Migrated to Vite 8, upgraded React Router, removed unused packages, committed lockfiles; both production dependency audits now report zero vulnerabilities. |
| Medium | Login code wrote the user object and bearer access token to the browser console. | Removed token/user logging and made sign-in errors non-enumerating. |
| Accepted tradeoff | Any confirmed email domain can use authenticated API operations. | Kept confirmed-email enforcement, strict rate limits, and authenticated contact details. Add abuse-reporting and blocking before broad promotion. |
| Medium | Image inputs accepted any `image/*` file with no size limit. | Limited the client to JPEG/PNG/WebP up to 5 MB and added matching Storage bucket constraints. Image URL count, HTTPS, and optional host restrictions are enforced by the API. |
| Medium | Public API errors exposed internal dependency messages. | Replaced them with stable user-facing errors while keeping server-side diagnostics. |
| Medium | A global 1,000-request limit, 1 MB bodies, and permissive write throughput made abuse easier. | Added production read/write limits, 128 KB bodies, strict CORS allowlisting, proxy awareness, and generic 429 responses. |
| Medium | The site had no frontend CSP or privacy-oriented crawler controls. | Added Vercel security headers, `noindex`, and a deny-all `robots.txt`. |
| Medium | Password recovery was absent and the existing “Change Password” button pointed to a missing route. | Added recovery and authenticated password-change flows with a 12-character minimum. |
| Medium | Arbitrary contact strings could become outbound Facebook links. | Added HTTPS and Facebook-host validation before rendering links. |
| Low | `/health` reported success while every database-backed route failed. | Kept `/health` as liveness and added dependency-aware `/ready` for deploy and monitoring checks. |
| Low | The repository had no lockfiles, CI security gate, or dependency update automation. | Added lockfiles, GitHub Actions build/audit checks, and Dependabot configuration. |

## Open product-safety work

These should be completed before inviting the whole school, even though they
are not all code-execution vulnerabilities:

- Replace the email-based reporting path with a durable report queue, blocking,
  moderator review tools, audit history, and a documented response owner.
- Keep the published privacy, acceptable-use, and safety notices current as the
  service changes.
- Decide whether profile and room summaries should be public at all. Currently
  summaries are public but contact details require confirmed sign-in.
- Make image buckets private and serve short-lived signed URLs if student photos
  should not be world-readable to anyone who has the URL.
- Add a verified full-account deletion flow. Listing and profile deletion now
  removes owned uploaded objects, but it does not delete the Supabase account.
- Add per-user abuse controls, content moderation, spam prevention, and audit
  logging. IP rate limits alone do not stop a signed-in scraper.
- Review every existing production record for accidental phone numbers,
  addresses, discriminatory preferences, or unsafe images before launch.
- Add automated API authorization tests and end-to-end tests with separate
  owner, student, and anonymous accounts. Current CI verifies builds, syntax,
  and dependency audits but not a live Supabase policy matrix.
- Complete a manual accessibility review of every create/edit form and image
  flow; the authentication and primary navigation paths were improved, but the
  full legacy form set has not yet been remediated.
- Establish backups, restore drills, incident response, key rotation, and an
  accountable adult/moderator for a student-facing launch.

## Deployment verification

1. Deploy the backend with the new environment values and confirm `/health`
   and `/ready` both return HTTP 200.
2. Apply the SQL migration, then prove anon clients cannot query application
   tables or write to another user's image folder.
3. Deploy the frontend and verify the CSP is present without console violations.
4. Test registration using an allowed domain, a disallowed domain, and an
   unconfirmed allowed-domain account.
5. Test that anonymous users cannot fetch `/rooms/:id`, `/rooms/mine`, or
   `/roommates/:id`, and that one student cannot edit another student's data.
6. Re-run `npm audit --omit=dev` in both project directories and the GitHub CI.
