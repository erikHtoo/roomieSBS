import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>UniMates is a student-run housing board for the SBS community.</p>
        <nav className="flex gap-5" aria-label="Legal">
          <Link to="/privacy" className="hover:text-slate-900 hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-900 hover:underline">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
