import React, { useEffect, useState } from "react";
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

const parseImageUrls = (value) => {
  if (!value) return [];

  let parsed = value;
  if (typeof parsed === "string") {
    for (let i = 0; i < 3; i++) {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
  }

  const urls = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "string"
      ? [parsed]
      : [];

  return urls
    .map((url, index) => {
      if (!url) return null;
      if (typeof url === "string") {
        return {
          id: `${url}-${index}`,
          file: null,
          preview: url,
        };
      }

      const preview = url.preview || url.url;
      if (!preview) return null;

      return {
        id: url.id || `${preview}-${index}`,
        file: url.file || null,
        preview,
      };
    })
    .filter(Boolean);
};

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

  const validateStep1 = () => {
    const required = ["name", "budget", "gender", "preferredLocation"];

    const baseValid = required.every(
      (f) =>
        form[f] !== undefined &&
        form[f] !== null &&
        String(form[f]).trim() !== "",
    );

    if (form.withFriends === "friends") {
      return (
        baseValid &&
        form.friends.length > 0 &&
        form.friends.every(
          (f) =>
            typeof f.name === "string" &&
            f.name.trim() !== "" &&
            (!f.age || String(f.age).trim() !== ""),
        )
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

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/roommates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

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
          imageUrls: parseImageUrls(p.person_image_urls),
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
      for (let i = 0; i < form.imageUrls.length; i++) {
        const img = form.imageUrls[i];
        if (img.file) {
          const path = `${userId}/${Date.now()}-${i}-${slugify(img.file.name)}`;
          const { error: uploadError } = await supabase.storage
            .from("roommate-images")
            .upload(path, img.file);
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage
            .from("roommate-images")
            .getPublicUrl(path);
          uploadedUrls.push(pub.publicUrl);
        } else if (img.preview || img.url) {
          uploadedUrls.push(img.preview || img.url);
        }
      }

      // Build payload - only send fields with valid values
      const budgetValue = form.budget
        ? typeof form.budget === "string"
          ? parseFloat(form.budget.replace(/,/g, ""))
          : form.budget
        : undefined;

      // Only include contact if at least one method is provided
      const contactObj = {};
      if (form.zalo && form.zalo.trim())
        contactObj.zalo = DOMPurify.sanitize(form.zalo);
      if (form.facebook && form.facebook.trim())
        contactObj.facebook = DOMPurify.sanitize(form.facebook);
      if (form.viber && form.viber.trim())
        contactObj.viber = DOMPurify.sanitize(form.viber);

      const payload = {
        person_image_urls: uploadedUrls,
        person_name: DOMPurify.sanitize(form.name),
        person_gender: form.gender === "male",
        person_preferred_location: DOMPurify.sanitize(form.preferredLocation),
        person_about: DOMPurify.sanitize(form.about),
      };

      // Only add contact if we have at least one method
      if (Object.keys(contactObj).length > 0) {
        payload.person_contact = contactObj;
      }

      // Only add budget if it has a value
      if (budgetValue !== undefined) {
        payload.person_budget = budgetValue;
      }

      // Only add friends if "with friends" mode
      if (form.withFriends === "friends") {
        payload.person_friends = form.friends.map((f) => ({
          ...f,
          name: DOMPurify.sanitize(f.name),
        }));
      }
      // If alone, don't include person_friends in payload at all

      // Only add traits if any selected
      if (form.traits.length > 0) {
        payload.person_traits = form.traits;
      }
      // If no traits, don't include person_traits in payload at all

      const res = await axios.put(
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
        toast.error("Failed to update profile.");
        return;
      }

      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        "Update failed. Please check your inputs.";
      toast.error(errorMsg);
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
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-gray-700">Name</h2>
                    <span className="text-sm text-gray-500">
                      {form.name.length}/100
                    </span>
                  </div>
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
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-gray-700">About You</h2>
                    <span className="text-sm text-gray-500">
                      {form.about.length}/1200
                    </span>
                  </div>
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
