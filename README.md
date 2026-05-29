# UniMates (roomieSBS)

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/) [![Node](https://img.shields.io/badge/Node.js-%3E=16-brightgreen)](https://nodejs.org/) [![Supabase](https://img.shields.io/badge/Supabase-Postgres-4ea94b)](https://supabase.com/)

## Resume-style summary

- Production-oriented single-page application (SPA) built with Create React App and a lightweight Express API backend. Demonstrates full-stack skills: secure REST APIs, cloud-hosted storage with Supabase, advanced client-side image handling (crop + reorder + upload), Tailwind CSS for modern UI, and deployment-ready build scripts.

## Project Overview

UniMates (roomieSBS) is a roommate and room-listing application that lets users create room listings and roommate profiles with image uploads, cropping, and ordering. The app uses Supabase for authentication and image storage, a Node/Express backend that exposes REST endpoints for rooms and roommate profiles, and a React frontend with Tailwind CSS.

## Features

- Create and edit room listings and roommate profiles.
- Multi-image upload with in-browser cropping (react-easy-crop), drag-and-drop reorder, and preview.
- Secure backend with rate limiting, compression, and HTTP hardening (helmet).
- Supabase integration for auth, storage and database access (server uses a service role key).
- Client-side sanitization for text inputs using DOMPurify.
- Responsive UI built with Tailwind CSS and framer-motion for smooth transitions.

## Tech Stack

- Frontend: React 18 (Create React App), react-router-dom, react-easy-crop, framer-motion, react-hot-toast, axios
- Styling: Tailwind CSS, PostCSS, Autoprefixer
- Backend: Node.js + Express, express-rate-limit, helmet, compression, multer (file handling helper), express-validator
- Cloud / Services: Supabase (Auth, Storage, Postgres), Vercel analytics & speed insights (analytics integrations are present)
- Dev & tooling: ESLint (via CRA presets), react-scripts, nodemon for backend dev, dotenv for environment variables

## Architecture / System Design

- SPA Client (Create React App)
  - Routes and pages live under `src/pages/` and shared components under `src/components/`.
  - `src/supabaseClient.js` configures the browser SDK to interact with Supabase storage and auth.

- Server API (Express)
  - A focused API layer serves `POST/GET` endpoints for `/rooms`, `/roommates`, and `/exchange` (see [roomieSBS-backend/server.js](roomieSBS-backend/server.js)).
  - Uses the Supabase server client with a service role key (see [roomieSBS-backend/supabaseClient.js](roomieSBS-backend/supabaseClient.js)).

- Storage & Database
  - Supabase is used for authentication, image storage (buckets) and the underlying Postgres database (managed by Supabase).

## Key Technical Highlights

- Robust image upload UX: `src/components/ImageUploadField.jsx` provides multi-file selection, drag/drop reorder, per-image cropping via `react-easy-crop`, and object-URL memory management (calls to `URL.createObjectURL` and `URL.revokeObjectURL` to avoid leaks).
- Canvas safety for remote images: `src/utils/cropImage.js` resolves remote images by fetching them as blobs and creating object URLs, and sets `image.crossOrigin = 'anonymous'` before drawing to canvas. This prevents canvas "tainted" SecurityError and allows reliable client-side cropping for Supabase-hosted images.
- Security-focused backend setup: `server.js` wires `helmet()` for headers, `express-rate-limit` for throttling, `compression()` for response compression, CORS configuration, and robust global error handling middleware.
- Progressive enhancement and sanitization: text inputs are sanitized using `DOMPurify` before sending to backend; server-side also uses `sanitize-html` and `express-validator` for request validation.
- Production-oriented build and dev ergonomics: `package.json` scripts include a `start` wrapper that runs `node --no-deprecation ./node_modules/react-scripts/bin/react-scripts.js start` (suppresses noisy deprecation logs during dev). `.npmrc` contains `legacy-peer-deps=true` for smoother installs where peer deps are present.
- Modern UX polish: Tailwind CSS with a small custom animation in `tailwind.config.js`, framer-motion transitions, responsive layout patterns.

## Challenges Solved

- Tainted canvas on cross-origin images: solved by fetching remote images as blobs and creating object URLs, allowing `canvas.toBlob()` to succeed.
- Memory leaks from object URLs: systematically revoke object URLs for files removed or replaced in the upload component.
- Large file or payload protection: backend sets body-size limits and uses compression to avoid excessive memory usage.

## Installation (local)

Prerequisites:

- Node.js (16+ recommended)
- npm

1. Clone repository

```bash
git clone https://github.com/erikHtoo/roomieSBS.git
cd roomieSBS
```

2. Backend setup

```bash
cd roomieSBS-backend
cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and CORS_ORIGIN (e.g. http://localhost:3000)
npm install
npm run dev
```

3. Frontend setup

```bash
cd ../roomiesbs-frontend
cp .env.example .env
# Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY and REACT_APP_API_URL (backend API URL)
npm install
npm start
```

Build (production)

```bash
cd roomiesbs-frontend
npm run build
```

## Usage

- Visit `http://localhost:3000` to open the React app.
- Use the multi-step upload flows (UploadRoom / UploadRoommate) to test the image upload, cropping, and reorder features.
- Backend health check: `GET /health` returns status for uptime monitors (configured in `roomieSBS-backend/server.js`).

## Folder Structure (high level)

- `roomiesbs-frontend/`
  - `src/pages/` — Page-level React components (UploadRoom, EditRoom, RoomPage, roommatePage, profile, etc.)
  - `src/components/` — Reusable components (ImageUploadField.jsx, navbar, contactField, etc.)
  - `src/utils/` — Utilities such as `cropImage.js`, `formatNumbers.js`
  - `src/supabaseClient.js` — Supabase browser client configuration
- `roomieSBS-backend/`
  - `server.js` — Express app setup and middleware
  - `routes/` — Route handlers (`rooms.js`, `roommateProfiles.js`, `exchange.js`)
  - `supabaseClient.js` — Supabase server client (service role key)

## Future Improvements

- Add end-to-end and unit tests (Jest / React Testing Library coverage for core components and server routes).
- Migrate to a modern framework like Next.js for improved SSR/SEO for public listing pages and route-based performance benefits.
- Add CI with GitHub Actions to run linting, tests, and build artifacts before merging.
- Add image optimization at upload-time (server-side resizing / thumbnails) to reduce client payloads and CDN costs.
- Add feature flags and AB testing (Vercel / LaunchDarkly) for controlled UX experiments.

## References (key files)

- Frontend entry and key components: [roomiesbs-frontend/src/components/ImageUploadField.jsx](roomiesbs-frontend/src/components/ImageUploadField.jsx)
- Crop helper that avoids canvas taint: [roomiesbs-frontend/src/utils/cropImage.js](roomiesbs-frontend/src/utils/cropImage.js)
- Frontend Supabase client: [roomiesbs-frontend/src/supabaseClient.js](roomiesbs-frontend/src/supabaseClient.js)
- Backend server: [roomieSBS-backend/server.js](roomieSBS-backend/server.js)
- Backend Supabase server client: [roomieSBS-backend/supabaseClient.js](roomieSBS-backend/supabaseClient.js)

## License

This repository does not include a license file. Add a license to the root if you want to make the project open source.

## Contact

If you want help converting this into a polished showcase for a portfolio or tailoring the README for a specific internship application, I can help rewrite the resume-style summary and generate demo screenshots or a short video script.
