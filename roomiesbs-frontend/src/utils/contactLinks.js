export const safeFacebookUrl = (value) => {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input) return null;

  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || (host !== "facebook.com" && !host.endsWith(".facebook.com"))) {
      return null;
    }
    return url.toString();
  } catch {
    if (/^[a-zA-Z0-9._-]{1,100}$/.test(input)) {
      return `https://www.facebook.com/${encodeURIComponent(input)}`;
    }
    return null;
  }
};
