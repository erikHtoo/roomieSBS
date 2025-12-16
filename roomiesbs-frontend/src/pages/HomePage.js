import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { useAuth } from "../auth/useAuth.js";
import { FiSearch, FiHome, FiUpload } from "react-icons/fi";
import { useIsMobile } from "../utils/isMobile.js";
import {
  FaPaw,
  FaGamepad,
  FaBriefcase,
  FaLaptopCode,
  FaGlassCheers,
  FaSmokingBan,
  FaHourglassHalf,
  FaInfinity,
} from "react-icons/fa";

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
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [movingFilter, setMovingFilter] = useState(""); // "alone" | "friends" | ""
  const [genderFilter, setGenderFilter] = useState("");
  const [tempSelectedTraits, setTempSelectedTraits] = useState(selectedTraits);
  const [tempMovingFilter, setTempMovingFilter] = useState(movingFilter);
  const [tempGenderFilter, setTempGenderFilter] = useState("");

  const dropdownRef = useRef(null);
  const { session } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await axios.get("http://localhost:5000/roommates/all", {
          timeout: 20000,
        });

        let profiles = res.data.profiles || [];

        // If logged in, check whether current user has a roommate profile
        if (session?.access_token && session?.user?.id) {
          try {
            const me = await axios.get("http://localhost:5000/roommates", {
              headers: { Authorization: `Bearer ${session.access_token}` },
              timeout: 10000,
            });
            const has = !!me.data?.profile;
            setHasProfile(has);
            // Hide my own profile from explore grid if present
            profiles = profiles.filter((p) => p.id !== session.user.id);
          } catch (e) {
            // If auth call fails, assume no profile so clicking goes to create
            setHasProfile(false);
          }
        } else {
          setHasProfile(false);
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
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const details = dropdownRef.current.querySelector("details");
        if (details && details.open) details.open = false;
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProfiles = profiles.filter((profile) => {
    // hide inactive profiles
    const isActive =
      profile.person_active === undefined ||
      profile.person_active === null ||
      profile.person_active === true ||
      profile.person_active === "true";
    if (!isActive) return false;
    const matchesSearch =
      searchQuery === "" ||
      profile.person_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.person_about?.toLowerCase().includes(searchQuery.toLowerCase());

    // Normalize traits and friends into arrays for robust matching
    const profileTraits = safeParseArray(profile.person_traits);
    const friendsArray = safeParseArray(profile.person_friends);

    const matchesTraits =
      selectedTraits.length === 0 ||
      selectedTraits.every((t) => profileTraits.includes(t));

    const matchesMoving = !movingFilter
      ? true
      : movingFilter === "friends"
      ? friendsArray.length > 0
      : friendsArray.length === 0;

    // Gender matching: support boolean or string storage
    const matchesGender = (() => {
      if (!genderFilter) return true;
      const g = profile.person_gender;
      if (typeof g === "string") {
        const low = g.toLowerCase();
        return genderFilter === "male" ? low === "male" : low === "female";
      }
      if (typeof g === "boolean") {
        return genderFilter === "male" ? g === true : g === false;
      }
      // fallback: treat truthy as male
      return genderFilter === "male"
        ? Boolean(g) === true
        : Boolean(g) === false;
    })();

    return matchesSearch && matchesTraits && matchesMoving && matchesGender;
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

  // helper must be declared BEFORE it's used in filteredProfiles
  function safeParseArray(val) {
    if (!val && val !== 0) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      let parsed = val;
      for (let i = 0; i < 5; i++) {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
      const bracketMatch = val.match(/\[.*\]/s);
      if (bracketMatch && bracketMatch[0]) {
        try {
          const parsedBracket = JSON.parse(bracketMatch[0]);
          if (Array.isArray(parsedBracket))
            return parsedBracket.filter(Boolean);
        } catch {}
      }
      const cleaned = val
        .replace(/^"+|"+$/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
      const inner = cleaned.replace(/^\[|\]$/g, "");
      if (!inner) return [];
      return inner
        .split(",")
        .map((s) => s.trim().replace(/^"+|"+$/g, ""))
        .filter(Boolean);
    }
    return [];
  }

  const traitIcons = {
    "Pet Friendly": <FaPaw className="text-yellow-500" />,
    Gamer: <FaGamepad className="text-purple-500" />,
    "Business Major": <FaBriefcase className="text-blue-600" />,
    "Data Science Major": <FaLaptopCode className="text-green-600" />,
    "Hospitality Major": <FaGlassCheers className="text-pink-500" />,
    "Non Smoker": <FaSmokingBan className="text-gray-500" />,
    "Short Term": <FaHourglassHalf className="text-orange-400" />,
    "Long Term": <FaInfinity className="text-blue-400" />,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-8 text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Find your SBS Roommate
        </h1>

        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            to={hasProfile ? "/edit-profile" : "/create-profile"}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiUpload size={18} />
            Roommate Profile
          </Link>

          <Link
            to="/rooms"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiHome size={18} />
            Look at Rooms
          </Link>
        </div>
      </section>

      {/* Gradient Separator */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8" />

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search Bar (mobile full-width) */}
          <div className="w-full sm:w-[340px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-rose-500 transition">
                <FiSearch size={20} />
              </span>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="w-full sm:w-auto relative" ref={dropdownRef}>
            <details className="group">
              <summary
                onClick={() => {
                  setTempSelectedTraits(selectedTraits);
                  setTempMovingFilter(movingFilter);
                  setTempGenderFilter(genderFilter);
                }}
                className="flex items-center justify-center gap-2 cursor-pointer text-gray-700 text-sm font-medium bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/90 transition h-[46px] w-full"
              >
                <span>Filters</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>

              {/* Dropdown Content */}
              <div className="mt-2 sm:absolute right-0 bg-white border border-gray-200 rounded-xl shadow-lg w-full sm:w-60 max-h-96 flex flex-col z-50 transition-all duration-200 ease-out transform scale-95 opacity-0 group-open:scale-100 group-open:opacity-100">
                <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-gray-100">
                  {/* Gender */}
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">
                      Gender:
                    </h3>
                    <div className="flex flex-col gap-2">
                      {["male", "female"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setTempGenderFilter(tempGenderFilter === g ? "" : g)
                          }
                          className={`px-3 py-2 rounded-full border text-sm text-left w-full ${
                            tempGenderFilter === g
                              ? "bg-purple-500 text-white border-purple-500"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {g === "male" ? "Male" : "Female"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Traits */}
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">
                      Traits
                    </h3>
                    <div className="flex flex-col gap-2">
                      {Object.entries(traitIcons).map(([name, icon]) => {
                        const shortName = name.replace("Major", "").trim();
                        return (
                          <label
                            key={name}
                            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                            title={name}
                          >
                            <input
                              type="checkbox"
                              checked={tempSelectedTraits.includes(name)}
                              onChange={() =>
                                setTempSelectedTraits((prev) =>
                                  prev.includes(name)
                                    ? prev.filter((t) => t !== name)
                                    : [...prev, name]
                                )
                              }
                              className="rounded border-gray-300 text-gray-700 focus:ring-gray-400"
                            />
                            {shortName}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Moving */}
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">
                      Moving:
                    </h3>
                    <div className="flex flex-col gap-2">
                      {["alone", "friends"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setTempMovingFilter(
                              tempMovingFilter === opt ? "" : opt
                            )
                          }
                          className={`px-3 py-2 rounded-full border text-sm text-left w-full ${
                            tempMovingFilter === opt
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt === "alone" ? "Alone" : "With Friends"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset + Apply Buttons */}
                <div className="flex justify-end items-center p-3 border-t border-gray-200 gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    onClick={() => {
                      // clear temp and applied filters
                      setTempSelectedTraits([]);
                      setTempMovingFilter("");
                      setTempGenderFilter("");
                      setSelectedTraits([]);
                      setMovingFilter("");
                      setGenderFilter("");
                      try {
                        const details =
                          dropdownRef.current?.querySelector("details");
                        if (details) details.open = false;
                      } catch (e) {}
                    }}
                  >
                    Reset
                  </button>

                  <button
                    className="px-6 py-2 bg-pink-400 text-white font-semibold rounded-lg hover:bg-pink-500 transition text-base w-full sm:w-auto"
                    onClick={() => {
                      setSelectedTraits(tempSelectedTraits);
                      setMovingFilter(tempMovingFilter);
                      setGenderFilter(tempGenderFilter);
                      try {
                        const details =
                          dropdownRef.current?.querySelector("details");
                        if (details) details.open = false;
                      } catch (e) {}
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </details>
          </div>
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
            const firstImage = imgs.length ? imgs[0] : placeholder;

            const traits = safeParseArray(profile.person_traits);
            const friendsArray = safeParseArray(profile.person_friends);

            const movingText =
              friendsArray.length === 0
                ? "Moving Alone"
                : `Moving With ${friendsArray.length} Friend${
                    friendsArray.length > 1 ? "s" : ""
                  }`;

            return (
              <Link
                key={profile.id}
                to={`/profile/${profile.id}`}
                className="group relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-300 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {firstImage && (
                    <img
                      src={firstImage}
                      alt={profile.person_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = placeholder;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />

                  {/* Bottom overlay: budget left, traits right */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    {/* Budget */}
                    {profile.person_budget && (
                      <span className="px-3 py-1.5 bg-rose-500/90 text-white text-sm font-semibold rounded-full shadow-md">
                        {Number(profile.person_budget).toLocaleString()} ₫
                      </span>
                    )}

                    {/* Traits */}
                    <div className="flex gap-1">
                      {traits.slice(0, 3).map((trait, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-xs text-gray-700 font-medium"
                          title={trait}
                        >
                          {traitIcons[trait] || trait[0]}
                        </div>
                      ))}
                      {traits.length > 3 && (
                        <span className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full text-xs text-gray-600 shadow-sm">
                          +{traits.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  {/* Name and Gender */}
                  <div>
                    <p className="text-gray-800 font-semibold text-base">
                      {profile.person_name}{" "}
                      <span className="text-gray-500 text-sm">
                        ({profile.person_gender ? "Male" : "Female"})
                      </span>
                    </p>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mt-1 line-clamp-3 min-h-[60px]">
                      {profile.person_about || "No description provided."}
                    </p>
                  </div>

                  {/* Moving Info (bottom-right under description) */}
                  <div className="flex justify-end mt-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      {movingText}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No roommate profiles match your filters.
          </p>
        )}
      </main>
    </div>
  );
}
