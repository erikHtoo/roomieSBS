// src/pages/Exchange.jsx
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar.jsx";
import { FiClock, FiCreditCard, FiX } from "react-icons/fi";
import kbzpay from "../images/kbzpay.png";
import ayapay from "../images/ayapay.png";
import zaloLogo from "../images/zalo.png";
import viberLogo from "../images/viber.png";
import zaloQR from "../images/zalo-qr.jpg";
import viberQR from "../images/viber-qr.jpg";
import facebookLogo from "../images/facebook.png";
import { handleEnterKey } from "../utils/handleEnter.js";
import { formatNumber, parseNumber } from "../utils/formatNumbers.js";

export default function Exchange() {
  const [rate, setRate] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [activeQR, setActiveQR] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/exchange`);
        const data = await response.json();
        if (data.rate) {
          setRate(data.rate);
          setLastUpdated(formatDateTime(data.last_update));
        }
      } catch (error) {
        console.error("Error fetching rate:", error);
      }
    };

    fetchRate();
  }, []);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const optionsDate = { day: "2-digit", month: "short" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };

    const formattedDate = date.toLocaleDateString("en-GB", optionsDate);
    const formattedTime = date.toLocaleTimeString("en-GB", optionsTime);

    return `${formattedDate}, ${formattedTime}`;
  };

  const handleCalculate = () => {
    if (amount) {
      const numericValue = parseNumber(amount);
      setResult(formatNumber((numericValue * rate).toFixed(2)));
    } else {
      setResult(null);
    }
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setActiveQR(null);
      }
    };

    if (activeQR) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeQR]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* 1️⃣ Conversion Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-800">
                MMK ⇄ VND Exchange
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-gray-700 shadow-sm">
                <p className="text-lg sm:text-xl font-semibold text-rose-600">
                  1 MMK = {rate.toFixed(2)} VND
                </p>
                <p className="flex flex-col items-center sm:items-center text-sm text-gray-600 mt-1 sm:mt-0 leading-tight">
                  <span className="text-gray-500 text-xs mb-0.5">
                    Latest Update:
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="text-rose-500" />
                    {lastUpdated || "Loading..."}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, "");
                    if (!isNaN(rawValue)) setAmount(formatNumber(rawValue));
                  }}
                  onKeyDown={(e) => handleEnterKey(e, handleCalculate)}
                  placeholder="Enter amount in MMK"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-rose-400 outline-none"
                />
                <button
                  onClick={handleCalculate}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition"
                >
                  Calculate
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-gray-200 h-full">
              <p className="text-gray-600 text-lg mb-2">You’ll receive:</p>
              <p className="text-3xl font-bold text-rose-600">
                {result !== null ? `${result} VND` : "--- VND"}
              </p>
            </div>
          </div>
        </section>

        {/* 3️⃣ Contact Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
            Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Facebook */}
            <a
              href="https://facebook.com/omnierikk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md"
            >
              <img
                src={facebookLogo}
                alt="Facebook"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                Facebook
              </span>
            </a>

            {/* Zalo */}
            <div
              onClick={() => setActiveQR("zalo")}
              className="cursor-pointer flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md"
            >
              <img
                src={zaloLogo}
                alt="Zalo"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                (+84) 816906081
              </span>
            </div>

            {/* Viber */}
            <div
              onClick={() => setActiveQR("viber")}
              className="cursor-pointer flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md"
            >
              <img
                src={viberLogo}
                alt="Viber"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                (+84) 816906081
              </span>
            </div>
          </div>
        </section>

        {/* 2️⃣ Payment Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Available Payments
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { src: kbzpay, name: "KBZPay" },
              { src: ayapay, name: "AyaPay" },
            ].map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md"
              >
                <img
                  src={p.src}
                  alt={p.name}
                  className="w-20 h-20 object-contain mb-3 rounded-lg"
                />
                <span className="font-medium text-gray-700 text-center">
                  {p.name}
                </span>
              </div>
            ))}

            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md">
              <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 border border-gray-200 mb-3">
                <FiCreditCard className="text-sky-600 text-3xl" />
              </div>
              <span className="font-medium text-gray-700 text-center">
                Vietnam Bank Transfers
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Shared QR Modal */}
      {activeQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-6 shadow-lg w-80 text-center relative"
          >
            <button
              onClick={() => setActiveQR(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiX size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {activeQR === "zalo" ? "Zalo QR" : "Viber QR"}
            </h3>
            <img
              src={activeQR === "zalo" ? zaloQR : viberQR}
              alt={`${activeQR} QR`}
              className="w-48 h-48 mx-auto rounded-lg border border-gray-200 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
