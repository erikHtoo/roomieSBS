const parseImageUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const allowedImageHosts = () => {
  const hosts = (process.env.ALLOWED_IMAGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  try {
    hosts.push(new URL(process.env.SUPABASE_URL).hostname.toLowerCase());
  } catch {}

  return new Set(hosts);
};

const getOwnedStoragePath = (value, bucket, ownerId) => {
  try {
    const url = new URL(value);
    const hosts = allowedImageHosts();
    if (url.protocol !== "https:" || !hosts.size || !hosts.has(url.hostname.toLowerCase())) {
      return null;
    }

    const marker = `/storage/v1/object/public/${bucket}/`;
    if (!url.pathname.startsWith(marker)) return null;

    const objectPath = decodeURIComponent(url.pathname.slice(marker.length));
    if (!objectPath.startsWith(`${ownerId}/`) || objectPath.includes("..")) return null;
    return objectPath;
  } catch {
    return null;
  }
};

const isOwnedStorageImageUrl = (value, bucket, ownerId) =>
  Boolean(getOwnedStoragePath(value, bucket, ownerId));

const removeOwnedStorageImages = async (supabase, bucket, values, ownerId) => {
  const paths = parseImageUrls(values)
    .map((value) => getOwnedStoragePath(value, bucket, ownerId))
    .filter(Boolean);

  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) console.error(`Failed to clean ${bucket} images:`, error.message);
};

module.exports = {
  isOwnedStorageImageUrl,
  removeOwnedStorageImages,
};
