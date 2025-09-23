import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient.js";
import { useAuth } from "../auth/useAuth.js";
import Navbar from "../components/navbar.jsx";

const MAX_FILES = 5;
const MAX_MB = 5; // profile photos
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export default function UploadRoommateProfile() {
  const fileInputRef = useRef(null);

  // Form fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState("true");
  const [budget, setBudget] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [about, setAbout] = useState("");
  const [contact, setContact] = useState("");

  // Images state
  const [images, setImages] = useState([]);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");

  // Auth (owner_id = user.id)
  const { user, session } = useAuth?.() || { user: null, session: null };
  const ownerId = useMemo(() => user?.id, [user]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  // Helpers
  const openFilePicker = () => fileInputRef.current?.click();

  const validateFile = (file) => {
    const problems = [];
    if (!ACCEPT.includes(file.type)) problems.push("Only PNG/JPG/WebP allowed.");
    if (file.size > MAX_MB * 1024 * 1024) problems.push(`Max ${MAX_MB}MB per file.`);
    return problems;
  };

  const addFiles = (fileList) => {
    const next = [...images];
    const newErrors = [];
    for (const file of fileList) {
      if (next.length >= MAX_FILES) {
        newErrors.push(`Max ${MAX_FILES} images.`);
        break;
      }
      const probs = validateFile(file);
      if (probs.length) {
        newErrors.push(`${file.name}: ${probs.join(" ")}`);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages(next);
    if (newErrors.length) setErrors(newErrors);
  };

  const onFileInputChange = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeImageAt = (idx) => {
    const next = [...images];
    const [removed] = next.splice(idx, 1);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setImages(next);
  };

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessage("");
    setSubmitting(true);

    try {
      const image_urls = [];

      for (let i = 0; i < images.length; i++) {
        const f = images[i].file;

        // Path convention: <ownerId>/<timestamp>-<index>-<sluggedName>
        const path = `${ownerId}/${Date.now()}-${i}-${slugify(f.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("roommate-images")
          .upload(path, f, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from("roommate-images").getPublicUrl(path);
        if (!pub?.publicUrl) throw new Error("Failed to get public URL");
        image_urls.push(pub.publicUrl);
      }

      // insert to backend
      await axios.post(
        "http://localhost:5000/roommates",
        {
          id: ownerId,
          person_image_urls: image_urls,
          person_name: name,
          person_gender: gender === "true",
          person_budget: budget,
          person_preferred_location: preferredLocation,
          person_about: about,
          person_contact: contact,
        },
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
          timeout: 20000,
        }
      );

      setMessage("Profile uploaded successfully!");
      setName("");
      setGender("true");
      setBudget("");
      setPreferredLocation("");
      setAbout("");
      setContact("");
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
    } catch (err) {
      console.error(err);
      setErrors([err?.message || "Upload failed"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div style={styles.wrap}>
        <form onSubmit={handleSubmit} style={styles.form}>
        
          <label style={styles.label}>Profile Picture (Optional)</label>
          <div style={styles.grid}>
            {images.map((img, idx) => (
              <div key={idx} style={styles.thumb}>
                <img src={img.preview} alt={`profile-${idx}`} style={styles.thumbImg} />
                <button
                  type="button"
                  onClick={() => removeImageAt(idx)}
                  style={styles.removeBtn}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_FILES && (
              <button type="button" onClick={openFilePicker} style={styles.addTile}>
                +
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT.join(",")}
            onChange={onFileInputChange}
            style={{ display: "none" }}
          />

          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            placeholder="Full Name"
          />

          <label style={styles.label}>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={styles.input}
          >
            <option value="true">Male</option>
            <option value="false">Female</option>
          </select>

          <label style={styles.label}>Budget</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            style={styles.input}
            placeholder="Max Budget Per Month (e.g. 5,000,000)"
          />

          <label style={styles.label}>Preferred Location</label>
          <input
            type="text"
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            required
            style={styles.input}
            placeholder="near SBS, near Crescent Mall, etc."
          />

          <label style={styles.label}>About Yourself</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            required
            style={styles.textarea}
            placeholder="Tell others about you, your lifestyle, expectations..."
          />

          <label style={styles.label}>Contact</label>
          <textarea
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            style={styles.textarea}
            placeholder="zalo, facebook, email, etc..."
          />

          {errors.length > 0 && (
            <div style={styles.errorBox}>
              {errors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}
          {message && <div style={styles.success}>{message}</div>}

          <button type="submit" style={styles.submit} disabled={submitting}>
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 760, margin: "32px auto", padding: "0 16px" },
  form: {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  label: { display: "block", fontWeight: 600, margin: "12px 0 8px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 96,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
    resize: "vertical",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 10,
  },
  thumb: {
    position: "relative",
    width: "100%",
    paddingTop: "100%",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #eee",
    background: "#fafafa",
  },
  thumbImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "#000",
    color: "#fff",
    cursor: "pointer",
  },
  addTile: {
    width: 100,
    height: 100,
    border: "2px dashed #ccc",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    color: "#888",
    cursor: "pointer",
    background: "#f9f9f9",
  },
  errorBox: {
    background: "#ffe9e9",
    color: "#a40000",
    padding: "8px 10px",
    borderRadius: 8,
    marginTop: 10,
  },
  success: {
    background: "#eaffea",
    color: "#126b12",
    padding: "8px 10px",
    borderRadius: 8,
    marginTop: 10,
  },
  submit: {
    marginTop: 14,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};
