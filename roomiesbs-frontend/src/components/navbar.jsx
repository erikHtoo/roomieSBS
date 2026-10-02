import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiUser, FiMapPin, FiUsers, FiMenu, FiX, FiRepeat, FiLogIn } from "react-icons/fi";
import { useAuth } from "../auth/useAuth";

const navItem = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-slate-100 text-slate-950"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
  }`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const links = [
    { to: "/", label: "Roommates", icon: FiUsers, end: true },
    { to: "/rooms", label: "Rooms", icon: FiMapPin },
    { to: "/exchange", label: "Exchange rate", icon: FiRepeat },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-slate-950" aria-label="UniMates home">
          <img src="/assets/unimatesLogo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-xl font-semibold tracking-tight">UniMates</span>
          <span className="hidden rounded border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:inline">Students</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navItem}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <NavLink to={user ? "/profile" : "/login"} className={navItem}>
            {user ? <FiUser size={17} aria-hidden="true" /> : <FiLogIn size={17} aria-hidden="true" />}
            {user ? "My account" : "Sign in"}
          </NavLink>
        </nav>

        <button type="button" onClick={() => setIsOpen((open) => !open)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden" aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? "Close menu" : "Open menu"}>
          {isOpen ? <FiX size={23} /> : <FiMenu size={23} />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setIsOpen(false)} className={navItem}>
                <Icon size={18} aria-hidden="true" />{label}
              </NavLink>
            ))}
            <NavLink to={user ? "/profile" : "/login"} onClick={() => setIsOpen(false)} className={navItem}>
              {user ? <FiUser size={18} /> : <FiLogIn size={18} />}{user ? "My account" : "Sign in"}
            </NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}
