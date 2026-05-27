// src/pages/Exchange.jsx
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar.jsx";
import { FiCreditCard, FiX } from "react-icons/fi";
import kbzpay from "../images/kbzpay.png";
import ayapay from "../images/ayapay.png";
import zaloLogo from "../images/zalo.png";
import viberLogo from "../images/viber.png";
import zaloQR from "../images/zalo-qr.jpg";
import viberQR from "../images/viber-qr.jpg";
import facebookLogo from "../images/facebook.png";

export default function Exchange() {
  const [activeQR, setActiveQR] = useState(null);
  const modalRef = useRef(null);

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

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-10 space-y-12">
        {/* Exchange Contact Notice */}
        <div className="max-w-5xl mx-auto pl-0 pr-6">
          <h2 className="text-left text-2xl font-bold text-gray-800">
            MMK to VND Exchange
          </h2>
        </div>

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
