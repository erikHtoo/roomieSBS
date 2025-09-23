  import { useEffect, useState } from "react";
  import axios from "axios";
  import { useParams } from "react-router-dom";
  import Navbar from "../components/navbar.jsx";

  // helper to parse image_urls (like HomePage)
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

  export default function RoomPage() {
    const { id: roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
      const fetchRoom = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/rooms/${roomId}`, {
            timeout: 20000,
          });
          if (!res.data?.room) throw new Error("Room not found");
          setRoom(res.data.room);
        } catch (err) {
          console.error("Error fetching room:", err);
          setError("Room not found or invalid ID");
        } finally {
          setLoading(false);
        }
      };

      if (roomId) fetchRoom();
    }, [roomId]);

    if (loading) return <div className="p-8">Loading room…</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const images = parseImageUrls(room.image_urls);
    const formattedDate = room.created_at
      ? new Date(room.created_at).toLocaleDateString()
      : "-";

    const closeModal = () => setSelectedIndex(null);
    const showPrev = (e) => {
      e.stopPropagation();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };
    const showNext = (e) => {
      e.stopPropagation();
      setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
          {/* Title */}
          <h2 className="text-3xl font-bold mb-2">{room.room_name}</h2>
          <p className="text-gray-500 text-sm mb-6">Posted on {formattedDate}</p>

          {/* Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`room-${idx}`}
                  className="rounded-lg object-cover w-full h-48 cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-700 mb-6">{room.description || "-"}</p>

          {/* Info Section */}
          <div className="space-y-3">
            <p>
              <span className="font-semibold">💰 Price:</span> {room.price || "-"}
            </p>
            <p>
              <span className="font-semibold">🔒 Deposit:</span>{" "}
              {room.deposit || "-"}
            </p>
            <p>
              <span className="font-semibold">👤 Preferred Gender:</span>{" "}
              {room.preferred_gender === true
                ? "Male"
                : room.preferred_gender === false
                ? "Female"
                : "Any"}
            </p>
            <p>
              <span className="font-semibold">📍 Address:</span>{" "}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  room.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {room.address}
              </a>
            </p>
              <p>
              <span className="font-semibold">📞 Contact:</span>
              <div className="ml-2 space-y-1">
                {room.contact?.facebook && (
                  <div>
                    Facebook:{" "}
                    <a
                      href={room.contact.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {room.contact.facebook}
                    </a>
                  </div>
                )}
                {room.contact?.zalo && <div>Zalo: {room.contact.zalo}</div>}
                {room.contact?.viber && <div>Viber: {room.contact.viber}</div>}
              </div>
            </p>
            <p>
              <span className="font-semibold">📝 About Roomies:</span>{" "}
              {room.about || "-"}
            </p>
          </div>
        </div>

        {/* Modal Lightbox */}
        {selectedIndex !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-6 text-white text-3xl font-bold"
            >
              ✕
            </button>

            {/* Prev button */}
            <button
              onClick={showPrev}
              className="absolute left-6 text-white text-4xl"
            >
              ‹
            </button>

            {/* Image */}
            <img
              src={images[selectedIndex]}
              alt={`room-full-${selectedIndex}`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
            />

            {/* Next button */}
            <button
              onClick={showNext}
              className="absolute right-6 text-white text-4xl"
            >
              ›
            </button>
          </div>
        )}
      </div>
    );
  }
