import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

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

export default function HomePage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23737474'>No Image</text></svg>`
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      {/* Rooms Grid (centered, max width) */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const imgs = parseImageUrls(room.image_urls);
          const firstImage = imgs.length ? imgs[0] : null;

          return (
            <Link
              key={room.room_id}
              to={`/room/${room.room_id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition block"
            >
              {/* Image container (keeps same size, prevents hard crop) */}
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
        })}
      </main>
    </div>
  );
}
