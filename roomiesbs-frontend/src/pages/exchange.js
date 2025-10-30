// src/pages/Exchange.jsx
import { useState, useEffect } from "react";
import Navbar from "../components/navbar.jsx";
import { FiClock, FiCreditCard } from "react-icons/fi";
import kbzpay from "../images/kbzpay.png";
import ayapay from "../images/ayapay.png";

export default function Exchange() {
  const [rate, setRate] = useState(6.37);
  const [lastUpdated, setLastUpdated] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchRate = () => {
      const mmk_usdt = 4000;
      const vnd_usdt = 25500;
      const newRate = vnd_usdt / mmk_usdt;
      setRate(newRate);
      setLastUpdated(new Date().toLocaleString());
    };
    fetchRate();
  }, []);

  const handleCalculate = () => {
    if (amount && !isNaN(amount)) {
      setResult((amount * rate).toFixed(2));
    } else {
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* 1️⃣ Conversion Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Left side */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                MMK ⇄ VND Exchange
              </h2>

              <div className="flex items-center justify-between text-gray-600 text-sm">
                <p>
                  <strong>Rate:</strong>{" "}
                  <span className="text-rose-600 font-semibold">
                    1 MMK = {rate.toFixed(2)} VND
                  </span>
                </p>
                <p className="flex items-center gap-1">
                  <FiClock className="text-gray-500" />
                  {lastUpdated || "Loading..."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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

            {/* Right side */}
            <div className="flex flex-col items-center justify-center border-l border-gray-200 h-full">
              <p className="text-gray-600 text-lg mb-2">You’ll receive:</p>
              <p className="text-3xl font-bold text-rose-600">
                {result !== null ? `${result} VND` : "--- VND"}
              </p>
            </div>
          </div>
        </section>

        {/* 2️⃣ Available Payment Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Available Payments
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* KBZPay */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition">
              <img
                src={kbzpay}
                alt="KBZPay"
                className="w-20 h-20 object-contain mb-3"
              />
              <span className="font-medium text-gray-700 text-center">
                KBZPay
              </span>
            </div>

            {/* AyaPay */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition">
              <img
                src={ayapay}
                alt="AyaPay"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                AyaPay
              </span>
            </div>

            {/* Vietnam Banking */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition">
              <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 border border-gray-200 mb-3">
                <FiCreditCard className="text-sky-600 text-3xl" />
              </div>
              <span className="font-medium text-gray-700 text-center">
                Vietnam Bank Transfers
              </span>
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
              href="https://facebook.com/YourPagePlaceholder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 transition hover:shadow-md"
            >
              <img
                src={require("../images/facebook.png")}
                alt="Facebook"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                Facebook
              </span>
            </a>

            {/* Zalo */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <img
                src={require("../images/zalo.png")}
                alt="Zalo"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                Zalo: +84 816906081
              </span>
            </div>

            {/* Viber */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <img
                src={require("../images/viber.png")}
                alt="Viber"
                className="w-20 h-20 object-contain mb-3 rounded-lg"
              />
              <span className="font-medium text-gray-700 text-center">
                Viber: +959xxxxxxxx
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
