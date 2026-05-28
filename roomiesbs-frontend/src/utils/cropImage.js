export const createImageFile = (blob, fileName, fileType) =>
  new File([blob], fileName, {
    type: fileType || blob.type || "image/jpeg",
  });

const isDataOrBlobUrl = (value) =>
  typeof value === "string" &&
  (value.startsWith("blob:") || value.startsWith("data:"));

const resolveImageSource = async (url) => {
  if (isDataOrBlobUrl(url)) {
    return { source: url, revoke: null };
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return {
      source: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl),
    };
  } catch {
    return { source: url, revoke: null };
  }
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

export const getCroppedBlob = async (
  imageSrc,
  pixelCrop,
  outputType = "image/jpeg",
) => {
  const { source, revoke } = await resolveImageSource(imageSrc);

  try {
    const image = await createImage(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas context not available");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    context.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        outputType,
        0.95,
      );
    });
  } finally {
    if (revoke) revoke();
  }
};
