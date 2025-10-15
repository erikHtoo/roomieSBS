import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { useAuth } from "../auth/useAuth.js";
import { FiSearch, FiHome, FiUpload } from "react-icons/fi";
import { useIsMobile } from "../utils/isMobile.js";

const parseImageUrls = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) {}

    if (val.startsWith("{") && val.endsWith("}")) {
      const inner = val.slice(1, -1);
      return inner
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
    }

    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export default function HomePage() {
  const isMobile = useIsMobile();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const { session } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;

    axios
      .get("http://localhost:5000/roommates", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      .then((res) => setHasProfile(!!res.data?.profile))
      .catch(() => setHasProfile(false));
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await axios.get("http://localhost:5000/roommates/all", {
          timeout: 20000,
        });
        let profiles = res.data.profiles || [];
        if (session?.user?.id) {
          profiles = profiles.filter((p) => p.id !== session.user.id);
        }
        setProfiles(profiles);
      } catch (err) {
        console.error(err);
        setError("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    const budget = Number(profile.person_budget) || 0;
    const matchesSearch =
      searchQuery === "" ||
      profile.person_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.person_about?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesBudget = true;
    if (budgetFilter === "below-3") matchesBudget = budget < 3000000;
    else if (budgetFilter === "3-5")
      matchesBudget = budget >= 3000000 && budget <= 5000000;
    else if (budgetFilter === "5-7")
      matchesBudget = budget > 5000000 && budget <= 7000000;
    else if (budgetFilter === "7-above") matchesBudget = budget > 7000000;

    return matchesSearch && matchesBudget;
  });

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2 mt-3"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-8 text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Find your SBS Roommate
        </h1>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/rooms"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiHome size={18} />
            Look at Rooms
            <span className="ml-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>

          <Link
            to="/create-profile"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiUpload size={18} />
            Roommate Profile
          </Link>
        </div>
      </section>

      {/* Filter Row */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-rose-500 transition">
              <FiSearch size={20} />
            </span>
          </div>

          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="">All Budgets</option>
            <option value="below-3">Below 3M</option>
            <option value="3-5">3M - 5M</option>
            <option value="5-7">5M - 7M</option>
            <option value="7-above">7M+</option>
          </select>
        </div>
      </div>

      {/* Profiles Grid */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <p className="col-span-full text-center text-red-500">{error}</p>
        ) : filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => {
            const imgs = parseImageUrls(profile.person_image_urls);
            const firstImage = imgs.length ? imgs[0] : null;

            return (
              <Link
                key={profile.id}
                to={`/profile/${profile.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                <div className="h-48 w-full flex items-center justify-center bg-gray-200">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={profile.person_name}
                      className="max-h-full max-w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = placeholder;
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="font-semibold text-lg text-gray-800 mb-1">
                    {profile.person_name}{" "}
                    <span className="text-gray-500 text-sm">
                      ({profile.person_gender ? "Male" : "Female"})
                    </span>
                  </h2>

                  <p className="text-gray-600 text-sm flex-grow line-clamp-3">
                    {profile.person_about || "No description provided."}
                  </p>

                  <p className="text-rose-600 font-bold mt-3">
                    {profile.person_budget
                      ? `Budget - ${Number(
                          profile.person_budget
                        ).toLocaleString()} VND`
                      : "Budget not set"}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No roommate profiles available yet.
          </p>
        )}
      </main>
    </div>
  );
}
