interface UploadButtonProps {
  isUploading: boolean;
  onUpload: () => void;
}

export const UploadButton = ({ isUploading, onUpload }: UploadButtonProps) => (
  <div className="col-span-4 flex justify-center">
    <button
      onClick={onUpload}
      disabled={isUploading}
      className={`px-8 py-3 text-lg rounded-full transition-all ${
        isUploading 
          ? 'bg-gray-600 cursor-not-allowed' 
          : 'bg-blue-500/80 hover:bg-blue-500 text-white'
      }`}
    >
      {isUploading ? 'Uploading...' : 'Upload Image'}
    </button>
  </div>
); 