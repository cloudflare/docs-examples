'use client';

import { UploadedImage } from '../types';
import { ImagePreview } from './ImagePreview';
import { UploadButton } from './UploadButton';
import { useImageUpload } from './useImageUpload';

interface ImageUploadProps {
  onUploadComplete: (image: UploadedImage) => void;
}

export default function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const {
    selectedImage,
    previewUrl,
    isUploading,
    fileInputRef,
    handleImageChange,
    handleUpload
  } = useImageUpload(onUploadComplete);

  return (
    <div className="grid grid-cols-4 gap-8">
      <div className="col-span-4">
        <ImagePreview 
          previewUrl={previewUrl} 
          onSelectImage={() => fileInputRef.current?.click()} 
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      {selectedImage && (
        <UploadButton 
          isUploading={isUploading} 
          onUpload={handleUpload} 
        />
      )}
    </div>
  );
} 