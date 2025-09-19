import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg(error.message);
    else setMsg("✅ Password updated successfully!");
    setPassword("");
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Profile Card */}
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile</h2>
        {user ? (
          <p className="text-gray-600 mb-6">Logged in as: <span className="font-medium">{user.email}</span></p>
        ) : (
          <p className="text-gray-600 mb-6">No user</p>
        )}

        {/* Update Password */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-2 rounded-lg font-semibold hover:bg-rose-600 transition"
          >
            Update Password
          </button>
        </form>
        {msg && <p className="text-sm text-gray-700 mt-3">{msg}</p>}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
