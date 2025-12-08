// Format number with commas (e.g. 1000000 → 1,000,000)
export const formatNumber = (num) => {
  if (isNaN(num) || num === null || num === "") return "";
  return Number(num).toLocaleString("en-US");
};

// Remove commas (e.g. "1,000,000" → 1000000)
export const parseNumber = (str) => {
  if (!str) return 0;
  return Number(str.toString().replace(/,/g, ""));
};
