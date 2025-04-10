import { useState, useRef } from 'react';
import { UploadedImage, UploadResponse } from '../types';
import { useStatusPolling } from './useStatusPolling';

export const useImageUpload = (onUploadComplete: (image: UploadedImage) => void) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startPolling } = useStatusPolling(onUploadComplete);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL as string, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json() as UploadResponse;
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      
      const newImage = {
        fileName: selectedImage.name,
        status: data.details.status,
        aiTags: undefined,
        instanceId: data.id
      };
      
      onUploadComplete(newImage);
      startPolling(data.id, selectedImage.name);

      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    selectedImage,
    previewUrl,
    isUploading,
    fileInputRef,
    handleImageChange,
    handleUpload
  };
}; 