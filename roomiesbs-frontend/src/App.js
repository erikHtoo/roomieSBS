import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// auth provider
import { AuthProvider } from "./auth/authProvider.js";
import ProtectedRoute from "./auth/ProtectedRoute.js";
import PublicRoute from "./auth/publicRoute.js";

// pages
import UploadRoom from "./UploadRoom";
import EditRoom from "./editRoom.js";
import Login from "./auth/login";
import Register from "./auth/register";
import Profile from "./profile";
import HomePage from "./HomePage.js";
import RoomPage from "./RoomPage";


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}

          <Route path="/login" element={<PublicRoute> <Login /></PublicRoute>} />

          <Route path="/register" element={<PublicRoute> <Register /></PublicRoute>} />


          <Route path="/" element={<HomePage />} />

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
