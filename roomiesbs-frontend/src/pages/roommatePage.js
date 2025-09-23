import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/navbar.jsx";

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

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/roommates/${id}`, {
          timeout: 15000,
        });
        setProfile(res.data.profile || null);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!profile) return <div className="p-6">Profile not found.</div>;

  const imgs = parseImageUrls(profile.person_image_urls);
  const firstImage = imgs.length ? imgs[0] : null;

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <rect width='100%' height='100%' fill='%23e5e7eb'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
        font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6 mt-10">
        {/* Back button */}
        <Link
          to="/"
          className="inline-block mb-6 text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to all profiles
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Image */}
        <div className="h-96 w-full flex items-center justify-center bg-gray-200">
        <img
            src={firstImage}
            alt={profile.person_name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = placeholder;
            }}
        />
        </div>

          {/* Info */}
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.person_name}{" "}
              <span className="text-gray-500 text-lg">
                ({profile.person_gender ? "Male" : "Female"})
              </span>
            </h1>

            <p className="text-gray-700">
              {profile.person_about || "No description provided."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <p>
                <span className="font-medium">Budget:</span>{" "}
                {profile.person_budget
                    ? `${Number(profile.person_budget).toLocaleString()} VND`
                    : "Not specified"}
                </p>
                <p>
                <span className="font-medium">Preferred Location:</span>{" "}
                {profile.person_preferred_location || "Not specified"}
                </p>
                <p className="sm:col-span-2">
                <span className="font-medium">Contact:</span>{" "}
                {profile.person_contact || "Not provided"}
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}