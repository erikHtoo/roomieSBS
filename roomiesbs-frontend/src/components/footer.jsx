import { Link } from "react-router-dom";
import { buildReportMailto } from "../utils/support.js";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>UniMates is a student-run housing board for the SBS community.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Help and legal">
          <Link to="/safety" className="hover:text-slate-900 hover:underline">Safety</Link>
          <a href={buildReportMailto()} className="hover:text-slate-900 hover:underline">Report concern</a>
          <Link to="/privacy" className="hover:text-slate-900 hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-900 hover:underline">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
