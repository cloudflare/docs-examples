import Image from 'next/image';

interface ImagePreviewProps {
  previewUrl: string | null;
  onSelectImage: () => void;
}

export const ImagePreview = ({ previewUrl, onSelectImage }: ImagePreviewProps) => (
  <div 
    className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 h-60 flex flex-col items-center justify-center cursor-pointer border-2 border-white/10 hover:border-white/20 transition-all group"
    onClick={onSelectImage}
  >
    {previewUrl ? (
      <div className="relative w-full h-full">
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          className="object-contain rounded-2xl"
        />
      </div>
    ) : (
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-light text-white/80 mb-4">Upload Image Area</h2>
        <p className="text-xl text-white/50 group-hover:text-white/60 transition-colors">Click to upload image</p>
      </div>
    )}
  </div>
); 