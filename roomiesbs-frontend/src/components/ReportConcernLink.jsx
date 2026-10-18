import { FiFlag } from "react-icons/fi";
import { buildReportMailto } from "../utils/support";

export default function ReportConcernLink({ contentType, contentId, className = "" }) {
  return (
    <a
      href={buildReportMailto({ contentType, contentId })}
      className={`inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 ${className}`}
    >
      <FiFlag aria-hidden="true" />
      Report a concern
    </a>
  );
}
