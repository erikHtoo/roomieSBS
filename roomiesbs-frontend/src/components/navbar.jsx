// src/components/Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiHome,
  FiMapPin,
  FiUsers,
  FiMenu,
  FiX,
  FiRepeat,
} from "react-icons/fi";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-extrabold text-2xl tracking-tight hover:opacity-90 transition"
        >
          <FiHome size={26} className="text-white" />
          RoomieSBS
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3">
          <Link
            to="/exchange"
            className="flex items-center gap-3 pt-2 px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10 transition"
          >
            MMK ⇄ VND
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold hover:bg-white/10 transition"
          >
            <FiUsers size={18} />
            Find Roommates
          </Link>

          <Link
            to="/rooms"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold hover:bg-white/10 transition"
          >
            <FiMapPin size={18} />
            Find Rooms
          </Link>

          <Link
            to="/profile"
            className="p-2 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm hover:shadow-md transition"
            title="Profile"
          >
            <FiUser size={22} className="text-rose-600" />
          </Link>
        </nav>

        {/* Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none"
          >
            {isOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-[60px] right-4">
          <div className="w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-lg py-2 border border-white/30">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-lg"
            >
              Profile
              <FiUser size={18} />
            </Link>

            <Link
              to="/exchange"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-lg"
            >
              MMK↔VND
              <FiRepeat size={18} />
            </Link>

            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-lg"
            >
              Find Roommates
              <FiUsers size={18} />
            </Link>

            <Link
              to="/rooms"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-lg"
            >
              Find Rooms
              <FiMapPin size={18} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
