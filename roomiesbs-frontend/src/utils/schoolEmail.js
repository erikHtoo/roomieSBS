export const schoolEmailDomains = [];

export const isAllowedSchoolEmail = (email) => {
  const cleanEmail = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
};

export const schoolEmailHint = "Use an email address you can access.";
