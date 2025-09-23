// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { FiUser, FiHome, FiMapPin, FiUsers } from "react-icons/fi";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-extrabold text-2xl tracking-tight hover:opacity-90 transition"
        >
          <FiHome size={26} className="text-white" />
          RoomieSBS
        </Link>

        {/* Nav Buttons */}
        <nav className="flex items-center gap-3">
          {/* Find Roommates */}
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold hover:bg-white/10 transition"
          >
            <FiUsers size={18} />
            Find Roommates
          </Link>

          {/* Find Rooms */}
          <Link
            to="/rooms"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold hover:bg-white/10 transition"
          >
            <FiMapPin size={18} />
            Find Rooms
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className="p-2 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm hover:shadow-md transition"
            title="Profile"
          >
            <FiUser size={22} className="text-rose-600" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
