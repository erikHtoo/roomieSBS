import { useState, useEffect } from "react";

export default function NumberInput({ value, onChange, placeholder }) {
  const [display, setDisplay] = useState(formatNumber(value));

  function formatNumber(num) {
    if (num == null || num === "") return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function parseNumber(str) {
    return str.replace(/,/g, "");
  }

  useEffect(() => {
    setDisplay(formatNumber(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = parseNumber(e.target.value);
    if (/^\d*$/.test(raw)) {
      onChange(raw);
      setDisplay(formatNumber(raw));
    }
  };

  return (
    <input
      type="text"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        outline: "none",
        textAlign: "right", // right-aligned for easier comma visibility
      }}
    />
  );
}
