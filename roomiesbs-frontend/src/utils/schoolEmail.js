const allowedDomains = (process.env.REACT_APP_ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export const isAllowedSchoolEmail = (email) => {
  if (!allowedDomains.length) return true;
  const domain = email.trim().toLowerCase().split("@").pop();
  return allowedDomains.includes(domain);
};

export const schoolEmailHint = allowedDomains.length
  ? `Use your ${allowedDomains.map((domain) => `@${domain}`).join(" or ")} email.`
  : "Use your school email address.";
