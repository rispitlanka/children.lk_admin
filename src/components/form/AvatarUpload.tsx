"use client";

import React, { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { CloseIcon } from "@/icons";
import ProgressBar from "@/components/ui/ProgressBar";

interface AvatarUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImgCircle = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, "image/png");
  });
};

export default function AvatarUpload({
  label = "Avatar",
  value,
  onChange,
  folder = "avatars",
}: AvatarUploadProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc((event.target?.result as string) ?? "");
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const croppedImageUrl = await getCroppedImgCircle(
        imageSrc,
        croppedAreaPixels
      );

      setUploadProgress(30);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: croppedImageUrl,
          folder,
          resource_type: "image",
        }),
      });

      setUploadProgress(90);

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed");
      }

      setUploadProgress(100);
      onChange(data.url);
      setShowCropModal(false);
      setImageSrc("");
      setCroppedAreaPixels(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process image";
      console.error("Error cropping/uploading image:", err);
      alert(`Failed to process image: ${message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-4">
        {value ? (
          <div className="relative">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700">
              <img
                src={value}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1 -top-1 rounded-full bg-error-500 p-1 text-white hover:bg-error-600"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {value ? "Change Avatar" : "Upload Avatar"}
          </label>
        </div>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Crop Avatar
            </h3>
            <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
              />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Zoom: {zoom.toFixed(2)}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            {uploading && (
              <div className="mt-4">
                <ProgressBar
                  progress={uploadProgress}
                  label="Uploading avatar..."
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc("");
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button onClick={handleCropComplete} disabled={uploading}>
                {uploading ? "Uploading..." : "Save Avatar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
