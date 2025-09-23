import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth.js";
import { supabase } from "../supabaseClient.js";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import axios from "axios";

const parseImageUrls = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) {}
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export default function Profile() {
  const { user, session } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [roommateProfile, setRoommateProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch own roommate profile
  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/roommates", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          timeout: 20000,
        });
        setRoommateProfile(res.data.profile);
      } catch (err) {
        console.error(err);
      }
    };
    if (session) fetchMyProfile();
  }, [session]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMsg("");

    if (newPassword !== confirmPassword) {
      setMsg("❌ New passwords do not match");
      return;
    }

    try {
      // Re-authenticate user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (loginError) {
        setMsg("❌ Current password incorrect");
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) setMsg(`❌ ${error.message}`);
      else setMsg("✅ Password updated successfully!");
    } catch (err) {
      console.error(err);
      setMsg("❌ Password update failed");
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;
    try {
      await axios.delete(`http://localhost:5000/roommates/${roommateProfile.id}`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to delete profile.");
    }
  };

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <rect width='100%' height='100%' fill='%23e5e7eb'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
        font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-6 sm:mt-12 space-y-6 sm:space-y-10 px-4">
        {/* Profile Header */}
        {user ? (
          <p className="text-gray-500 text-base sm:text-lg">
            Logged in as <span className="font-medium">{user.email}</span>
          </p>
        ) : (
          <p className="text-gray-500 text-base sm:text-lg">No user logged in</p>
        )}

        {/* Update Password + Logout */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Update Password
            </h2>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-semibold hover:bg-gray-300 transition w-full sm:w-auto"
            >
              Logout
            </button>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="submit"
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 transition"
            >
              Update Password
            </button>
          </form>
          {msg && <p className="text-gray-700 text-center">{msg}</p>}
        </div>

        {/* Roommate Profile Card */}
        {roommateProfile ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Your Roommate Profile
              </h2>
            </div>

            {/* Images */}
            {roommateProfile.person_image_urls?.length > 0 && (
              <div className="h-56 sm:h-72 md:h-96 w-full flex items-center justify-center bg-gray-200">
                <img
                  src={parseImageUrls(roommateProfile.person_image_urls)[0]}
                  alt={roommateProfile.person_name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => (e.currentTarget.src = placeholder)}
                />
              </div>
            )}

            {/* Info */}
            <div className="p-6 space-y-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                {roommateProfile.person_name}{" "}
                <span className="text-gray-500 text-base sm:text-lg">
                  ({roommateProfile.person_gender ? "Male" : "Female"})
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-700 break-words">
                {roommateProfile.person_about || "No description provided."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <p>
                  <span className="font-medium">Budget:</span>{" "}
                  {roommateProfile.person_budget
                    ? `${Number(
                        roommateProfile.person_budget
                      ).toLocaleString()} VND`
                    : "Not specified"}
                </p>
                <p>
                  <span className="font-medium">Preferred Location:</span>{" "}
                  {roommateProfile.person_preferred_location || "Not specified"}
                </p>
                <p className="sm:col-span-2 break-words">
                  <span className="font-medium">Contact:</span>{" "}
                  {roommateProfile.person_contact || "Not provided"}
                </p>
              </div>

              {/* Edit/Delete Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/edit-profile"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition text-center"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleDeleteProfile}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition text-center"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/create-profile"
            className="block text-center bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition"
          >
            Upload Your Roommate Profile
          </Link>
        )}
      </div>
    </div>
  );
}
