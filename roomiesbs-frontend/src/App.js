import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// auth provider
import { AuthProvider } from "./auth/authProvider.js";
import ProtectedRoute from "./auth/ProtectedRoute.js";
import PublicRoute from "./auth/publicRoute.js";

// pages
import UploadRoom from "./pages/UploadRoom.js";
import EditRoom from "./pages/editRoom.js";
import Login from "./auth/login";
import Register from "./auth/register";
import Profile from "./pages/profile.js";
import HomePage from "./pages/HomePage.js";
import RoomPage from "./pages/RoomPage.js";
import ListingPage from "./pages/listingPage.js";
import UploadRoommateProfile from "./pages/UploadRoommate.js";
import RoommatePage from "./pages/roommatePage.js";
import EditRoommateProfile from "./pages/editRoommate.js";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute> <Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute> <Register /></PublicRoute>} />

          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<ListingPage />} />

          {/* Protected Route */}
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
                <RoommatePage />
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
