import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient.js";
import { useAuth } from "../auth/useAuth.js";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import ContactField from "../components/contactField.jsx";
import NumberInput from "../components/numberInput.jsx";

const MAX_FILES = 12;
const MAX_MB = 8;
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export default function EditRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [deposit, setDeposit] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState({});
  const [transferContract, setTransferContract] = useState(false);
  const [remainingContract, setRemainingContract] = useState("");
  const [otherContractMonths, setOtherContractMonths] = useState("");

  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [fetchError, setFetchError] = useState(null);

  const { user, session } = useAuth?.() || { user: null, session: null };
  const ownerId = useMemo(() => user?.id, [user]);

  // --- Helpers for numbers ---
  const formatNumber = (num) => (!num ? "" : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    if (/^\d*$/.test(raw)) setPriceText(raw);
  };
  const handleDepositChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    if (/^\d*$/.test(raw)) setDeposit(raw);
  };

  const slugify = (s) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_.]/g, "");

  // --- Fetch room data ---
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/rooms/edit/${roomId}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          timeout: 20000,
        });
        const room = res.data?.room;
        if (!room) throw new Error("Room not found");

        setName(room.room_name ?? "");
        setDescription(room.description ?? "");
        setPriceText(room.price ?? "");
        setDeposit(room.deposit ?? "");
        setAddress(room.address ?? "");

        const roomContact = room.contact || {};
        setContact({
            facebook: roomContact.facebook || "",
            zalo: roomContact.zalo || "",
            viber: roomContact.viber || ""
        });
        setTransferContract(!!room.transfer_contract);
        setRemainingContract(room.remaining_contract ?? "");
        setOtherContractMonths(room.remaining_contract_other ?? "");
        setExistingImages(Array.isArray(room.image_urls) ? room.image_urls : JSON.parse(room.image_urls || "[]"));
      } catch (err) {
        console.error(err);
        setFetchError("Room not found or invalid ID");
      }
    };
    if (roomId) load();
  }, [roomId, session]);

  // --- Image handling ---
  useEffect(() => {
    return () => {
      newImages.forEach((img) => img?.preview && URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

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
      e.target.value = "";
    }
  };

  const removeExistingImage = (url) => setExistingImages((prev) => prev.filter((u) => u !== url));
  const removeNewImageAt = (idx) => {
    const next = [...newImages];
    const [removed] = next.splice(idx, 1);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setNewImages(next);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessage("");
    setSubmitting(true);

    try {
      const uploadedUrls = [];
      for (let i = 0; i < newImages.length; i++) {
        const f = newImages[i].file;
        const path = `${ownerId}/${Date.now()}-${i}-${slugify(f.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("room-images")
          .upload(path, f, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from("room-images").getPublicUrl(path);
        if (!pub?.publicUrl) throw new Error("Failed to get public URL");
        uploadedUrls.push(pub.publicUrl);
      }

      const finalUrls = [...existingImages, ...uploadedUrls];

      await axios.put(
        `http://localhost:5000/rooms/${roomId}`,
        {
          room_name: name,
          description,
          price: priceText,
          deposit,
          address,
          contact: JSON.stringify(contact),
          owner_id: ownerId,
          transfer_contract: transferContract,
          remaining_contract: transferContract
            ? remainingContract === "other"
              ? otherContractMonths
              : remainingContract
            : null,
          image_urls: finalUrls,
        },
        {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          timeout: 20000,
        }
      );

      setMessage("Room updated successfully!");
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
    if (!window.confirm("Delete this listing permanently?")) return;
    setErrors([]);
    setMessage("");
    setSubmitting(true);
    try {
      await axios.delete(`http://localhost:5000/rooms/${roomId}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        timeout: 20000,
      });
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
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Room Photos */}
          <label style={styles.label}>Room Photos</label>
          <div style={styles.grid}>
            {existingImages.map((url, idx) => (
              <div key={`existing-${idx}`} style={styles.thumb}>
                <img src={url} alt={`room-${idx}`} style={styles.thumbImg} />
                <button type="button" onClick={() => removeExistingImage(url)} style={styles.removeBtn}>×</button>
              </div>
            ))}
            {newImages.map((img, idx) => (
              <div key={`new-${idx}`} style={styles.thumb}>
                <img src={img.preview} alt={`new-${idx}`} style={styles.thumbImg} />
                <button type="button" onClick={() => removeNewImageAt(idx)} style={styles.removeBtn}>×</button>
              </div>
            ))}
            {existingImages.length + newImages.length < MAX_FILES && (
              <button type="button" onClick={openFilePicker} style={styles.addTile}>+</button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPT.join(",")} onChange={onFileInputChange} style={{ display: "none" }} />

          {/* Description */}
          <label style={styles.label}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={styles.textarea} placeholder="About the room..." />

          {/* Rent & Deposit */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div>
              <label style={styles.label}>Rent per Month</label>
              <NumberInput
                value={priceText}
                onChange={setPriceText}
                placeholder="5,200,000 VND / month"
              />
            </div>

            <div>
              <label style={styles.label}>Deposit</label>
              <NumberInput
                value={deposit}
                onChange={setDeposit}
                placeholder="5,200,000 VND"
              />
            </div>
          </div>

          {/* Address */}
          <label style={styles.label}>Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required style={styles.input} placeholder="Google Maps link or full address" />

          {/* Contact */}
          <label style={styles.label}></label>
          <ContactField value={contact} onChange={setContact} />

          {/* Transfer Contract */}
          <label style={styles.label}>Transfer Contract?</label>
          <select value={transferContract ? "yes" : "no"} onChange={(e) => setTransferContract(e.target.value === "yes")} style={styles.input}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          {transferContract && (
            <>
              <label style={styles.label}>Remaining Contract</label>
              <select value={remainingContract} onChange={(e) => setRemainingContract(e.target.value)} style={styles.input}>
                <option value="">Select remaining contract</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="4 months">4 months</option>
                <option value="5 months">5 months</option>
                <option value="6 months">6 months</option>
                <option value="other">Other</option>
              </select>
              {remainingContract === "other" && (
                <input type="number" min={1} value={otherContractMonths || ""} onChange={(e) => setOtherContractMonths(e.target.value)} placeholder="Enter months" style={{ ...styles.input, marginTop: 8 }} />
              )}
            </>
          )}

          {errors.length > 0 && (
            <div style={styles.errorBox}>{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>
          )}
          {message && <div style={styles.success}>{message}</div>}

          <button type="submit" style={styles.submit} disabled={submitting}>{submitting ? "Updating…" : "Save Changes"}</button>
          <button type="button" onClick={handleDelete} style={styles.delete} disabled={submitting}>Delete Listing</button>
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
  thumbImg: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
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
  errorBox: { background: "#ffe9e9", color: "#a40000", padding: "8px 10px", borderRadius: 8, marginTop: 10 },
  success: { background: "#eaffea", color: "#126b12", padding: "8px 10px", borderRadius: 8, marginTop: 10 },
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
};
