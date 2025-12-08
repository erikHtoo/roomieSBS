import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { FiHome, FiUpload } from "react-icons/fi";
import { useIsMobile } from "../utils/isMobile.js";
import {
  FaParking,
  FaSwimmingPool,
  FaDumbbell,
  FaPaw,
  FaCouch,
  FaBuilding,
} from "react-icons/fa";

const amenityIcons = {
  Parking: <FaParking className="text-gray-700" />,
  "Swimming Pool": <FaSwimmingPool className="text-blue-500" />,
  Gym: <FaDumbbell className="text-red-500" />,
  "Pet Friendly": <FaPaw className="text-amber-600" />,
  Furnished: <FaCouch className="text-rose-500" />,
  Elevator: <FaBuilding className="text-purple-500" />,
};

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

export default function ListingPage() {
  const isMobile = useIsMobile();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [tempSelectedAmenities, setTempSelectedAmenities] = useState([]);
  const [tempMinRent, setTempMinRent] = useState("");
  const [tempMaxRent, setTempMaxRent] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:5000/rooms", {
          timeout: 20000,
        });
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="flex justify-between mt-4">
          <div className="h-5 bg-gray-300 rounded w-1/3"></div>
          <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  // === Filter Logic ===
  const filteredRooms = rooms.filter((room) => {
    const price = Number(room.rent?.replace(/\D/g, "")) || 0;

    if (minRent && price < Number(minRent)) return false;
    if (maxRent && price > Number(maxRent)) return false;

    const roomAmenities = Array.isArray(room.amenities)
      ? room.amenities.map((a) =>
          a
            .replace(/"/g, "")
            .replace(/\[/g, "")
            .replace(/\]/g, "")
            .trim()
        )
      : typeof room.amenities === "string"
      ? room.amenities
          .replace(/\[/g, "")
          .replace(/\]/g, "")
          .replace(/"/g, "")
          .split(",")
          .map((a) => a.trim())
      : [];

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((a) => roomAmenities.includes(a));

    return matchesAmenities;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-8 text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Find your Cozy Room
        </h1>

        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiUpload size={18} />
            Upload Room
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow hover:opacity-90 transition"
          >
            <FiHome size={18} />
            Find Roommates
          </Link>
        </div>
      </section>

      {/* Gradient Separator */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8" />

      {/* Filter Controls (responsive) */}
      <div className="mb-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Rent bubble - full width on mobile, compact on desktop */}
          <div className="w-full sm:w-[340px]">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm h-[46px] w-full">
              <span className="text-gray-700 text-sm font-medium">Rent</span>
              <input
                type="number"
                placeholder="Min"
                value={tempMinRent}
                onChange={(e) => setTempMinRent(e.target.value)}
                className="w-full sm:w-28 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none"
              />
              <span className="text-gray-500 text-sm">-</span>
              <input
                type="number"
                placeholder="Max"
                value={tempMaxRent}
                onChange={(e) => setTempMaxRent(e.target.value)}
                className="w-full sm:w-28 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none"
              />
            </div>
          </div>

          {/* Filter dropdown bubble */}
          <div className="w-full sm:w-auto relative" ref={dropdownRef}>
            <details className="group">
              <summary
                onClick={() => {
                  // initialize temp values when opening filters
                  setTempSelectedAmenities(selectedAmenities);
                  setTempMinRent(minRent);
                  setTempMaxRent(maxRent);
                }}
                className="flex items-center gap-2 cursor-pointer text-gray-700 text-sm font-medium bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/90 transition h-[46px] w-full sm:w-auto"
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

              <div className="mt-2 sm:absolute left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full sm:w-60 space-y-3 z-50">
                <label className="text-xs text-gray-500">Amenities</label>
                <div className="flex flex-col gap-2">
                  {Object.keys(amenityIcons).map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tempSelectedAmenities.includes(amenity)}
                        onChange={() =>
                          setTempSelectedAmenities((prev) =>
                            prev.includes(amenity)
                              ? prev.filter((a) => a !== amenity)
                              : [...prev, amenity]
                          )
                        }
                        className="rounded border-gray-300 text-gray-700 focus:ring-gray-400"
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
                {/* Reset + Apply Buttons for listing filters */}
                <div className="flex justify-end items-center pt-2 border-t border-gray-100 gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    onClick={() => {
                      // clear temps and applied filters
                      setTempSelectedAmenities([]);
                      setTempMinRent("");
                      setTempMaxRent("");
                      setSelectedAmenities([]);
                      setMinRent("");
                      setMaxRent("");
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
                      setSelectedAmenities(tempSelectedAmenities);
                      setMinRent(tempMinRent);
                      setMaxRent(tempMaxRent);
                      // close the details dropdown if open
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && error && (
          <p className="col-span-full text-center text-red-500">{error}</p>
        )}

        {!loading &&
          !error &&
          filteredRooms.length > 0 &&
          filteredRooms.map((room) => {
            const imgs = parseImageUrls(room.image_urls);
            const firstImage = imgs.length ? imgs[0] : placeholder;
            const amenities = Array.isArray(room.amenities)
              ? room.amenities.map((a) =>
                  a
                    .replace(/"/g, "")
                    .replace(/\[/g, "")
                    .replace(/\]/g, "")
                    .trim()
                )
              : typeof room.amenities === "string"
              ? room.amenities
                  .replace(/\[/g, "")
                  .replace(/\]/g, "")
                  .replace(/"/g, "")
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean)
              : [];

            return (
              <Link
                key={room.room_id}
                to={`/room/${room.room_id}`}
                className="group relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-300"
              >
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
                  <img
                    src={firstImage}
                    alt="Room"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholder;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />

                  {/* Bottom bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-rose-500/90 text-white text-sm font-semibold rounded-full shadow-md">
                      {room.rent ? `${room.rent} ₫` : "—"}
                    </span>
                    <div className="flex gap-1">
                      {amenities.slice(0, 3).map((am, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm"
                          title={am}
                        >
                          {amenityIcons[am] || (
                            <span className="text-[10px] text-gray-600">
                              {am[0] || "?"}
                            </span>
                          )}
                        </div>
                      ))}
                      {amenities.length > 3 && (
                        <span className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full text-xs text-gray-600 shadow-sm">
                          +{amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-5 flex flex-col justify-between h-40">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {room.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between text-sm mt-4 text-gray-500">
                    <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <span className="bg-gray-100 px-2 py-1 rounded-md">
                        bedrooms - {room.bedrooms || "?"}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-md">
                        bathrooms - {room.bathrooms || "?"}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 font-medium text-xs">
                      {room.category || "—"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

        {!loading && !error && filteredRooms.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No rooms match your filters.
          </p>
        )}
      </main>
    </div>
  );
}
