import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DOMPurify from "dompurify";
import ImageUploadField from "../components/ImageUploadField.jsx";
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

const UploadRoommateProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    age: "",
    budget: "",
    gender: "",
    withFriends: "alone",
    friends: [{ name: "", gender: "" }],
    preferredLocation: "",
    about: "",
    traits: [],
    zalo: "",
    facebook: "",
    viber: "",
    imageUrls: [],
  });

  const handleChange = (key, value) => {
    // Apply character limits
    if (key === "name" && value.length > 100) return;
    if (key === "about" && value.length > 1200) return;
    // Sanitize text fields to prevent XSS
    const textFields = [
      "name",
      "about",
      "preferredLocation",
      "zalo",
      "facebook",
      "viber",
    ];
    const sanitizedValue = textFields.includes(key)
      ? DOMPurify.sanitize(value)
      : value;
    setForm({ ...form, [key]: sanitizedValue });
  };

  const handleFriendChange = (index, field, value) => {
    const updatedFriends = [...form.friends];
    updatedFriends[index][field] = value;
    setForm({ ...form, friends: updatedFriends });
  };

  const addFriend = () =>
    setForm({
      ...form,
      friends: [...form.friends, { name: "", age: "" }],
    });

  const removeFriend = (index) =>
    setForm({
      ...form,
      friends: form.friends.filter((_, i) => i !== index),
    });

  const handleTraitToggle = (trait) => {
    setForm((prev) => {
      const traits = prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait];
      return { ...prev, traits };
    });
  };

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "");

  const formatBudget = (value) => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric ? Number(numeric).toLocaleString("en-US") : "";
  };

  // Validation
  const validateStep1 = () => {
    const requiredFields = ["name", "budget", "gender", "preferredLocation"];
    const baseValid = requiredFields.every(
      (field) => form[field]?.trim() !== "",
    );
    if (form.withFriends === "friends") {
      return (
        baseValid &&
        form.friends.length > 0 &&
        form.friends.every((f) => f.name.trim() && f.gender.trim())
      );
    }
    return baseValid;
  };

  const validateStep2 = () => {
    // require about and at least one contact method
    if (!form.about || String(form.about).trim() === "") return false;
    const hasContact =
      (form.zalo && String(form.zalo).trim() !== "") ||
      (form.facebook && String(form.facebook).trim() !== "") ||
      (form.viber && String(form.viber).trim() !== "");
    return !!hasContact;
  };

  const validateFacebook = () => {
    if (form.facebook && !/^https?:\/\/.+/i.test(form.facebook)) {
      toast.error(
        "Please enter a valid Facebook link (must start with http or https).",
      );
      return false;
    }
    return true;
  };

  const validateAll = () => form.imageUrls.length > 0;

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      const {
        name,
        gender,
        withFriends,
        friends,
        preferredLocation,
        about,
        traits,
        zalo,
        facebook,
        viber,
        imageUrls,
      } = form;
      const imageFiles = imageUrls.map((image) => image.file);

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const userId = data?.session?.user?.id;

      if (!token || !userId) {
        toast.error("You must be logged in to create a roommate profile.");
        return;
      }

      const createdAt = new Date().toISOString();
      const uploadedUrls = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = `${userId}/${createdAt}-${i}-${slugify(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("roommate-images")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("roommate-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const cleanBudget = (() => {
        if (!form.budget) return undefined;
        if (typeof form.budget === "string") {
          const stripped = form.budget.replace(/,/g, "");
          if (stripped.trim() === "") return undefined;
          const num = parseFloat(stripped);
          return isNaN(num) ? undefined : num;
        }
        return form.budget;
      })();

      const payload = {
        person_image_urls: uploadedUrls,
        person_name: DOMPurify.sanitize(name),
        person_gender: gender === "male",
        person_budget: cleanBudget,
        person_preferred_location: DOMPurify.sanitize(preferredLocation),
        person_about: DOMPurify.sanitize(about),
        person_contact: {
          zalo: DOMPurify.sanitize(zalo),
          facebook: DOMPurify.sanitize(facebook),
          viber: DOMPurify.sanitize(viber),
        },
        person_friends:
          withFriends === "friends"
            ? friends.map((f) => ({
                ...f,
                name: DOMPurify.sanitize(f.name),
              }))
            : undefined,
        person_traits: traits && traits.length > 0 ? traits : undefined,
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/roommates`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.data.success) {
        toast.error("Failed to upload roommate profile.");
        return;
      }

      toast.success("Roommate profile created!");
      navigate("/");
    } catch (err) {
      if (err.response?.data?.errors) {
        const first = err.response.data.errors[0];
        toast.error(first?.msg || "Validation failed");
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Server error. Please try again.");
      }
    }
  };

  const traitIcons = [
    { name: "Pet Friendly", icon: <FaPaw /> },
    { name: "Gamer", icon: <FaGamepad /> },
    { name: "Business Major", icon: <FaBriefcase /> },
    { name: "Data Science Major", icon: <FaLaptopCode /> },
    { name: "Hospitality Major", icon: <FaGlassCheers /> },
    { name: "Non Smoker", icon: <FaSmokingBan /> },
    { name: "Short Term", icon: <FaHourglassHalf /> },
    { name: "Long Term", icon: <FaInfinity /> },
  ];

  const pageTransition = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Create Roommate Profile
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
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-gray-700">Name</h2>
                    <span className="text-sm text-gray-500">
                      {form.name.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Budget</h2>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    placeholder="Budget (VND)"
                    value={form.budget}
                    onChange={(e) =>
                      handleChange("budget", formatBudget(e.target.value))
                    }
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Gender</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {["male", "female"].map((g) => (
                      <button
                        key={g}
                        className={`border rounded-lg py-2 ${
                          form.gender === g
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleChange("gender", g)}
                      >
                        {g === "male" ? "Male" : "Female"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">
                    Moving Alone or With Friends?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {["alone", "friends"].map((opt) => (
                      <button
                        key={opt}
                        className={`border rounded-lg py-2 ${
                          form.withFriends === opt
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleChange("withFriends", opt)}
                      >
                        {opt === "alone" ? "Alone" : "With Friends"}
                      </button>
                    ))}
                  </div>
                </div>

                {form.withFriends === "friends" && (
                  <div className="space-y-4 mt-4">
                    {form.friends.map((f, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-800">
                            Friend {i + 1}
                          </h3>
                          <button
                            className="text-red-500 text-sm hover:underline"
                            onClick={() => {
                              if (i === 0) {
                                setForm((prev) => ({
                                  ...prev,
                                  withFriends: "alone",
                                  friends: [{ name: "", gender: "" }],
                                }));
                              } else {
                                removeFriend(i);
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-200"
                          placeholder="Friend's name"
                          value={f.name}
                          onChange={(e) =>
                            handleFriendChange(i, "name", e.target.value)
                          }
                        />

                        <div className="grid grid-cols-2 gap-3">
                          {["male", "female"].map((g) => (
                            <button
                              key={g}
                              className={`border rounded-lg py-2 w-full transition ${
                                f.gender === g
                                  ? "bg-blue-100 border-blue-400 text-blue-800"
                                  : "bg-white hover:bg-gray-100 text-gray-700"
                              }`}
                              onClick={() => handleFriendChange(i, "gender", g)}
                              type="button"
                            >
                              {g === "male" ? "Male" : "Female"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addFriend}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      + Add another friend
                    </button>
                  </div>
                )}

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">
                    Preferred Location
                  </h2>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    placeholder="e.g., District 7, Saigon"
                    value={form.preferredLocation}
                    onChange={(e) =>
                      handleChange("preferredLocation", e.target.value)
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!validateStep1()}
                    className={`px-6 py-2 rounded-lg ${
                      validateStep1()
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Traits</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {traitIcons.map((item) => (
                      <button
                        key={item.name}
                        className={`flex items-center justify-center gap-2 border rounded-lg py-2 ${
                          form.traits.includes(item.name)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleTraitToggle(item.name)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-gray-700">About You</h2>
                    <span className="text-sm text-gray-500">
                      {form.about.length}/1200
                    </span>
                  </div>
                  <textarea
                    className="w-full border rounded-lg p-3 h-28"
                    placeholder="Describe yourself, lifestyle, habits, etc."
                    value={form.about}
                    onChange={(e) => handleChange("about", e.target.value)}
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">
                    Contact Info
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Zalo number"
                      className="border rounded-lg p-3"
                      value={form.zalo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, ""); // only digits
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Viber number"
                      className="border rounded-lg p-3"
                      value={form.viber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, ""); // only digits
                        handleChange("viber", value);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (validateStep2() && validateFacebook()) handleNext();
                    }}
                    disabled={!validateStep2()}
                    className={`px-6 py-2 rounded-lg ${
                      validateStep2()
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
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
                    disabled={!validateAll()}
                    className={`px-6 py-2 rounded-lg ${
                      validateAll()
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Upload Profile
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

export default UploadRoommateProfile;
