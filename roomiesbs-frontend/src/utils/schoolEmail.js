export const schoolEmailDomains = (process.env.REACT_APP_ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export const isAllowedSchoolEmail = (email) => {
  if (!schoolEmailDomains.length) return true;
  const domain = email.trim().toLowerCase().split("@").pop();
  return schoolEmailDomains.includes(domain);
};

export const schoolEmailHint = schoolEmailDomains.length
  ? `Use your ${schoolEmailDomains.map((domain) => `@${domain}`).join(" or ")} email.`
  : "Use your school email address.";
