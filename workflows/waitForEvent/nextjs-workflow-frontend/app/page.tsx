"use client";

import { useState } from "react";
import ImageUpload from "./components/image-upload/ImageUpload";
import UploadsTable from "./components/UploadsTable";
import { UploadedImage } from "./components/types";
import ArchitectureDiagram from "./components/ArchitectureDiagram";

export default function Home() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleImageUpdate = (updatedImage: UploadedImage) => {
    setUploadedImages((prev) => {
      const existingIndex = prev.findIndex(
        (img) => img.instanceId === updatedImage.instanceId
      );
      if (existingIndex >= 0) {
        // Update existing image
        const newImages = [...prev];
        newImages[existingIndex] = updatedImage;
        return newImages;
      } else {
        // Add new image
        return [...prev, updatedImage];
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 p-12 max-w-7xl mx-auto bg-[#111] min-h-screen text-gray-200">
      <h1 className="text-5xl font-light text-white/90 text-center">
        Cloudflare Workflows with waitForEvent API
      </h1>
      <p className="text-xl text-center text-white/80">
        Utilize human-in-the-loop with Workflows! Upload an image and approve
        AI-powered tagging{" "}
      </p>
      <ImageUpload onUploadComplete={handleImageUpdate} />
      <UploadsTable uploadedImages={uploadedImages} />
      <ArchitectureDiagram />
    </div>
  );
}
