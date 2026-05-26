import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  FaBed,
  FaBath,
  FaFacebook,
  FaPhoneAlt,
  FaParking,
  FaSwimmingPool,
  FaDumbbell,
  FaPaw,
  FaCouch,
  FaBuilding,
} from "react-icons/fa";

const RoomPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/rooms/${id}`,
        );
        setRoom(res.data.room);
        setImages(res.data.room.image_urls || []);
      } catch (err) {
        console.error("Failed to fetch room:", err);
      }
    };
    fetchRoom();
  }, [id]);

  if (!room)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );

  const contact =
    typeof room.contact === "string"
      ? (() => {
          try {
            return JSON.parse(room.contact);
          } catch {
            return {};
          }
        })()
      : room.contact || {};
  const formattedDate = new Date(room.created_at).toLocaleDateString();

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = parseFloat(String(value).replace(/[^\d.]/g, ""));
    if (isNaN(num)) return value;
    return num.toLocaleString("en-US");
  };

  const closeModal = () => setSelectedIndex(null);
  const showNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };
  const showPrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const amenitiesIcons = {
    Parking: <FaParking className="text-gray-700" />,
    "Swimming Pool": <FaSwimmingPool className="text-blue-500" />,
    Gym: <FaDumbbell className="text-red-400" />,
    "Pet Friendly": <FaPaw className="text-yellow-500" />,
    Furnished: <FaCouch className="text-purple-500" />,
    Elevator: <FaBuilding className="text-gray-500" />,
  };

  const amenitiesArray =
    typeof room.amenities === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(room.amenities);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : Array.isArray(room.amenities)
        ? room.amenities
        : [];

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
                alt="main-room"
                className="w-full h-64 sm:h-[450px] md:h-[550px] lg:h-[600px] object-cover rounded-xl"
                loading="lazy"
                onClick={() => setSelectedIndex(0)}
              />
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col mb-10 px-3">
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h1 className="text-4xl font-semibold text-gray-900">
                  {formatPrice(room.rent)} VND
                </h1>
              </div>
              <div className="flex gap-8 text-gray-600 text-lg">
                <div className="flex items-center gap-2">
                  <FaBed className="text-red-500" /> {room.bedrooms} bedrooms
                </div>
                <div className="flex items-center gap-2">
                  <FaBath className="text-red-400" /> {room.bathrooms} bathrooms
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-1">
              Created on {formattedDate}
            </p>
          </div>

          {/* Info Section */}
          <div className="divide-y divide-gray-200">
            {[
              ["Property type", room.category || "-"],
              ["Rent", `${formatPrice(room.rent)} VND`],
              ["Deposit", `${formatPrice(room.deposit)} VND`],
              ...(room.transfer_contract
                ? [
                    [
                      "Remaining contract",
                      room.remaining_contract + " months" || "N/A",
                    ],
                  ]
                : []),
            ].map(([label, value], idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center px-3 py-3 text-lg ${
                  idx % 2 === 0 ? "bg-gray-75" : "bg-white"
                }`}
              >
                <span className="text-gray-500">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {amenitiesArray?.length > 0 && (
            <div className="flex flex-wrap px-3 gap-4 mt-10">
              {amenitiesArray.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-gray-700"
                >
                  {amenitiesIcons[a] || null}
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-10 px-3">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              About Room
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">
              {room.description || "No description provided."}
            </p>
          </div>

          {/* Address & Contact side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-10 px-3">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Contact
              </h3>
              <div className="space-y-3 text-gray-700">
                {contact?.facebook && (
                  <div className="flex items-center gap-2">
                    <FaFacebook className="text-blue-600" />
                    <a
                      href={
                        contact.facebook.startsWith("http")
                          ? contact.facebook
                          : `https://${contact.facebook}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Facebook
                    </a>
                  </div>
                )}
                {contact?.zalo && (
                  <div className="flex items-center gap-2">
                    <FaPhoneAlt className="text-green-600" />
                    <span>Zalo: {contact.zalo}</span>
                  </div>
                )}
                {contact?.viber && (
                  <div className="flex items-center gap-2">
                    <FaPhoneAlt className="text-purple-600" />
                    <span>Viber: {contact.viber}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Address
              </h3>
              <a
                href={
                  room.address.startsWith("http")
                    ? room.address
                    : `https://${room.address}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm transition">
                  <FaMapMarkerAlt className="text-red-500 text-xl" />
                </div>
                <span className="text-lg underline text-blue-600 break-all">
                  View on Google Maps
                </span>
              </a>
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
            alt={`room-full-${selectedIndex}`}
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

export default RoomPage;
