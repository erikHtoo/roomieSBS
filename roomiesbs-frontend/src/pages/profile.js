import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import Navbar from "../components/navbar.jsx";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { HiArrowRight } from "react-icons/hi";
import toast from "react-hot-toast";

export default function Profile() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { user, session, signOut } = useAuth();
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showProfileDelete, setShowProfileDelete] = useState(false);
  const menuRefs = useRef({}); // Track multiple menus
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      try {
        const profileRes = await axios.get("http://localhost:5000/roommates", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setRoommateProfile(profileRes.data.profile);

        const listingsRes = await axios.get("http://localhost:5000/rooms", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const myOwnedRooms = listingsRes.data.rooms.filter(
          (room) => room.owner_id === user?.id
        );
        setMyRooms(myOwnedRooms);
      } catch (err) {
        console.error("Error fetching profile or listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        menuRefs.current[menuOpen] &&
        !menuRefs.current[menuOpen].contains(e.target)
      ) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = (id) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  function safeParseArray(val) {
    if (!val && val !== 0) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      // try JSON parse
      let parsed = val;
      for (let i = 0; i < 3; i++) {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
      // fallback: comma separated
      const cleaned = val.replace(/^"+|"+$/g, "").trim();
      if (!cleaned) return [];
      return cleaned
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  if (loading)
    return <div className="p-10 text-center text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Navbar />

      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Profile Information */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Profile Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-base">
            <p>
              <strong>Email:</strong> {user?.email || "—"}
            </p>
            <p>
              <strong>Joined:</strong>{" "}
              {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => navigate("/change-password")}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
            >
              Change Password
            </button>
            <button
              onClick={async () => {
                try {
                  if (typeof signOut === "function") await signOut();
                } catch (err) {
                  console.error("Sign out failed:", err);
                } finally {
                  try {
                    localStorage.removeItem("sb-access-token");
                  } catch {}
                  navigate("/login");
                }
              }}
              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </section>

        {/* Roommate Profile */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              My Roommate Profile
            </h2>

            {roommateProfile && (
              <div className="flex items-center gap-4">
                {/* Status + Toggle Pill */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      roommateProfile.person_active
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {roommateProfile.person_active ? "Active" : "Inactive"}
                  </span>

                  <button
                    onClick={async () => {
                      try {
                        const newStatus = !roommateProfile.person_active;
                        await axios.patch(
                          "http://localhost:5000/roommates",
                          { person_active: newStatus },
                          {
                            headers: {
                              Authorization: `Bearer ${session.access_token}`,
                            },
                          }
                        );
                        setRoommateProfile((prev) => ({
                          ...prev,
                          person_active: newStatus,
                        }));
                      } catch (err) {
                        console.error("Failed to update active status:", err);
                        toast.error("Failed to update status. Try again.");
                      }
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none ${
                      roommateProfile.person_active
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                        roommateProfile.person_active
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Edit icon */}
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title="Edit Profile"
                >
                  <FiEdit2 className="text-gray-700" size={18} />
                </button>

                {/* Delete icon */}
                <button
                  onClick={() => setShowProfileDelete(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title="Delete Profile"
                >
                  <FiTrash2 className="text-red-500" size={18} />
                </button>
              </div>
            )}
          </div>

          {roommateProfile ? (
            <div className="flex flex-col md:flex-row gap-8 relative">
              <div className="w-full md:w-1/3">
                {(() => {
                  let images = [];
                  try {
                    images = Array.isArray(roommateProfile.person_image_urls)
                      ? roommateProfile.person_image_urls
                      : JSON.parse(roommateProfile.person_image_urls || "[]");
                  } catch {
                    images = [];
                  }
                  return images.length > 0 ? (
                    <img
                      src={images[0]}
                      alt="Roommate"
                      className="w-full h-48 sm:h-56 md:h-64 rounded-xl object-cover shadow-sm border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 space-y-3 pb-10">
                <p className="text-xl font-semibold text-gray-900">
                  {roommateProfile.person_name}
                </p>
                <p>
                  <strong>Budget:</strong>{" "}
                  {roommateProfile.person_budget?.toLocaleString()} VND
                </p>
                <p>
                  <strong>Preferred Location:</strong>{" "}
                  {roommateProfile.person_preferred_location}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>About:</strong> {roommateProfile.person_about}
                </p>
                {roommateProfile.person_traits && (
                  <p>
                    <strong>Traits:</strong>{" "}
                    {safeParseArray(roommateProfile.person_traits).join(", ")}
                  </p>
                )}
              </div>

              <div className="absolute bottom-0 right-6">
                <button
                  onClick={() =>
                    navigate(`/profile/${roommateProfile.id || user.id}`)
                  }
                  className="flex items-center gap-1 text-indigo-600 font-medium hover:underline"
                >
                  View Profile <HiArrowRight />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No roommate profile found.{" "}
              <button
                onClick={() => navigate("/create-profile")}
                className="text-blue-500 hover:underline"
              >
                Create one
              </button>
            </div>
          )}
        </section>

        {/* My Listings */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              My Listings
            </h2>
            <button
              onClick={() => navigate("/upload")}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
            >
              + Create Listing
            </button>
          </div>

          {myRooms.length > 0 ? (
            myRooms.map((listing) => (
              <div
                key={listing.room_id}
                className="border rounded-xl p-5 mb-5 bg-gray-50 shadow-sm hover:shadow-md transition relative"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48">
                      {listing.image_urls?.length ? (
                        <img
                          src={listing.image_urls[0]}
                          alt="Listing"
                          className="w-full h-40 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 pb-10">
                      <p className="font-semibold text-lg text-gray-900">
                        {listing.category || "Untitled Listing"}
                      </p>
                      <p>
                        <strong>Price:</strong>{" "}
                        {parseInt(listing.rent).toLocaleString("en-US")} VND /
                      </p>
                      <p>
                        <strong>Address:</strong> {listing.address}
                      </p>
                    </div>
                  </div>

                  {/* Inline action icons */}
                  <div className="flex items-center gap-3">
                    {/* Edit icon */}
                    <button
                      onClick={() => navigate(`/edit/${listing.room_id}`)}
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                      title="Edit Listing"
                    >
                      <FiEdit2 className="text-gray-700" size={18} />
                    </button>

                    {/* Delete icon */}
                    <button
                      onClick={() => {
                        setDeleteTarget(listing.room_id);
                        setConfirmOpen(true);
                      }}
                    >
                      <FiTrash2 className="text-red-500" size={18} />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-4 right-6">
                  <button
                    onClick={() => navigate(`/room/${listing.room_id}`)}
                    className="flex items-center gap-1 text-indigo-600 font-medium hover:underline"
                  >
                    View Listing <HiArrowRight />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No listings yet.</p>
          )}
        </section>
      </div>
      {/* Delete confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Delete Listing?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              This action cannot be undone. Are you sure you want to delete this
              listing?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.delete(
                      `http://localhost:5000/rooms/${deleteTarget}`,
                      {
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      }
                    );
                    setMyRooms((prev) =>
                      prev.filter((r) => r.room_id !== deleteTarget)
                    );
                    setConfirmOpen(false);
                    toast.success("Listing deleted successfully!");
                  } catch (err) {
                    console.error("Delete failed:", err);
                    toast.error("Failed to delete listing. Try again.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roommate profile delete confirmation modal */}
      {showProfileDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Delete Profile?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              This action cannot be undone. Are you sure you want to delete your
              roommate profile?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowProfileDelete(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.delete("http://localhost:5000/roommates", {
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    });
                    setRoommateProfile(null);
                    setShowProfileDelete(false);
                    toast.success("Roommate profile deleted successfully!");
                  } catch (err) {
                    console.error("Failed to delete profile:", err);
                    toast.error("Failed to delete profile. Try again.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
