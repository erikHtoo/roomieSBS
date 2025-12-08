import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import { useAuth } from "../auth/useAuth.js";
import { useParams } from "react-router-dom";
import {
  FaFacebook,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaPaw,
  FaGamepad,
  FaBriefcase,
  FaLaptopCode,
  FaGlassCheers,
  FaSmokingBan,
  FaHourglassHalf,
  FaInfinity,
} from "react-icons/fa";

const safeParseArray = (val) => {
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
        if (Array.isArray(parsedBracket)) return parsedBracket.filter(Boolean);
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
};

const RoommatePage = () => {
  const { id } = useParams();
  const [roommate, setRoommate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFriends, setShowFriends] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const { user, session } = useAuth();

  useEffect(() => {
    const fetchRoommate = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/roommates/${id}`);
        setRoommate(res.data.profile);
      } catch (err) {
        console.error("Failed to fetch roommate:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoommate();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );

  if (!roommate)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">
        Roommate not found.
      </div>
    );

  // If profile is inactive, only the owner may view it
  const isActive =
    roommate.person_active === undefined ||
    roommate.person_active === null ||
    roommate.person_active === true ||
    roommate.person_active === "true";

  if (!isActive && session?.user?.id !== roommate.id) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Profile not available
          </h2>
          <p className="text-gray-500">This profile is not publicly visible.</p>
        </div>
      </div>
    );
  }

  // ✅ Extract all data safely
  const {
    person_name = "Unknown",
    person_gender = "N/A",
    person_budget,
    person_preferred_location,
    person_about,
    created_at,
    person_contact,
    person_friends,
    person_traits,
    person_image_urls,
  } = roommate;

  // ✅ Safely parse JSON fields
  const contact =
    typeof person_contact === "string"
      ? JSON.parse(person_contact || "{}")
      : person_contact || {};

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const strValue =
      typeof value === "number" ? value.toString() : String(value);
    const num = parseFloat(strValue.replace(/[^\d.]/g, ""));
    if (isNaN(num)) return strValue;
    return num.toLocaleString("en-US");
  };

  let images = [];
  try {
    images = safeParseArray(person_image_urls);
  } catch {
    images = [];
  }

  const traits = safeParseArray(person_traits);
  const friends = safeParseArray(person_friends);

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString()
    : "N/A";

  const openImage = (url, index) => {
    setSelectedImage(url);
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedIndex(null);
  };

  const showNext = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
    setSelectedImage(images[(selectedIndex + 1) % images.length]);
  };

  const showPrev = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    setSelectedImage(
      images[(selectedIndex - 1 + images.length) % images.length]
    );
  };

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
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-5xl mx-auto"
        >
          {/* Image */}
          {images.length > 0 && (
            <div className="relative mb-8">
              <img
                src={images[0]}
                alt={person_name}
                className="w-full h-64 sm:h-[450px] md:h-[550px] object-cover rounded-xl cursor-pointer"
                loading="lazy"
                onClick={() => setSelectedIndex(0)}
              />
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col mb-10 px-3">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h1 className="text-4xl font-semibold text-gray-900">
                {person_name}
              </h1>
              <span className="text-lg text-gray-600 capitalize ml-4">
                {person_gender === false
                  ? "Female"
                  : person_gender
                  ? "Male"
                  : "Not specified"}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Created on {formattedDate}
            </p>
          </div>

          {/* Info Section */}
          <div className="divide-y divide-gray-200">
            <div className="flex justify-between items-center px-3 py-3 text-lg bg-gray-75">
              <span className="text-gray-500">Budget:</span>
              <span className="font-medium text-gray-800">
                {formatPrice(person_budget)} VND
              </span>
            </div>

            <div className="flex justify-between items-center px-3 py-3 text-lg bg-white">
              <span className="text-gray-500">Preferred Location:</span>
              <span className="font-medium text-gray-800">
                {person_preferred_location || "Not specified"}
              </span>
            </div>

            <div className="px-3 py-3 text-lg bg-gray-75">
              <div
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() => setShowFriends((prev) => !prev)}
              >
                <span className="text-gray-500">Moving with:</span>
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  {friends.length > 0
                    ? `${friends.length} friend${friends.length > 1 ? "s" : ""}`
                    : "alone"}
                  {friends.length > 0 &&
                    (showFriends ? (
                      <FaChevronUp className="text-gray-500 text-sm" />
                    ) : (
                      <FaChevronDown className="text-gray-500 text-sm" />
                    ))}
                </div>
              </div>

              {showFriends && friends.length > 0 && (
                <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
                  {friends.map((f, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center border border-gray-200 rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {f.name?.trim() || "Unnamed"}
                        </p>
                        <p className="text-sm text-gray-500">{f.gender}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Traits */}
          {traits.length > 0 && (
            <div className="mt-10 px-3">
              <div className="flex flex-wrap px-1 gap-4 mt-4">
                {traits.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-gray-700"
                  >
                    {traitIcons[t] || null}
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {person_about && (
            <div className="mt-10 px-3">
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {person_about}
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="mt-10 px-3">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Contact
            </h3>
            <div className="space-y-3 text-gray-700">
              {contact?.facebook && (
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                  <FaFacebook className="text-blue-600 text-xl" />
                  <a
                    href={
                      contact.facebook.startsWith("http")
                        ? contact.facebook
                        : `https://${contact.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 font-medium underline"
                  >
                    Facebook
                  </a>
                </div>
              )}
              {contact?.zalo && (
                <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                  <FaPhoneAlt className="text-green-600 text-xl" />
                  <span>Zalo: {contact.zalo}</span>
                </div>
              )}
              {contact?.viber && (
                <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                  <FaPhoneAlt className="text-purple-600 text-xl" />
                  <span>Viber: {contact.viber}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-6 text-white text-3xl font-bold"
          >
            ✕
          </button>

          <button
            onClick={showPrev}
            className="absolute left-6 text-white text-4xl"
          >
            ‹
          </button>

          <img
            src={images[selectedIndex]}
            alt="roommate-full"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

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
};

export default RoommatePage;
