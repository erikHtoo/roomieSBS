# UniMates (roomieSBS)

Live site: https://unimates.sbs/

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/) [![Node](https://img.shields.io/badge/Node.js-%3E=16-brightgreen)](https://nodejs.org/) [![Supabase](https://img.shields.io/badge/Supabase-Postgres-4ea94b)](https://supabase.com/)

## Project Overview

UniMates (roomieSBS) is a roommate and room-listing application that lets users create room listings and roommate profiles with image uploads, choosing preferences, or browse to look for roommates or rooms. The app uses Supabase for authentication and image storage, a Node/Express backend that exposes REST endpoints for rooms and roommate profiles, and a React frontend with Tailwind CSS.

## Features

- Create and edit room listings and roommate profiles.
- Multi-image upload with react-easy-crop and preview.
- Secure backend with rate limiting, compression, and HTTP hardening (helmet).
- Supabase integration for auth, storage and database access.
- DOMPurify for Client-side sanitization.
- Responsive UI built with Tailwind CSS and framer-motion for smooth transitions.

## Tech Stack

- Frontend: React 18 (Create React App), react-router-dom, framer-motion, axios
- Styling: Tailwind CSS, PostCSS, Autoprefixer
- Backend: Node.js + Express, express-rate-limit, helmet, compression, multer, express-validator
- Cloud / Services: Supabase (Auth, Storage, Postgres), Vercel analytics & speed insights
- Dev & tooling: ESLint (via CRA presets), react-scripts, nodemon for backend dev, dotenv for environment variables

## Architecture / System Design

- SPA Client (Create React App)
  - Routes and pages live under `src/pages/` and shared components under `src/components/`.
  - `src/supabaseClient.js` configures the browser SDK to interact with Supabase storage and auth.

- Server API (Express)
  - An API layer serves `POST/GET` endpoints for `/rooms`, `/roommates`, and `/exchange` (see [roomieSBS-backend/server.js](roomieSBS-backend/server.js)).
  - Supabase Database Integration (see [roomieSBS-backend/supabaseClient.js](roomieSBS-backend/supabaseClient.js)).

- Storage & Database
  - Supabase is used for authentication, image storage (buckets) and the underlying Postgres database.

## Installation for Contribution (local)

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

## References (key files)

- Frontend entry and key components: [roomiesbs-frontend/src/components/ImageUploadField.jsx](roomiesbs-frontend/src/components/ImageUploadField.jsx)
- Crop helper that avoids canvas taint: [roomiesbs-frontend/src/utils/cropImage.js](roomiesbs-frontend/src/utils/cropImage.js)
- Frontend Supabase client: [roomiesbs-frontend/src/supabaseClient.js](roomiesbs-frontend/src/supabaseClient.js)
- Backend server: [roomieSBS-backend/server.js](roomieSBS-backend/server.js)
- Backend Supabase server client: [roomieSBS-backend/supabaseClient.js](roomieSBS-backend/supabaseClient.js)

## License

This project is licensed under the PolyForm Noncommercial License 1.0.0.

Full terms: https://polyformproject.org/licenses/noncommercial/1.0.0 (or in repo)

Summary: Permitted uses include personal use, research, experimentation, and contributions. Use by noncommercial organizations (charities, educational institutions, public research organizations, government/public health or safety organizations) is permitted.

Commercial use is prohibited without explicit permission from the copyright holder.

## Cool Technical Stuff I learnt while developing this

- `src/utils/cropImage.js` resolves remote images by fetching them as blobs and creating object URLs, and sets `image.crossOrigin = 'anonymous'` before drawing to canvas. This prevents canvas "tainted" SecurityError
- text inputs are sanitized using `DOMPurify` before sending to backend; server-side also uses `sanitize-html` and `express-validator` for request validation.
- Tailwind CSS with a small custom animation in `tailwind.config.js`, framer-motion transitions, responsive layout patterns.
