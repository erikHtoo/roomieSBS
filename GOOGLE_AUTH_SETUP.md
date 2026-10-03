# Google sign-in setup

The frontend includes Google sign-in through Supabase. Complete these provider
settings before announcing it to students.

## Google Cloud

Create an OAuth 2.0 Client ID for a **Web application** and configure:

- Authorized JavaScript origin: `https://unimates.sbs`
- Authorized redirect URI:
  `https://nzsoxenryfiyljiwjisc.supabase.co/auth/v1/callback`
- For local development only, add `http://localhost:5173` as an origin.

Keep the Google client secret out of Git and frontend environment variables.

## Supabase

In **Authentication → Sign In / Providers → Google**:

1. Enable Google.
2. Paste the Google OAuth client ID and client secret.
3. Save the provider.

In **Authentication → URL Configuration**:

- Site URL: `https://unimates.sbs`
- Redirect URL: `https://unimates.sbs/**`
- For local development only: `http://localhost:5173/**`

## School access

Google sign-in is not a replacement for school-domain enforcement. Set the
same comma-separated school email domains in both deployment environments:

- Frontend: `VITE_ALLOWED_EMAIL_DOMAINS`
- Backend: `ALLOWED_EMAIL_DOMAINS`

The backend remains the enforcement point for authenticated API requests.
