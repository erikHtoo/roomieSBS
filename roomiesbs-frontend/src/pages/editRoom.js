import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DOMPurify from "dompurify";
import ImageUploadField from "../components/ImageUploadField.jsx";
import {
  FaParking,
  FaSwimmingPool,
  FaDumbbell,
  FaPaw,
  FaCouch,
  FaBuilding,
} from "react-icons/fa";

const EditRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const errorShownRef = React.useRef(false);
  const [form, setForm] = useState({
    address: "",
    rent: "",
    deposit: "",
    roomType: "",
    bedrooms: "",
    bathrooms: "",
    amenities: [],
    about: "",
    transferContract: false,
    remainingContract: "",
    zalo: "",
    facebook: "",
    viber: "",
    imageUrls: [],
  });

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  const handleChange = (key, value) => {
    // Apply character limits
    if (key === "about" && value.length > 1200) return;
    setForm({ ...form, [key]: value });
  };

  const handleAmenityToggle = (amenity) => {
    setForm((prev) => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "");

  // ✅ Load room data on mount
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        const { data: roomData } = await axios.get(
          `${process.env.REACT_APP_API_URL}/rooms/edit/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const r = roomData.room;

        const parsedAmenities = Array.isArray(r.amenities)
          ? r.amenities
          : (() => {
              try {
                const parsed = JSON.parse(r.amenities || "[]");
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })();

        setForm({
          address: r.address || "",
          rent: r.rent || "",
          deposit: r.deposit || "",
          roomType: r.category || "",
          bedrooms: r.bedrooms || "",
          bathrooms: r.bathrooms || "",
          amenities: parsedAmenities,
          about: r.description || "",
          transferContract: !!r.transfer_contract,
          remainingContract: r.remaining_contract || "",
          zalo: r.contact?.zalo || "",
          facebook: r.contact?.facebook || "",
          viber: r.contact?.viber || "",
          imageUrls: Array.isArray(r.image_urls)
            ? r.image_urls.map((url, index) => ({
                id: `${url}-${index}`,
                file: null,
                preview: url,
              }))
            : JSON.parse(r.image_urls || "[]").map((url, index) => ({
                id: `${url}-${index}`,
                file: null,
                preview: url,
              })),
        });
      } catch (err) {
        console.error(err);
        if (err.response?.status === 403) {
          if (!errorShownRef.current) {
            toast.error("You don't have permission to edit this room.");
            errorShownRef.current = true;
          }
          navigate("/rooms");
          return;
        }
        toast.error("Failed to load room data.");
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigate]);

  const handleSubmit = async () => {
    try {
      const {
        address,
        rent,
        deposit,
        roomType,
        bedrooms,
        bathrooms,
        amenities,
        about,
        transferContract,
        remainingContract,
        zalo,
        facebook,
        viber,
        imageUrls,
      } = form;

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const ownerId = data?.session?.user?.id;

      if (!token || !ownerId) {
        toast.error("You must be logged in to update.");
        return;
      }

      const createdAt = new Date().toISOString();
      const finalImageUrls = [];

      for (let i = 0; i < imageUrls.length; i++) {
        const image = imageUrls[i];
        if (image.file) {
          const filePath = `${ownerId}/${createdAt}-${i}-${slugify(image.file.name)}`;
          const { error: uploadError } = await supabase.storage
            .from("room-images")
            .upload(filePath, image.file);

          if (uploadError) {
            toast.error(`Failed to upload ${image.file.name}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("room-images")
            .getPublicUrl(filePath);

          finalImageUrls.push(publicUrlData.publicUrl);
        } else if (image.preview || image.url) {
          finalImageUrls.push(image.preview || image.url);
        }
      }

      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : (() => {
            try {
              const parsed = JSON.parse(amenities || "[]");
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })();

      const payload = {
        description: DOMPurify.sanitize(about),
        rent: parseFloat(rent) || "",
        deposit: parseFloat(deposit) || "",
        image_urls: finalImageUrls,
        address: DOMPurify.sanitize(address),
        contact: {
          zalo: DOMPurify.sanitize(zalo),
          facebook: DOMPurify.sanitize(facebook),
          viber: DOMPurify.sanitize(viber),
        },
        transfer_contract: transferContract,
        remaining_contract: remainingContract
          ? parseFloat(remainingContract)
          : null,
        category: DOMPurify.sanitize(roomType),
        bedrooms: parseInt(bedrooms) || "",
        bathrooms: parseInt(bathrooms) || "",
        amenities: amenitiesArray.map((a) => DOMPurify.sanitize(a)),
      };

      const updateRes = await axios.put(
        `${process.env.REACT_APP_API_URL}/rooms/${roomId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!updateRes.data.success) {
        toast.error("Failed to update room.");
        return;
      }

      toast.success("Room updated successfully!");
      navigate("/rooms");
    } catch (err) {
      console.error(err);
      // Show specific error message from backend if available
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = err.response.data.errors[0];
        toast.error(firstError?.msg || "Validation failed");
      } else {
        toast.error("Update failed. Please try again.");
      }
    }
  };

  const pageTransition = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.3 },
  };

  const amenitiesList = [
    { name: "Parking", icon: <FaParking /> },
    { name: "Swimming Pool", icon: <FaSwimmingPool /> },
    { name: "Gym", icon: <FaDumbbell /> },
    { name: "Pet Friendly", icon: <FaPaw /> },
    { name: "Furnished", icon: <FaCouch /> },
    { name: "Elevator", icon: <FaBuilding /> },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading room data...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Edit Room Listing
          </h1>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-2 w-10 rounded-full ${
                  step >= n ? "bg-blue-500" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>

          <motion.div key={step} {...pageTransition}>
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Address</h2>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    placeholder="Room address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Room Type</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {["Studio", "Apartment", "Condo", "Basement"].map(
                      (type) => (
                        <button
                          key={type}
                          className={`border rounded-lg py-2 ${
                            form.roomType === type
                              ? "bg-blue-500 text-white"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onClick={() => handleChange("roomType", type)}
                        >
                          {type}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="font-medium text-gray-700 mb-2">Rent</h2>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full border rounded-lg p-3"
                      placeholder="Rent (USD)"
                      value={
                        form.rent
                          ? parseInt(
                              form.rent.toString().replace(/[^\d]/g, ""),
                            ).toLocaleString("en-US")
                          : ""
                      }
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/[^\d]/g, "");
                        handleChange("rent", cleanValue);
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-700 mb-2">Deposit</h2>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full border rounded-lg p-3"
                      placeholder="Deposit (USD)"
                      value={
                        form.deposit
                          ? parseInt(
                              form.deposit.toString().replace(/[^\d]/g, ""),
                            ).toLocaleString("en-US")
                          : ""
                      }
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/[^\d]/g, "");
                        handleChange("deposit", cleanValue);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="font-medium text-gray-700 mb-2">Bedrooms</h2>
                    <select
                      className="w-full border rounded-lg p-3"
                      value={form.bedrooms}
                      onChange={(e) => handleChange("bedrooms", e.target.value)}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h2 className="font-medium text-gray-700 mb-2">
                      Bathrooms
                    </h2>
                    <select
                      className="w-full border rounded-lg p-3"
                      value={form.bathrooms}
                      onChange={(e) =>
                        handleChange("bathrooms", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenitiesList.map((item) => (
                      <button
                        key={item.name}
                        className={`flex items-center justify-center gap-2 border rounded-lg py-2 ${
                          form.amenities.includes(item.name)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleAmenityToggle(item.name)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.transferContract}
                      onChange={(e) =>
                        handleChange("transferContract", e.target.checked)
                      }
                    />
                    Transfer contract?
                  </label>
                  {form.transferContract && (
                    <input
                      type="text"
                      className="w-full border rounded-lg p-3 mt-3"
                      placeholder="Remaining contract months"
                      value={form.remainingContract}
                      onChange={(e) =>
                        handleChange("remainingContract", e.target.value)
                      }
                    />
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-gray-700">
                      About the Area
                    </h2>
                    <span className="text-sm text-gray-500">
                      {form.about.length}/1200
                    </span>
                  </div>
                  <textarea
                    className="w-full border rounded-lg p-3 h-28"
                    placeholder="Describe nearby area, accessibility, etc."
                    value={form.about}
                    onChange={(e) => handleChange("about", e.target.value)}
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <ImageUploadField
                  label="Photos"
                  images={form.imageUrls}
                  setImages={(updater) =>
                    setForm((prev) => ({
                      ...prev,
                      imageUrls:
                        typeof updater === "function"
                          ? updater(prev.imageUrls)
                          : updater,
                    }))
                  }
                  maxImages={12}
                />

                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EditRoom;
