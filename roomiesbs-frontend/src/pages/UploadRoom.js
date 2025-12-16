import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DOMPurify from "dompurify";
import {
  FaParking,
  FaSwimmingPool,
  FaDumbbell,
  FaPaw,
  FaCouch,
  FaBuilding,
} from "react-icons/fa";

const UploadRoom = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    // Sanitize text fields to prevent XSS
    const textFields = [
      "address",
      "about",
      "remainingContract",
      "zalo",
      "facebook",
      "viber",
    ];
    const sanitizedValue = textFields.includes(key)
      ? DOMPurify.sanitize(value)
      : value;
    setForm({ ...form, [key]: sanitizedValue });
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

  // Validation functions
  const validateStep1 = () => {
    const requiredFields = ["address", "roomType", "rent", "deposit"];
    for (const field of requiredFields) {
      if (!form[field]?.trim()) return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const requiredFields = ["bedrooms", "bathrooms", "about"];
    for (const field of requiredFields) {
      if (!form[field]?.trim()) return false;
    }
    // Require at least one contact method
    const hasContact =
      (form.zalo && String(form.zalo).trim() !== "") ||
      (form.facebook && String(form.facebook).trim() !== "") ||
      (form.viber && String(form.viber).trim() !== "");
    return hasContact;
  };

  const validateAll = () => {
    // all required except transferContract
    const requiredFields = [
      "title",
      "price",
      "address",
      "city",
      "district",
      "description",
      "roomType",
      "size",
      "floor",
    ];
    return (
      requiredFields.every((field) => form[field]?.trim() !== "") &&
      form.imageUrls.length > 0
    ); // must have at least one image
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

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
        imageUrls, // these are File objects now, not just names
      } = form;

      // 1️⃣ Get current user + token
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const ownerId = data?.session?.user?.id;

      if (!token || !ownerId) {
        toast.error("You must be logged in to post a room.");
        setIsSubmitting(false);
        return;
      }

      // 2️⃣ Generate timestamp for grouping image uploads
      const createdAt = new Date().toISOString();

      // 3️⃣ Upload images first (using ownerId + createdAt)
      const uploadedUrls = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const file = imageUrls[i];
        const filePath = `${ownerId}/${createdAt}-${i}-${slugify(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("room-images")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload failed:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          setIsSubmitting(false);
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("room-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // 4️⃣ Create room (with image URLs)
      const payload = {
        description: DOMPurify.sanitize(about),
        rent: parseFloat(rent) || "",
        deposit: parseFloat(deposit) || "",
        image_urls: uploadedUrls, // already uploaded
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
        amenities: amenities.map((a) => DOMPurify.sanitize(a)),
        created_at: createdAt,
      };

      const createRes = await axios.post(
        "http://localhost:5000/rooms",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!createRes.data.success) {
        toast.error("Failed to create room.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Room uploaded successfully!");

      // 5️⃣ Reset + redirect
      setForm({
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
        toast.error("Server error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Post Your Room
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
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a valid link"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">
                    Room Details
                  </h2>
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
                      )
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
                      placeholder="Rent (VND)"
                      value={
                        form.rent
                          ? parseInt(
                              form.rent.toString().replace(/[^\d]/g, "")
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
                      placeholder="Deposit (VND)"
                      value={
                        form.deposit
                          ? parseInt(
                              form.deposit.toString().replace(/[^\d]/g, "")
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
                    onClick={() => {
                      if (validateStep1()) handleNext();
                    }}
                    className={`px-6 py-2 rounded-lg ${
                      validateStep1()
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500"
                    }`}
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
                      <option value="4+">4+</option>
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
                      <option value="4+">4+</option>
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

                <div>
                  <label className="flex items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.transferContract}
                      onChange={(e) =>
                        handleChange("transferContract", e.target.checked)
                      }
                    />
                    Transfer contract available?
                  </label>
                  {form.transferContract && (
                    <input
                      type="text"
                      className="w-full border rounded-lg p-3 mt-3"
                      placeholder="Remaining contract period"
                      value={form.remainingContract}
                      onChange={(e) =>
                        handleChange("remainingContract", e.target.value)
                      }
                    />
                  )}
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">
                    Contact Info
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Zalo number"
                      inputMode="numeric"
                      className="border rounded-lg p-3"
                      value={form.zalo}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, "");
                        handleChange("zalo", value);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Facebook link"
                      className="border rounded-lg p-3"
                      value={form.facebook}
                      onChange={(e) => handleChange("facebook", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Viber number"
                      inputMode="numeric"
                      className="border rounded-lg p-3"
                      value={form.viber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        handleChange("viber", value);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (validateStep2()) handleNext();
                    }}
                    className={`px-6 py-2 rounded-lg ${
                      validateStep2()
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <h2 className="font-medium text-gray-700 mb-2">
                  Upload Images
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Existing image previews */}
                  {form.imageUrls.map((file, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden border bg-gray-100 h-32"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6"
                        onClick={() =>
                          handleChange(
                            "imageUrls",
                            form.imageUrls.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add new image box */}
                  {form.imageUrls.length < 12 && (
                    <div
                      onClick={() =>
                        document.getElementById("imageUpload").click()
                      }
                      className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer text-gray-400 text-4xl hover:border-blue-500 hover:text-blue-500"
                    >
                      +
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  id="imageUpload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    handleChange("imageUrls", [
                      ...form.imageUrls,
                      ...Array.from(e.target.files),
                    ])
                  }
                  className="hidden"
                />

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!validateAll() || isSubmitting}
                    className={`px-6 py-2 rounded-lg ${
                      validateAll() && !isSubmitting
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "Uploading..." : "Upload Room"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default UploadRoom;
