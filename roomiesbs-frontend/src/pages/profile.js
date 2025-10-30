import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import Navbar from "../components/navbar.jsx";
import { FiMoreVertical } from "react-icons/fi";
import { HiArrowRight } from "react-icons/hi";

export default function Profile() {
  const { user, session } = useAuth();
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
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

  if (loading)
    return <div className="p-10 text-center text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Navbar />

      <div className="max-w-5xl mx-auto py-12 px-4 space-y-10">
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
              onClick={() => {
                localStorage.removeItem("sb-access-token");
                navigate("/login");
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
              <div
                className="relative"
                ref={(el) => (menuRefs.current["roommate"] = el)}
              >
                <button
                  onClick={() => toggleMenu("roommate")}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <FiMoreVertical className="text-gray-600" size={20} />
                </button>
                {menuOpen === "roommate" && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-md w-36 z-10 animate-fade-in">
                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        navigate("/edit-profile");
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete your profile?"
                          )
                        ) {
                          await axios.delete(
                            "http://localhost:5000/roommates",
                            {
                              headers: {
                                Authorization: `Bearer ${session.access_token}`,
                              },
                            }
                          );
                          setRoommateProfile(null);
                          setMenuOpen(null);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50"
                    >
                      Delete Profile
                    </button>
                  </div>
                )}
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
                      className="w-full h-56 rounded-xl object-cover shadow-sm border"
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
                    {JSON.parse(roommateProfile.person_traits).join(", ")}
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
                onClick={() => navigate("/create-roommate")}
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
                        <strong>Price:</strong> {listing.rent} / month
                      </p>
                      <p>
                        <strong>Address:</strong> {listing.address}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            listing.active
                              ? "text-green-600 font-semibold"
                              : "text-red-500 font-semibold"
                          }
                        >
                          {listing.active ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  <div
                    className="relative"
                    ref={(el) => (menuRefs.current[listing.room_id] = el)}
                  >
                    <button
                      onClick={() => toggleMenu(listing.room_id)}
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <FiMoreVertical className="text-gray-600" size={20} />
                    </button>
                    {menuOpen === listing.room_id && (
                      <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-md w-36 z-10 animate-fade-in">
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            navigate(`/edit/${listing.room_id}`);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              window.confirm("Are you sure you want to delete?")
                            ) {
                              await axios.delete(
                                `http://localhost:5000/rooms/${listing.room_id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${session.access_token}`,
                                  },
                                }
                              );
                              setMyRooms((prev) =>
                                prev.filter(
                                  (r) => r.room_id !== listing.room_id
                                )
                              );
                              setMenuOpen(null);
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
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
    </div>
  );
}
