import React, { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { FaArrowLeft, FaArrowRight, FaTrash } from "react-icons/fa";
import { createImageFile, getCroppedBlob } from "../utils/cropImage";

const createItem = (file) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file,
  preview: URL.createObjectURL(file),
});

const isBlobUrl = (value) =>
  typeof value === "string" && value.startsWith("blob:");

const moveItem = (items, fromIndex, toIndex) => {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const ImageUploadField = ({
  label = "Upload Images",
  images,
  setImages,
  maxImages = 12,
}) => {
  const inputRef = useRef(null);
  const previousImagesRef = useRef(images);
  const [dragIndex, setDragIndex] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const previousImages = previousImagesRef.current;
    previousImages.forEach((previousImage) => {
      const stillExists = images.some(
        (currentImage) =>
          currentImage.id === previousImage.id &&
          currentImage.preview === previousImage.preview,
      );
      if (!stillExists) {
        if (isBlobUrl(previousImage.preview)) {
          URL.revokeObjectURL(previousImage.preview);
        }
      }
    });
    previousImagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      previousImagesRef.current.forEach((image) => {
        if (isBlobUrl(image.preview)) {
          URL.revokeObjectURL(image.preview);
        }
      });
    },
    [],
  );

  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setImages((currentImages) => {
      const remainingSlots = Math.max(maxImages - currentImages.length, 0);
      const nextItems = files.slice(0, remainingSlots).map(createItem);
      return [...currentImages, ...nextItems];
    });

    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((currentImages) => {
      const next = [...currentImages];
      const [removed] = next.splice(index, 1);
      if (removed && isBlobUrl(removed.preview)) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const openCropper = (index) => {
    const target = images[index];
    if (!target) return;
    setCropTarget({ index, item: target });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeCropper = () => setCropTarget(null);

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const saveCroppedImage = async () => {
    if (!cropTarget || !croppedAreaPixels) return;

    const current = cropTarget.item;
    const croppedBlob = await getCroppedBlob(
      current.preview,
      croppedAreaPixels,
      current.file?.type || "image/jpeg",
    );
    const nextFile = createImageFile(
      croppedBlob,
      current.file?.name || `cropped-${Date.now()}.jpg`,
      current.file?.type || "image/jpeg",
    );
    const nextPreview = URL.createObjectURL(nextFile);

    if (isBlobUrl(current.preview)) {
      URL.revokeObjectURL(current.preview);
    }

    setImages((currentImages) => {
      const next = [...currentImages];
      next[cropTarget.index] = {
        ...current,
        file: nextFile,
        preview: nextPreview,
      };
      return next;
    });

    setCropTarget(null);
  };

  const reorderImage = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setImages((currentImages) => moveItem(currentImages, fromIndex, toIndex));
  };

  const handleDragStart = (index) => setDragIndex(index);
  const handleDrop = (index) => {
    if (dragIndex === null) return;
    reorderImage(dragIndex, index);
    setDragIndex(null);
  };

  return (
    <div className="relative">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium text-gray-700">{label}</h2>
          <span className="text-sm text-gray-500">
            {images.length}/{maxImages}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
              onClick={() => openCropper(index)}
              className="relative w-full h-48 sm:h-52 md:h-56 rounded-lg overflow-hidden border bg-gray-100 group cursor-pointer"
            >
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="object-cover w-full h-full"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />

              <button
                type="button"
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center"
                onClick={(event) => {
                  event.stopPropagation();
                  removeImage(index);
                }}
                title="Remove"
              >
                <FaTrash className="text-[11px]" />
              </button>

              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                <button
                  type="button"
                  className="bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-40"
                  disabled={index === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    reorderImage(index, index - 1);
                  }}
                  title="Move left"
                >
                  <FaArrowLeft className="text-[11px]" />
                </button>
                <button
                  type="button"
                  className="bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-40"
                  disabled={index === images.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    reorderImage(index, index + 1);
                  }}
                  title="Move right"
                >
                  <FaArrowRight className="text-[11px]" />
                </button>
              </div>
            </div>
          ))}

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full h-48 sm:h-52 md:h-56 items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-400 text-4xl hover:border-blue-500 hover:text-blue-500"
            >
              +
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleSelectFiles}
          className="hidden"
        />
      </div>

      {cropTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Crop Image</h3>
              <button
                type="button"
                onClick={closeCropper}
                className="text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="relative h-[60vh] bg-black">
              <Cropper
                image={cropTarget.item.preview}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="px-5 py-4 space-y-4">
              <label className="block text-sm text-gray-600">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCropper}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCroppedImage}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
