import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";

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

    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export default function ListingPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");

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

  if (loading) return <div className="p-6">Loading rooms...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (rooms.length === 0) return <div className="p-6">No rooms available yet.</div>;

  // === Filtering Logic ===
  const filteredRooms = rooms.filter((room) => {
    const price = Number(room.price) || 0;

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      room.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Budget filter
    let matchesBudget = true;
    if (budgetFilter === "below-3") matchesBudget = price < 3000000;
    else if (budgetFilter === "3-5")
      matchesBudget = price >= 3000000 && price <= 5000000;
    else if (budgetFilter === "5-7")
      matchesBudget = price > 5000000 && price <= 7000000;
    else if (budgetFilter === "7-above") matchesBudget = price > 7000000;

    return matchesSearch && matchesBudget;
  });

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 mt-10 mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Find the Perfect Room for You!
        </h1>
        <p className="text-gray-500 mt-3 text-base sm:text-lg">
          Browse available rooms and discover your next home — simple, clear, and convenient.
        </p>
      </section>

      {/* Filter Row */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />

          {/* Budget Filter */}
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

          {/* Upload Button */}
          <Link
            to="/upload"
            className="px-5 py-3 rounded-lg font-semibold text-white shadow-md hover:opacity-90 transition bg-gradient-to-r from-rose-500 via-pink-500 to-red-500"
          >
            + Upload Room
          </Link>
        </div>
      </div>

      {/* Rooms Grid */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => {
            const imgs = parseImageUrls(room.image_urls);
            const firstImage = imgs.length ? imgs[0] : null;

            return (
              <Link
                key={room.room_id}
                to={`/room/${room.room_id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition block"
              >
                {/* Image */}
                <div className="h-48 w-full flex items-center justify-center bg-gray-200">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt="Room"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = placeholder;
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h2 className="font-semibold text-lg truncate">
                    {room.room_name || "No Name"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-2 overflow-hidden text-ellipsis h-10">
                    {room.description || "No description available."}
                  </p>
                  <p className="text-blue-600 font-bold mt-3">
                    {room.price ? `${room.price} VND` : "-"}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No rooms match your filters.
          </p>
        )}
      </main>
    </div>
  );
}
