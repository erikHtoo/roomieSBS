import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient.js";
import { useAuth } from "./auth/useAuth";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

const MAX_FILES = 12;
const MAX_MB = 8; // per file
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export default function EditRoom() {
const navigate = useNavigate();
const { id: roomId } = useParams();
const fileInputRef = useRef(null);

// Form fields
const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [priceText, setPriceText] = useState("");
const [address, setAddress] = useState("");
const [contactInfo, setContactInfo] = useState("");
const [preferredGender, setPreferredGender] = useState("true");
const [deposit, setDeposit] = useState("");
const [about, setAbout] = useState("");

// Images state
// existingImages: array of string URLs already saved for this room
// newImages: array of { file: File, preview: objectURL } added during this edit
const [existingImages, setExistingImages] = useState([]);
const [newImages, setNewImages] = useState([]);

// UX
const [submitting, setSubmitting] = useState(false);
const [errors, setErrors] = useState([]);
const [message, setMessage] = useState("");
const [fetchError, setFetchError] = useState(null);

// Auth (owner_id + JWT)
const { user, session } = useAuth?.() || { user: null, session: null };
const ownerId = useMemo(() => user?.id, [user]);
console.log("EditRoom for user:", ownerId, "room:", roomId);
// Fetch existing room on mount/roomId change
useEffect(() => {
const load = async () => {
    setErrors([]);
    setMessage("");
    try {

    const res = await axios.get(`http://localhost:5000/edit/${roomId}`, {
        headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
        timeout: 20000,
    });
    const room = res.data?.room;
    if (!room) throw new Error("Room not found");

    setName(room.room_name ?? "");
    setDescription(room.description ?? "");
    setPriceText(room.price ?? "");
    setAddress(room.address ?? "");
    setContactInfo(room.contact ?? "");
    setPreferredGender(room.preferred_gender ? "true" : "false");
    setDeposit(room.deposit ?? "");
    setAbout(room.about ?? "");
    setExistingImages(
    Array.isArray(room.image_urls)
    ? room.image_urls
    : JSON.parse(room.image_urls || "[]")
    );
    setNewImages([]); // clear any new images if reloading
    } catch (err) {
      console.error("Error fetching room:", err);
      setFetchError("Room not found or invalid ID");
    }
  };

if (roomId) load();
}, [roomId, session]);

// Clean up object URLs for newImages
useEffect(() => {
return () => {
    newImages.forEach((img) => img?.preview && URL.revokeObjectURL(img.preview));
};
}, [newImages]);

// Helpers
const openFilePicker = () => fileInputRef.current?.click();

const validateFile = (file) => {
const problems = [];
if (!ACCEPT.includes(file.type)) problems.push("Only PNG/JPG/WebP allowed.");
if (file.size > MAX_MB * 1024 * 1024) problems.push(`Max ${MAX_MB}MB per file.`);
return problems;
};

const addFiles = (fileList) => {
const next = [...newImages];
const newErrors = [];
for (const file of fileList) {
    if (existingImages.length + next.length >= MAX_FILES) {
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
setNewImages(next);
if (newErrors.length) setErrors(newErrors);
};

const onFileInputChange = (e) => {
if (e.target.files?.length) {
    addFiles(e.target.files);
    e.target.value = ""; // allow selecting same file again
}
};

const removeExistingImage = (url) => {
setExistingImages((prev) => prev.filter((u) => u !== url));
};

const removeNewImageAt = (idx) => {
const next = [...newImages];
const [removed] = next.splice(idx, 1);
if (removed?.preview) URL.revokeObjectURL(removed.preview);
setNewImages(next);
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
    // 1) Upload any new images the user added in this edit session
    const uploadedUrls = [];
    for (let i = 0; i < newImages.length; i++) {
    const f = newImages[i].file;
    const path = `${ownerId}/${Date.now()}-${i}-${slugify(f.name)}`;
    const { error: uploadError } = await supabase.storage
        .from("room-images")
        .upload(path, f, {
        cacheControl: "3600",
        upsert: false,
        });
    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from("room-images").getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error("Failed to get public URL");
    uploadedUrls.push(pub.publicUrl);
    }

    // 2) Build final image_urls (keep remaining existing + newly uploaded)
    const finalUrls = [...existingImages, ...uploadedUrls];

    // 3) PUT to backend to update room
    await axios.put(
    `http://localhost:5000/edit/${roomId}`,
    {
        room_name: name,
        description,
        price: priceText,
        image_urls: finalUrls,
        address,
        contact: contactInfo,
        owner_id: ownerId,
        preferred_gender: preferredGender === "true",
        deposit,
        about,
    },
    {
        headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
        timeout: 20000,
    }
    );

    setMessage("Room updated successfully!");
    // revoke previews and clear new images after success
    newImages.forEach((img) => img?.preview && URL.revokeObjectURL(img.preview));
    setNewImages([]);
} catch (err) {
    console.error(err);
    setErrors([err?.response?.data?.error || err?.message || "Update failed"]);
} finally {
    setSubmitting(false);
}
};

const handleDelete = async () => {
setErrors([]);
setMessage("");
const ok = window.confirm("Delete this listing permanently?");
if (!ok) return;
setSubmitting(true);
try {
    await axios.delete(`http://localhost:5000/edit/${roomId}`, {
    headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    timeout: 20000,
    });
    setMessage("Listing deleted.");
    // clear the form after delete
    setName("");
    setDescription("");
    setPriceText("");
    setAddress("");
    setContactInfo("");
    setPreferredGender("true");
    setDeposit("");
    setAbout("");
    setExistingImages([]);
    newImages.forEach((img) => img?.preview && URL.revokeObjectURL(img.preview));
    setNewImages([]);

    navigate("/");

} catch (err) {
    console.error(err);
    setErrors([err?.response?.data?.error || err?.message || "Delete failed"]);
} finally {
    setSubmitting(false);
}
};

if (fetchError) return <div>{fetchError}</div>;

return (
<div className="min-h-screen bg-gray-100">
<Navbar />
<div style={styles.wrap}>
    <h2 style={styles.h2}>Edit a Room</h2>

    <form onSubmit={handleSubmit} style={styles.form}>
    <label style={styles.label}>Listing Name</label>
    <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={styles.input}
        placeholder="e.g. Zen building, Tulip Tower, Cozy room"
    />

    <label style={styles.label}>About Room</label>
    <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={styles.textarea}
        placeholder="About the room..."
    />

    {/* About Yourself */}
    <label style={styles.label}>About Roomies</label>
    <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        style={styles.textarea}
        placeholder="About the people living there..."
    />

    <label style={styles.label}>Price</label>
    <input
    type="text"
    value={priceText}
    onChange={(e) => setPriceText(e.target.value)}
    required
    style={styles.input}
    placeholder="3,000,000 / 3M"
    />

    {/* Deposit */}
    <label style={styles.label}>Deposit</label>
    <input
    type="text"
    value={deposit}
    onChange={(e) => setDeposit(e.target.value)}
    style={styles.input}
    placeholder="3,000,000 / 3M"
    />

    {/* Preferred Gender */}
    <label style={styles.label}>Preferred Gender</label>
    <select
        value={preferredGender}
        onChange={(e) => setPreferredGender(e.target.value)}
        style={styles.input}
    >
        <option value="true">Male</option>
        <option value="false">Female</option>
    </select>

    <label style={styles.label}>Images</label>
    <div style={styles.grid}>
        {existingImages.map((url, idx) => (
        <div key={`existing-${idx}`} style={styles.thumb}>
            <img src={url} alt={`room-${idx}`} style={styles.thumbImg} />
            <button
            type="button"
            onClick={() => removeExistingImage(url)}
            style={styles.removeBtn}
            title="Remove"
            >
            ×
            </button>
        </div>
        ))}

        {newImages.map((img, idx) => (
        <div key={`new-${idx}`} style={styles.thumb}>
            <img src={img.preview} alt={`new-${idx}`} style={styles.thumbImg} />
            <button
            type="button"
            onClick={() => removeNewImageAt(idx)}
            style={styles.removeBtn}
            title="Remove"
            >
            ×
            </button>
        </div>
        ))}

        {existingImages.length + newImages.length < MAX_FILES && (
        <button
            type="button"
            onClick={openFilePicker}
            style={styles.addTile}
            title="Add photo"
        >
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

    <div style={styles.row}>
        <div style={styles.col}>
            <label style={styles.label}>Address</label>
            <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={styles.input}
            placeholder="Enter google maps link for convenience (Optional)"
            />
        </div>
    </div>

    <label style={styles.label}>Contact info</label>
    <textarea
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
        required
        style={styles.textarea}
        placeholder="Phone, Zalo, email…"
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
        {submitting ? "Updating…" : "Save Changes"}
    </button>

    <button
        type="button"
        onClick={handleDelete}
        style={styles.delete}
        disabled={submitting}
    >
        Delete Listing
    </button>
    </form>

    <p style={styles.hint}>
    Tip: You can add up to {MAX_FILES} photos. Allowed: PNG/JPG/WebP, up to {MAX_MB}MB each.
    </p>

</div>
</div>
);
}

// ------- inline styles (same baseline as UploadRoom.js) -------
const styles = {
wrap: { maxWidth: 760, margin: "32px auto", padding: "0 16px" },
h2: { marginBottom: 16 },
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
row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
col: {},
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
delete: {
marginTop: 10,
width: "100%",
padding: "12px 14px",
borderRadius: 8,
border: "none",
background: "#ef4444",
color: "#fff",
fontWeight: 600,
cursor: "pointer",
},
hint: { color: "#666", fontSize: 13, marginTop: 10 },
};
