import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// auth provider
import { AuthProvider } from "./auth/authProvider.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import PublicRoute from "./auth/publicRoute.jsx";

// pages
const UploadRoom = lazy(() => import("./pages/UploadRoom.jsx"));
const EditRoom = lazy(() => import("./pages/editRoom.jsx"));
const Login = lazy(() => import("./auth/login.jsx"));
const Register = lazy(() => import("./auth/register.jsx"));
const ForgotPassword = lazy(() => import("./auth/forgotPassword.jsx"));
const ChangePassword = lazy(() => import("./auth/changePassword.jsx"));
const Profile = lazy(() => import("./pages/profile.jsx"));
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const RoomPage = lazy(() => import("./pages/RoomPage.jsx"));
const ListingPage = lazy(() => import("./pages/listingPage.jsx"));
const UploadRoommateProfile = lazy(() => import("./pages/UploadRoommate.jsx"));
const ProfilePage = lazy(() => import("./pages/roommatePage.jsx"));
const EditRoommateProfile = lazy(() => import("./pages/editRoommate.jsx"));
const Exchange = lazy(() => import("./pages/exchange.jsx"));

function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-rose-700">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-3 text-slate-600">The page may have moved or the link may be incorrect.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Back to UniMates</Link>
      </div>
    </main>
  );
}

// utilities
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  useEffect(() => {
    document.title = "UniMates | Student housing";
  }, []);

  return (
    <>
      <Router>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen grid place-items-center bg-slate-50 text-sm text-slate-600" role="status">Loading page…</div>}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<ListingPage />} />

            <Route path="/exchange" element={<Exchange />} />

            {/* Protected Routes */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-profile"
              element={
                <ProtectedRoute>
                  <UploadRoommateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditRoommateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:id"
              element={
                <ProtectedRoute>
                  <RoomPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </Router>

      <Analytics />
      <SpeedInsights />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#111", // dark, minimal
            color: "#fff",
            borderRadius: "12px",
            fontSize: "0.95rem",
          },
          success: {
            iconTheme: {
              primary: "#4ade80",
              secondary: "#111",
            },
          },
        }}
      />
    </>
  );
}

export default App;
