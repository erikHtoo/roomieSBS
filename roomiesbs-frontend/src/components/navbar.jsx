// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { FiUser, FiHome, FiPlusCircle } from "react-icons/fi";

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
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-rose-600 font-semibold shadow-sm hover:shadow-md hover:bg-rose-50 transition"
          >
            <FiPlusCircle size={18} />
            Upload
          </Link>
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
