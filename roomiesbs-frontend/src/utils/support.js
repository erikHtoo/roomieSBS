export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "theforestplaytime@gmail.com";

export const buildReportMailto = ({ contentType, contentId } = {}) => {
  const type = contentType || "safety concern";
  const reference = contentId ? `${type} ${contentId}` : type;
  const subject = `UniMates report: ${reference}`;
  const body = [
    "Please describe what happened:",
    "",
    `Page: ${typeof window !== "undefined" ? window.location.href : ""}`,
    contentId ? `Reference: ${contentId}` : "",
    "",
    "Do not include passwords, payment details, or identity documents.",
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
