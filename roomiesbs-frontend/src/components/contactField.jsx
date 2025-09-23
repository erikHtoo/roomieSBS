import { useState, useEffect } from "react";

export default function ContactField({ value = {}, onChange }) {
  const [facebook, setFacebook] = useState(value.facebook || "");
  const [zalo, setZalo] = useState(value.zalo || "");
  const [viber, setViber] = useState(value.viber || "");
  const [errors, setErrors] = useState({});

  // Sync internal state when prop changes
  useEffect(() => {
    setFacebook(value.facebook || "");
    setZalo(value.zalo || "");
    setViber(value.viber || "");
  }, [value]);

  // Validate inputs
  const validate = () => {
    const errs = {};
    if (facebook && !isValidURL(facebook)) errs.facebook = "Invalid URL";
    if (zalo && !isValidPhone(zalo)) errs.zalo = "Invalid number";
    if (viber && !isValidPhone(viber)) errs.viber = "Invalid number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    onChange?.({ facebook, zalo, viber });
  }, [facebook, zalo, viber]);

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhone = (num) => /^[+0-9]{6,15}$/.test(num);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>Facebook (profile link)</label>
      <input
        type="url"
        placeholder="Facebook link"
        value={facebook}
        onChange={(e) => setFacebook(e.target.value)}
        style={styles.input}
      />
      {errors.facebook && <span style={styles.error}>{errors.facebook}</span>}

      <label style={{ fontWeight: 600 }}>Zalo</label>
      <input
        type="text"
        placeholder="Zalo number"
        value={zalo}
        onChange={(e) => setZalo(e.target.value)}
        style={styles.input}
      />
      {errors.zalo && <span style={styles.error}>{errors.zalo}</span>}

      <label style={{ fontWeight: 600 }}>Viber</label>
      <input
        type="text"
        placeholder="Viber number"
        value={viber}
        onChange={(e) => setViber(e.target.value)}
        style={styles.input}
      />
      {errors.viber && <span style={styles.error}>{errors.viber}</span>}
    </div>
  );
}

const styles = {
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },
  error: {
    color: "#a40000",
    fontSize: 12,
  },
};
