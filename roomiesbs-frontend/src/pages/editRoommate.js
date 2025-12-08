import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
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

const EditRoommateProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    age: "",
    budget: "",
    deposit: "",
    gender: "",
    withFriends: "alone",
    friends: [{ name: "", age: "" }],
    preferredLocation: "",
    about: "",
    traits: [],
    zalo: "",
    facebook: "",
    viber: "",
    imageUrls: [],
  });

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

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

  const validateStep1 = () => {
    const required = ["name", "budget", "gender", "preferredLocation"];

    const baseValid = required.every(
      (f) =>
        form[f] !== undefined &&
        form[f] !== null &&
        String(form[f]).trim() !== ""
    );

    if (form.withFriends === "friends") {
      return (
        baseValid &&
        form.friends.length > 0 &&
        form.friends.every(
          (f) =>
            typeof f.name === "string" &&
            f.name.trim() !== "" &&
            (!f.age || String(f.age).trim() !== "")
        )
      );
    }

    return baseValid;
  };

  const validateStep2 = () => String(form.about || "").trim() !== "";

  const validateAll = () =>
    Array.isArray(form.imageUrls) && form.imageUrls.length > 0;

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // Fetch existing profile
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) {
          toast.error("You must be logged in to edit your profile.");
          navigate("/");
          return;
        }

        const res = await axios.get("http://localhost:5000/roommates", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const p = res.data.profile;
        if (!p) {
          toast.error("No roommate profile found.");
          navigate("/");
          return;
        }

        setForm({
          name: p.person_name || "",
          age: p.person_age || "",
          budget: p.person_budget || "",
          deposit: p.person_deposit || "",
          gender: p.person_gender ? "male" : "female",
          withFriends: p.person_friends ? "friends" : "alone",
          friends: (() => {
            const raw = p.person_friends;
            if (!raw) return [{ name: "", age: "" }];
            if (Array.isArray(raw))
              return raw.length ? raw : [{ name: "", age: "" }];
            if (typeof raw === "string") {
              // try parsing once or twice (handle double-encoded JSON)
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
              } catch {}

              try {
                const parsed2 = JSON.parse(JSON.parse(raw));
                if (Array.isArray(parsed2) && parsed2.length) return parsed2;
              } catch {}
            }
            return [{ name: "", age: "" }];
          })(),
          preferredLocation: p.person_preferred_location || "",
          about: p.person_about || "",
          traits: (() => {
            const raw = p.person_traits;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === "string") {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
              } catch {}

              try {
                const parsed2 = JSON.parse(JSON.parse(raw));
                if (Array.isArray(parsed2)) return parsed2;
              } catch {}

              const inner = raw.replace(/^\[|\]$/g, "").trim();
              if (!inner) return [];
              return inner
                .split(",")
                .map((s) => s.trim().replace(/^"+|"+$/g, ""))
                .filter(Boolean);
            }
            return [];
          })(),
          zalo: JSON.parse(p.person_contact || "{}")?.zalo || "",
          facebook: JSON.parse(p.person_contact || "{}")?.facebook || "",
          viber: JSON.parse(p.person_contact || "{}")?.viber || "",
          imageUrls: (() => {
            try {
              const urls = JSON.parse(p.person_image_urls || "[]");
              return Array.isArray(urls)
                ? urls.map((url) => ({ url, file: null }))
                : [];
            } catch {
              return [];
            }
          })(),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSubmit = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const userId = data?.session?.user?.id;
      if (!token || !userId) {
        toast.error("You must be logged in.");
        return;
      }

      const uploadedUrls = [];
      for (const img of form.imageUrls) {
        if (img.file) {
          const path = `${userId}/${Date.now()}-${slugify(img.file.name)}`;
          const { error: uploadError } = await supabase.storage
            .from("roommate-images")
            .upload(path, img.file);
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage
            .from("roommate-images")
            .getPublicUrl(path);
          uploadedUrls.push(pub.publicUrl);
        } else {
          uploadedUrls.push(img.url);
        }
      }

      const payload = {
        person_image_urls: uploadedUrls,
        person_name: form.name,
        person_age: form.age,
        person_gender: form.gender === "male",
        person_budget: form.budget,
        person_deposit: form.deposit,
        person_preferred_location: form.preferredLocation,
        person_about: form.about,
        person_contact: {
          zalo: form.zalo,
          facebook: form.facebook,
          viber: form.viber,
        },
        person_friends: form.withFriends === "friends" ? form.friends : null,
        person_traits: form.traits.length > 0 ? form.traits : null,
      };

      const res = await axios.put("http://localhost:5000/roommates", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.data.success) {
        toast.error("Failed to update profile.");
        return;
      }

      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Update failed.");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...newFiles],
    }));
  };

  const removeImage = (i) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== i),
    }));
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Edit Roommate Profile
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
                  <h2 className="font-medium text-gray-700 mb-2">Name</h2>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <h2 className="font-medium text-gray-700 mb-2">Budget</h2>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-3"
                    value={form.budget}
                    onChange={(e) => handleChange("budget", e.target.value)}
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
                    Living Preference
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
                      <div key={i} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-700">
                            Friend {i + 1}
                          </h3>
                          {i > 0 && (
                            <button
                              className="text-red-500 text-sm"
                              onClick={() => removeFriend(i)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-3 mb-3"
                          placeholder="Name"
                          value={f.name}
                          onChange={(e) =>
                            handleFriendChange(i, "name", e.target.value)
                          }
                        />
                        <input
                          type="number"
                          className="w-full border rounded-lg p-3"
                          placeholder="Age"
                          value={f.age}
                          onChange={(e) =>
                            handleFriendChange(i, "age", e.target.value)
                          }
                        />
                      </div>
                    ))}
                    <button
                      onClick={addFriend}
                      className="text-blue-500 text-sm font-medium"
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
                  <h2 className="font-medium text-gray-700 mb-2">About You</h2>
                  <textarea
                    className="w-full border rounded-lg p-3 h-28"
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
                      placeholder="Zalo"
                      className="border rounded-lg p-3"
                      value={form.zalo}
                      onChange={(e) => handleChange("zalo", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Facebook"
                      className="border rounded-lg p-3"
                      value={form.facebook}
                      onChange={(e) => handleChange("facebook", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Viber"
                      className="border rounded-lg p-3"
                      value={form.viber}
                      onChange={(e) => handleChange("viber", e.target.value)}
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
                    onClick={handleNext}
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
                <h2 className="font-medium text-gray-700 mb-2">
                  Update Images
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.imageUrls.map((img, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden border bg-gray-100 h-32"
                    >
                      <img
                        src={img.url}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6"
                        onClick={() => removeImage(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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

                <input
                  id="imageUpload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
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

export default EditRoommateProfile;
